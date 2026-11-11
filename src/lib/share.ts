// 仅限服务端使用：依赖 BELLE_API_TOKEN，不要在 "use client" 组件里导入
import { isSeasonSlug, type ColorReportData } from "./color-report";
import type { LookbookData, LookbookSheetKey } from "./lookbook";
import { paletteCardUrl } from "./palette-card";

const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";

export interface SharedReport {
  type: string;
  imageUrls: string[];
  /** 结构化色彩报告：没有图片，页面按数据渲染；个性化字段已按分享人的解锁状态在服务端剔除 */
  report?: ColorReportData;
  sourceImageUrl?: string | null;
  /** Lookbook 图（AI 在分享人脸上生成的造型图）：已解锁的有全部清晰图，没解锁的只有预览那一张；没有就不展示 */
  lookbook?: LookbookData | null;
  /** 独立工具（脸型 / 发型 / 眼镜 …）的分享：只有它自己那一章，页面按 lookbook 渲染 */
  lens?: { key: LookbookSheetKey; season: string | null };
}

/**
 * 这份分享的预览图地址（链接卡片 / 系统分享里附带的图）：独立工具是第一张清晰试戴图，图片结果是第一张图；
 * 色彩报告没有可公开的图，用季型品牌色板卡片（固定地址，不含人像）。已签名的地址有有效期，只能实时取，不要缓存。
 */
export function sharedPreviewTarget(shared: SharedReport): string | null {
  if (shared.lens) {
    const tile = shared.lookbook?.sheets.find((sheet) => sheet.key === shared.lens?.key)?.tiles.find((item) => item.url);
    if (tile?.url) return tile.url;
  } else if (!shared.report) {
    return shared.imageUrls[0] ?? null;
  }
  const season = shared.report?.season ?? shared.lens?.season;
  return season && isSeasonSlug(season) ? paletteCardUrl(season) : null;
}

const TOKEN_PATTERN = /^[A-Za-z0-9]{6,16}$/;

/**
 * 读取公开分享页数据（只在服务端调用，访客不会直接访问后端）。
 * 图片 URL 是后端每次实时签名的（未解锁的分享带水印、付费用户的不带），所以不能缓存。
 */
export async function fetchSharedReport(
  token: string,
  options: { countView?: boolean; /** 页面语言对应的报告语言（en / zh-Hans …）：Lookbook 档案文字按它取译文 */ language?: string } = {},
): Promise<SharedReport | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const countView = options.countView ?? true;
  const language = encodeURIComponent(options.language || "en");

  try {
    const res = await fetch(
      `${API_BASE}/common/v1/web/share/${token}?count_view=${countView ? 1 : 0}&language=${language}`,
      {
        headers: { Authorization: `Bearer ${process.env.BELLE_API_TOKEN}` },
        cache: "no-store",
      },
    );
    const json = await res.json();
    if (json?.code !== 200 || !json.data) return null;

    if (json.data.kind === "lens") {
      const lookbook = json.data.lookbook as LookbookData | null;
      const sheet = lookbook?.sheets.find((item) => item.key === json.data.lens);
      // 分析文字和试戴图都还没有（刚创建、分析中）：没有可看的内容
      const hasContent = !!sheet && (sheet.items.length > 0 || sheet.tiles.some((tile) => tile.url) || !!lookbook?.persona || !!lookbook?.glow_up);
      if (!lookbook || !hasContent) return null;
      return {
        type: json.data.type ?? "face_shape",
        imageUrls: [],
        sourceImageUrl: json.data.source_image_url ?? null,
        lookbook: json.data.lookbook as LookbookData,
        lens: { key: json.data.lens as LookbookSheetKey, season: json.data.season ?? null },
      };
    }
    if (json.data.kind === "report" && json.data.report) {
      return {
        type: json.data.type ?? "color_analysis",
        imageUrls: [],
        report: json.data.report as ColorReportData,
        sourceImageUrl: json.data.source_image_url ?? null,
        lookbook: (json.data.lookbook as LookbookData | null) ?? null,
      };
    }
    if (!json.data.image_urls?.length) return null;
    return {
      type: json.data.type ?? "makeup",
      imageUrls: json.data.image_urls,
    };
  } catch {
    return null;
  }
}
