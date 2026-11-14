/**
 * 结构化色彩报告：后端（视觉模型）只返回 JSON，页面由前端按这份数据渲染。
 * 未解锁时后端在数据层剔除个性化字段（explanation / avoid_note / 特征描述 / scores / runner_up），
 * 所以这些字段在类型里都是可选的——拿不到就是真的没有。
 */
import { SEASON_PALETTES } from "./color-palette-data";

export const SEASON_SLUGS = [
  "light-spring", "warm-spring", "bright-spring",
  "light-summer", "cool-summer", "soft-summer",
  "soft-autumn", "warm-autumn", "deep-autumn",
  "deep-winter", "cool-winter", "bright-winter",
] as const;

export type SeasonSlug = (typeof SEASON_SLUGS)[number];

export type Undertone = "cool" | "neutral-cool" | "neutral" | "neutral-warm" | "warm" | "olive";

export interface ReportProse {
  headline: string;
  traits: string[];
  /** 以下字段仅解锁后才有 */
  explanation?: string;
  avoid_note?: string;
  skin_tone?: string;
  hair?: string;
  eyes?: string;
}

export interface ReportScores {
  warmth: number;
  depth: number;
  chroma: number;
  contrast: number;
}

export interface PhotoQuality {
  lighting: "good" | "acceptable" | "poor";
  color_cast: "none" | "warm" | "cool" | "green" | "magenta" | "mixed";
  makeup_or_filter: "none" | "light" | "heavy";
  issues: string[];
  /** 后端已对偏色照片做过白平衡校正再分析（此时 color_cast 记的是校正前的偏色类型） */
  cast_corrected?: boolean;
}

export interface ColorReportData {
  version: number;
  season: SeasonSlug;
  undertone?: Undertone;
  /** [ymin, xmin, ymax, xmax]，0-1000 归一化 */
  face_box?: [number, number, number, number] | null;
  photo_quality?: PhotoQuality;
  primary_language?: string;
  /** 后端标记：未解锁，个性化字段已被剔除 */
  locked?: boolean;
  prose: Record<string, ReportProse>;
  /** 以下字段仅解锁后才有 */
  runner_up?: SeasonSlug;
  scores?: ReportScores;
  hair_looks_dyed?: boolean;
  /** 专属代表色：后端用这个人的评分给本季型 10 个推荐色排的顺序（解锁后才有） */
  signature?: ReportSignature;
}

export interface ReportSignature {
  /** 推荐色下标，最适合这个人的在前（10 个的一个排列） */
  order: number[];
  /** 前 3 个颜色各自呼应的特点，如 "depth_high"；没有就是 null */
  echo: (string | null)[];
}

/** 专属代表色的排序：数据不完整或不是合法排列时返回 null，调用方退回色板原有顺序 */
export function signatureOrder(signature: ReportSignature | undefined, count: number): number[] | null {
  const order = signature?.order;
  if (!order || order.length !== count) return null;
  const seen = new Set(order);
  if (seen.size !== count || order.some((i) => !Number.isInteger(i) || i < 0 || i >= count)) return null;
  return order;
}

/**
 * 锁定的报告免费露出前几个推荐色（和后端 color_report.LOCKED_FREE_COLORS 一致）。
 * 本季型色板是公开数据，所以「只露 3 个」是页面层面的悬念；真正被后端剔除的是个性化字段。
 */
export const FREE_COLOR_COUNT = 3;

/** 浏览器里记住用户的季型（报告页写入，买前扫一扫读取） */
export const MY_SEASON_KEY = "belle_my_season";

export function isSeasonSlug(value: unknown): value is SeasonSlug {
  return typeof value === "string" && (SEASON_SLUGS as readonly string[]).includes(value);
}

/** 该语言的文案；没有就退回报告原始语言，再退回任意一种 */
export function proseFor(report: ColorReportData, lang: string): ReportProse | null {
  return (
    report.prose[lang] ??
    (report.primary_language ? report.prose[report.primary_language] : undefined) ??
    Object.values(report.prose)[0] ??
    null
  );
}

export function seasonPalette(slug: string) {
  return SEASON_PALETTES[slug];
}

/** 报告语言代码 → 站点 locale */
const LANG_TO_LOCALE: Record<string, string> = {
  en: "en", "zh-Hans": "zh", ja: "ja", ko: "ko", es: "es", fr: "fr", de: "de", ru: "ru", tr: "tr",
};

export function localeOfReportLang(lang: string): string {
  return LANG_TO_LOCALE[lang] ?? "en";
}

export const REPORT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh-Hans", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
] as const;

export const LOCALE_TO_REPORT_LANG: Record<string, string> = {
  en: "en", zh: "zh-Hans", ja: "ja", ko: "ko", es: "es", fr: "fr", de: "de", ru: "ru", tr: "tr",
};

/**
 * 脸部特写的裁剪参数：以脸框为中心裁出 aspect（宽/高）比例的区域，全部用源图像素坐标计算，
 * 渲染时把整张图放大到 100%/cropW 宽，再按 -cropL/cropW、-cropT/cropH 平移即可。
 */
export interface FaceCrop {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function faceCrop(
  box: [number, number, number, number] | null | undefined,
  imgW: number,
  imgH: number,
  aspect = 0.8,
  zoom = 2.3,
): FaceCrop {
  if (!box || imgW <= 0 || imgH <= 0) {
    // 没有脸框：取图片上半部分居中（半身照里脸通常在上方）
    const h = Math.min(imgH, imgW / aspect);
    const w = h * aspect;
    return { left: (imgW - w) / 2, top: Math.max(0, imgH * 0.08), width: w, height: Math.min(h, imgH * 0.84) };
  }
  const [ymin, xmin, ymax, xmax] = box;
  const x0 = (xmin / 1000) * imgW;
  const x1 = (xmax / 1000) * imgW;
  const y0 = (ymin / 1000) * imgH;
  const y1 = (ymax / 1000) * imgH;
  const cx = (x0 + x1) / 2;
  // 略微下移：脸框是额头到下巴，下移一点能带上脖颈和肩线，更像杂志封面
  const cy = (y0 + y1) / 2 + (y1 - y0) * 0.12;
  let h = (y1 - y0) * zoom;
  let w = h * aspect;
  if (w > imgW) { w = imgW; h = w / aspect; }
  if (h > imgH) { h = imgH; w = h * aspect; }
  const left = Math.min(Math.max(cx - w / 2, 0), imgW - w);
  const top = Math.min(Math.max(cy - h / 2, 0), imgH - h);
  return { left, top, width: w, height: h };
}
