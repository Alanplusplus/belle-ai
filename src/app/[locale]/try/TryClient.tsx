"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import {
  webInit,
  uploadImage,
  createTask,
  pollUntilDone,
  fetchHistory,
  fetchProcessingTask,
  getCachedUserId,
  createShare,
  unlockReport,
  DEFAULT_LOCK_START,
  type HistoryEntry,
  type ReportResult,
  type WebInitData,
  type AnalysisType as ApiAnalysisType,
} from "@/lib/api";
import {
  buildFallbackShareUrl,
  buildSharePageUrl,
  fetchShareImage,
  sharePhotoPath,
  SHARE_BUTTONS_ENABLED,
  tagShareLink,
} from "@/lib/shareLink";
import { SITE_URL, ADDON_CREDITS, packCreditsFor } from "@/lib/constants";
import { formatRetestDate, isCreditsOnlyType, isKitHeroType, remainingFor } from "@/lib/kit";
import { usePrices } from "@/lib/usePrices";
import { trackEvent, trackCheckoutEvent, trackFeedbackSubmitted, saveReportFeedback } from "@/lib/analytics";
import { consumeCheckoutContext } from "@/lib/checkout";
import { prepareImageForUpload, IMAGE_TOO_LARGE } from "@/lib/imageUpload";
import { isMobileDevice, copyText, nativeShare, openShareWindow } from "@/lib/device";
import { RESULT_READY_EVENT } from "@/lib/google-signin";
import { useSignIn } from "@/lib/useSignIn";
import { useDialogA11y } from "@/lib/useDialogA11y";
import { PricingModal } from "@/components/PricingModal";
import { InAppBrowserNotice, InAppSignInSheet } from "@/components/InAppBrowserNotice";
import { ReportPanel } from "@/components/ReportPanel";
import { HistoryReportCard } from "@/components/ColorReport";
import { LensPanel } from "@/components/LensPanel";
import { lensOf, waitForLensText, type LookbookSheetKey } from "@/lib/lookbook";
import { DevUnlockToggle } from "@/components/DevUnlockToggle";
import { isSeasonSlug, type ColorReportData } from "@/lib/color-report";
import { useReportMessages } from "@/lib/report-messages";
import { loadDemoReport, useDemoPersonaData, type DemoPersonaData } from "@/lib/demo-report";
import { personaPhoto, personaSeason, resolvePersona, type DemoPersonaId } from "@/lib/demo-personas";
import { SamplePersonaPicker } from "@/components/SamplePersonaPicker";

const MAX_PHOTO_BYTES = 25 * 1024 * 1024;

interface LightboxState {
  entry: HistoryEntry;
  imageIndex: number;
}

type AnalysisType = ApiAnalysisType;
type Phase =
  | "idle"
  | "preparing"
  | "uploading"
  | "generating"
  | "done"
  | "error"
  | "no_quota";

/** 可以直接在这个页面选择、上传一张自拍就能生成的类型 */
const PICKABLE_TYPES: AnalysisType[] = [
  "makeup", "color_analysis", "face_shape", "hair_preview", "outfit_color",
  "glasses_match", "occasion_makeup", "jewelry_guide", "glow_up_report",
  "style_personality", "palette_scan", "scan_tryon",
];

/**
 * 所有会出现在这个页面上的类型（给结果页标题、历史记录取名用）。
 * scan_tryon（真人试穿）：本人照片 + 单品照片两张图，没有免费次数、只用积分；
 * 既可以在这里作为独立工具主动发起，也可以从「买前扫一扫」带着单品跳过来（这里负责展示进度 / 结果）。
 */
const ALL_VALID_TYPES: AnalysisType[] = [...PICKABLE_TYPES, "celebrity_match"];

/** 试穿可以选的单品类别（与后端 tryon_prompts.TRYON_MODES 保持一致），按「穿的 / 戴的 / 妆发」排好 */
const TRYON_CATEGORIES = [
  "top", "bottom", "dress", "outerwear", "knitwear", "scarf",
  "accessory", "jewelry", "lipstick", "blush", "eyeshadow", "hair_color",
] as const;
/** auto：不选类型，让 AI 看单品照片自己判断怎么试（默认选项） */
type TryOnCategory = (typeof TRYON_CATEGORIES)[number] | "auto";

/**
 * 试穿的示例（public/demo/tryon）：AI 模特的自拍 + 单品 → 试穿后的效果图，都是用正式的试穿提示词跑出来的。
 * 自拍是头肩特写，所以只挑「围 / 戴 / 涂」这类不需要露出全身的单品。
 */
const TRYON_EXAMPLES = ["scarf", "lipstick", "jewelry"] as const;

/** 单品照片也要压缩上传，沿用自拍的流程；这里只放常量 */
const TRYON_DEFAULT_RESOLUTION: Resolution = "2K";

function IconPalette() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>; }
function IconShirt() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>; }
function IconFace() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>; }
function IconScissors() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm9.304 0l-1.536.887M17.152 8.25a3 3 0 105.196-3 3 3 0 00-5.196 3zM12 18.75l-3.537-5.29m3.537 5.29l3.537-5.29M12 18.75l-7.5-10.5h15l-7.5 10.5z" /></svg>; }
function IconGlasses() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function IconLipstick() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>; }
function IconSparkle() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>; }
function IconGem() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 5v8l-8 5-8-5V8l8-5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M4 8l8 5 8-5" /></svg>; }
function IconCompare() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>; }
function IconTryOn() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function IconMirror() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="10" r="6" /><path strokeLinecap="round" d="M12 16v5M9 21h6" /></svg>; }

interface AnalysisTypeGroup {
  category: string;
  items: { value: AnalysisType; icon: React.ReactNode }[];
}

const ANALYSIS_TYPE_GROUPS: AnalysisTypeGroup[] = [
  {
    category: "discover_colors",
    items: [
      { value: "color_analysis", icon: <IconPalette /> },
      { value: "outfit_color", icon: <IconShirt /> },
      // 真人试穿：持续服务的核心功能，独立成工具，没有免费次数，只用积分
      { value: "scan_tryon", icon: <IconTryOn /> },
    ],
  },
  {
    category: "find_style",
    items: [
      { value: "face_shape", icon: <IconFace /> },
      { value: "hair_preview", icon: <IconScissors /> },
      { value: "glasses_match", icon: <IconGlasses /> },
      { value: "style_personality", icon: <IconMirror /> },
    ],
  },
  {
    // 所有工具都是同样的价格（文字分析免费，效果图 1 积分一章），不再有单独的「高级」分组
    category: "get_look",
    items: [
      { value: "makeup", icon: <IconLipstick /> },
      { value: "occasion_makeup", icon: <IconSparkle /> },
      { value: "jewelry_guide", icon: <IconGem /> },
      { value: "glow_up_report", icon: <IconCompare /> },
    ],
  },
];

/** 类型 → 图标（历史记录封面用） */
const TYPE_ICONS: Record<string, React.ReactNode> = Object.fromEntries(
  ANALYSIS_TYPE_GROUPS.flatMap((group) => group.items.map((item) => [item.value, item.icon])),
);

const OCCASIONS = [
  { value: "date_night", label: "Date Night" },
  { value: "interview", label: "Interview" },
  { value: "wedding_guest", label: "Wedding Guest" },
  { value: "festival", label: "Festival" },
  { value: "office", label: "Office" },
  { value: "evening_gala", label: "Evening Gala" },
  { value: "brunch", label: "Brunch" },
  { value: "vacation", label: "Vacation" },
];

type Resolution = "1K" | "2K" | "4K";

const REPORT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh-Hans", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
];

const LOCALE_TO_REPORT_LANG: Record<string, string> = {
  en: "en", zh: "zh-Hans", ja: "ja", ko: "ko", es: "es", fr: "fr",
  de: "de", ru: "ru", tr: "tr",
};

const PREFS_KEY = "belle_try_prefs";
const LAST_PHOTO_KEY = "belle_last_photo_url";

function loadPrefs(): { resolution: Resolution; reportLang: string | null } {
  if (typeof window === "undefined") return { resolution: "1K", reportLang: null };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { resolution: "1K", reportLang: null };
}

function savePrefs(resolution: Resolution, reportLang: string) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ resolution, reportLang })); } catch {}
}

function saveLastPhotoUrl(url: string) {
  try { localStorage.setItem(LAST_PHOTO_KEY, url); } catch {}
}

function loadLastPhotoUrl(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(LAST_PHOTO_KEY); } catch { return null; }
}

const RECOMMENDED_TYPES: Record<AnalysisType, AnalysisType[]> = {
  makeup: ["color_analysis", "face_shape", "occasion_makeup"],
  color_analysis: ["outfit_color", "hair_preview", "makeup"],
  face_shape: ["glasses_match", "hair_preview", "makeup"],
  hair_preview: ["color_analysis", "outfit_color", "makeup"],
  outfit_color: ["color_analysis", "jewelry_guide", "style_personality"],
  glasses_match: ["face_shape", "style_personality", "jewelry_guide"],
  occasion_makeup: ["color_analysis", "jewelry_guide", "outfit_color"],
  jewelry_guide: ["outfit_color", "color_analysis", "glow_up_report"],
  glow_up_report: ["style_personality", "occasion_makeup", "outfit_color"],
  style_personality: ["outfit_color", "glow_up_report", "makeup"],
  palette_scan: ["color_analysis", "outfit_color", "makeup"],
  celebrity_match: ["style_personality", "makeup", "hair_preview"],
  scan_tryon: ["outfit_color", "color_analysis", "hair_preview"],
};

const CARD_IMAGES: Record<AnalysisType, string> = {
  makeup: "/images/card_makeup.webp",
  color_analysis: "/images/card_color_analysis.webp",
  face_shape: "/images/card_face_shape.webp",
  hair_preview: "/images/card_hair.webp",
  outfit_color: "/images/card_outfit.webp",
  glasses_match: "/images/card_glasses.webp",
  occasion_makeup: "/images/card_occasion.webp",
  jewelry_guide: "/images/card_jewelry.webp",
  glow_up_report: "/images/card_glow_up.webp",
  style_personality: "/images/card_style.webp",
  palette_scan: "/images/card_color_analysis.webp",
  celebrity_match: "/images/card_celebrity.webp",
  scan_tryon: "/images/card_outfit.webp",
};


/** 演示模式的「生成」只放一个很短的动画：流程完整，但不让人干等 */
const DEMO_DELAY_MS = 1600;

interface BackgroundTask {
  id: string;
  /** 后端任务 ID（解锁、分享需要）；id 是前端自己生成的本地标识 */
  taskId?: string;
  type: AnalysisType;
  phase: "uploading" | "generating" | "done" | "error";
  resultUrls: string[];
  locked?: boolean;
  unlocked?: boolean;
  lockStart?: number;
  errorMsg?: string;
  /** 色彩分析是结构化报告：没有图片，页面按数据渲染 */
  report?: ColorReportData;
  sourceUrl?: string;
}

/** 额度分三类显示：免费预览额度、套餐积分（套装 / 加购包买来的，加上老的赠送积分）、报告额度（只解锁色彩报告） */
interface UserCredits {
  /** 主打产品的免费预览额度剩余 */
  free: number;
  /** 套餐积分：每章试戴图 1 积分（后端已把老的签到 / 邀请赠送积分合并进来） */
  pack: number;
  /** 报告额度：买色彩报告得到的，只用来解锁 / 生成色彩分析的完整报告，不是积分 */
  report: number;
  totalRemaining: number;
  /** 免费小工具还剩几次 */
  toolsFree: number;
  /** 买过套装 / 积分包：积分用完后展示加购包而不是再卖一次套装 */
  hasPurchased: boolean;
  /** 解锁后 14 天内还能免费重测（色彩分析）几次，0 = 不可用 */
  retestLeft: number;
  /** 免费重测的到期时间（unix 秒）；没有重测资格时为 null */
  retestExpiresAt: number | null;
}

function toUserCredits(data: WebInitData): UserCredits {
  return {
    free: data.web_quota.remaining,
    pack: data.pack_credits ?? 0,
    report: data.report_credits ?? 0,
    totalRemaining: data.total_remaining ?? data.web_quota.remaining,
    toolsFree: data.tools_quota?.remaining ?? 0,
    hasPurchased: data.has_purchased ?? false,
    retestLeft: data.retest?.available ? (data.retest.left ?? 0) : 0,
    retestExpiresAt: data.retest?.available ? (data.retest.expires_at ?? null) : null,
  };
}

/** 与后端 _credit_cost 保持一致：所有类型都是 1 积分（独立工具的试戴也是 1 积分一章） */
function creditCostOf(type: string): number {
  return type ? 1 : 1; // 价格按类型取的接口保留：以后哪个类型要涨价，只改这里
}

/**
 * 这个类型现在还能不能开始分析（和 remainingFor 一个口径，只是用已经取到的 UserCredits 算）：
 * 色彩分析的完整报告用报告额度，其余类型用套餐积分；免费额度池照常算（真人试穿没有免费次数，只看积分）。
 */
function startableCount(c: UserCredits, type: string): number {
  const charge = type === "color_analysis" ? c.report : c.pack;
  if (type === "color_analysis" && c.retestLeft > 0) return Math.max(1, charge);
  if (isCreditsOnlyType(type)) return charge;
  return (isKitHeroType(type) ? c.free : c.toolsFree) + charge;
}

/** 有完整示例的类型：色彩分析 + 所有「分析 + 试戴」的独立工具（示例数据见 /demo/personas/） */
function isDemoType(type: string): boolean {
  return type === "color_analysis" || !!lensOf(type);
}

function lockStateOf(result: Pick<ReportResult, "locked" | "unlocked" | "lockStart">): ResultLock {
  return { locked: result.locked, unlocked: result.unlocked, lockStart: result.lockStart };
}

/** 当前结果页上的结构化报告（色彩分析）；图片类报告没有 */
interface ResultReportState {
  report: ColorReportData;
  sourceUrl: string | null;
  createdAt: number;
}

function reportStateOf(result: Pick<ReportResult, "report" | "sourceImageUrl">): ResultReportState | null {
  return result.report ? { report: result.report, sourceUrl: result.sourceImageUrl ?? null, createdAt: Date.now() / 1000 } : null;
}

/** 轮询抛出的错误码（后端任务失败原因）→ 提示文案的 key */
function generateErrorKey(message: string): "errorNoFace" | "errorGenerate" {
  return message === "no_face" ? "errorNoFace" : "errorGenerate";
}

/** 创建任务时被生成前审核（Prompt Sift）拒绝：422 = 内容不合规，503 = 审核暂不可用；其它返回 null */
function contentCheckErrorKey(code: number | undefined): "errorContentBlocked" | "errorContentUnavailable" | null {
  if (code === 422) return "errorContentBlocked";
  if (code === 503) return "errorContentUnavailable";
  return null;
}

/** 色彩分析和独立工具的分析都是结构化文字，十几秒就能出：轮询间隔缩短，让结果尽快出现（图片类仍是 10 秒一次） */
function pollOptionsFor(type: string): [number, number] {
  if (lensOf(type)) return [60, 3000];
  return type === "color_analysis" ? [45, 4000] : [60, 10000];
}

/**
 * 等一次分析做完。独立工具分两步：先出色彩报告（季型），再写这一章的文字建议并译成用户的语言；
 * 两步都好了才算「完成」，进度卡片里按步骤展示，用户看到的是一次加载、一次出齐。
 * onReportReady：第一步好了（带着季型）；第二步最多等 150 秒，超时就先进结果页，结果页会接着等。
 */
async function pollAnalysis(
  taskId: string,
  type: string,
  language: string,
  onReportReady?: (season: string) => void,
): Promise<ReportResult> {
  const result = await pollUntilDone(taskId, undefined, ...pollOptionsFor(type));
  if (lensOf(type)) {
    onReportReady?.(result.report?.season ?? "");
    await waitForLensText(taskId, language);
  }
  return result;
}

interface ResultLock {
  locked: boolean;
  unlocked: boolean;
  lockStart: number;
}

const NO_LOCK: ResultLock = { locked: false, unlocked: false, lockStart: DEFAULT_LOCK_START };
/** 演示报告是预先生成好的完整图，不打码、不用解锁 */
const DEMO_LOCK: ResultLock = { locked: false, unlocked: true, lockStart: DEFAULT_LOCK_START };

export function TryClient({
  locale,
  initialType,
  initialPersona,
  autoSample = false,
}: {
  locale: string;
  initialType?: string;
  /** ?persona=：指定示例展示哪位人物（内容页按色彩家族挑好、分享链接带上）；不指定就按语言取默认人物 */
  initialPersona?: string;
  /** 从内容页的「先看示例」入口进来（?sample=1）：落地后直接展示该类型的完整示例，不用再点一下 */
  autoSample?: boolean;
}) {
  const t = useTranslations("tryPage");
  const tKit = useTranslations("kit");
  const pageLocale = useLocale();

  const validInitialType = (PICKABLE_TYPES.includes(initialType as AnalysisType) ? initialType : "color_analysis") as AnalysisType;

  const [phase, setPhase] = useState<Phase>("idle");
  const [analysisType, setAnalysisType] = useState<AnalysisType>(validInitialType);
  const [occasion, setOccasion] = useState("date_night");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [quota, setQuota] = useState<{ total: number; used: number; remaining: number } | null>(null);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  // 当前结果卡片的锁定状态：locked=细节被服务端打码；unlocked=完整可下载
  const [resultLock, setResultLock] = useState<ResultLock>(NO_LOCK);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // 一进页面就是「加载中」，直到第一次取到记录：记录页直接打开时不会先闪一下「还没有记录」
  const [historyLoading, setHistoryLoading] = useState(true);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [correctionModal, setCorrectionModal] = useState<HistoryEntry | null>(null);
  const [shareModal, setShareModal] = useState<{ imageUrl: string; link: string; report?: boolean } | null>(null);
  // 当前结果页对应的任务 ID：创建公开分享链接时需要
  const [resultTaskId, setResultTaskId] = useState<string | null>(null);
  const [resultReport, setResultReport] = useState<ResultReportState | null>(null);
  const shareBusyRef = useRef(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingSource, setPricingSource] = useState("unknown");
  // 从锁定报告点进来时，付费弹窗里展示这份报告的打码预览，让用户知道买的是什么
  const [pricingPreview, setPricingPreview] = useState<string | null>(null);
  // 同时记下是哪份报告：买完回到页面后，自动用积分解锁它
  const [pricingTaskId, setPricingTaskId] = useState<string | null>(null);
  // 买什么：色彩报告（套装，单独购买）还是积分（试戴图）；以及买完回到哪份「分析 + 试戴」结果
  const [pricingIntent, setPricingIntent] = useState<"report" | "credits" | undefined>(undefined);
  const [pricingOpenTaskId, setPricingOpenTaskId] = useState<string | null>(null);
  const { money } = usePrices();
  // 锁定报告上的按钮直接标套装价（解锁报告 + 10 个积分）：用户点开弹窗前就知道多少钱，不会在弹窗里被价格吓退
  const kitPrice = money("kit");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "confirming" | "success" | "delayed">("idle");
  // 到账后的提示：kit / addon 说明到账了多少积分（停售前下单的单份 / 积分包按 addon 提示）
  const [checkoutBought, setCheckoutBought] = useState<{ kind: "kit" | "addon"; unlocked: boolean; credits: number }>({
    kind: "kit",
    unlocked: false,
    credits: 0,
  });
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
  const [lastUploadedPhotoUrl, setLastUploadedPhotoUrl] = useState<string | null>(null);
  const [showTaskPanel, setShowTaskPanel] = useState(false);

  const [resolution, setResolution] = useState<Resolution>("1K");
  const [reportLang, setReportLang] = useState(LOCALE_TO_REPORT_LANG[locale] || "en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [generateElapsed, setGenerateElapsed] = useState(0);
  // 独立工具的分析分两步：色彩报告（季型）先好，再写这一章的文字建议；第一步好了记下季型，进度卡片据此切到第二步
  const [lensStage, setLensStage] = useState<{ season: string } | null>(null);
  const reportMessages = useReportMessages(reportLang);

  // 分析记录和做分析分开：?view=history 是记录页（色彩报告很长，记录放在页面最底下要滚很久）。
  // 用 pushState 切换（Next 会把它同步给 useSearchParams），做分析的状态不会丢，浏览器后退也能回来
  const searchParams = useSearchParams();
  const view: "tool" | "history" = searchParams.get("view") === "history" ? "history" : "tool";
  const openView = useCallback((next: "tool" | "history") => {
    const params = new URLSearchParams(window.location.search);
    if (next === "history") params.set("view", "history");
    else params.delete("view");
    const qs = params.toString();
    window.history.pushState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    window.scrollTo({ top: 0 });
  }, []);
  // 上传阶段拆成「压缩」和「上传」两步，大图在手机上压缩要几秒，用户需要知道在做什么
  const [uploadStage, setUploadStage] = useState<"compressing" | "uploading">("compressing");
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  // 示例照片演示模式：不上传、不扣积分、不请求后端，直接展示预先生成好的完整示例报告
  const [demoMode, setDemoMode] = useState(false);
  const demoTimerRef = useRef<number | null>(null);
  const demoTypeRef = useRef<AnalysisType>(validInitialType);
  // 示例人物：默认按语言取（中日韩是东亚人物），用户可以在选择条里换成更像自己的；换人后新报告到之前继续显示上一位（demoData 的 id 跟着数据走）
  const [persona, setPersona] = useState<DemoPersonaId>(() => resolvePersona(initialPersona, locale));
  const personaRef = useRef<DemoPersonaId>(persona);
  const demoData = useDemoPersonaData(persona);
  const demoDataRef = useRef<DemoPersonaData | null>(null);
  useEffect(() => {
    demoDataRef.current = demoData;
  }, [demoData]);
  /** 每次进入 / 退出示例加 1：慢网络下报告还在读取时用户已经退出或重来，旧的读取结果就不再落地 */
  const demoRunRef = useRef(0);
  const shownPersona: DemoPersonaId = demoData?.id ?? persona;
  const samplePhoto = personaPhoto(shownPersona);
  /** 有结果可看：图片类是报告图，色彩分析是结构化报告 */
  const hasResult = resultUrls.length > 0 || resultReport !== null;

  const fileRef = useRef<HTMLInputElement>(null);
  // 手机上有「拍一张自拍」和「从相册选择」两个入口（两个 input），所以不能再从某个 input 的 files 里取文件
  const cameraRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  // 真人试穿（scan_tryon）要的第二张图：单品照片 + 它是什么品类。已上传的地址留着，失败重试不重复上传
  const itemInputRef = useRef<HTMLInputElement>(null);
  const itemFileRef = useRef<File | null>(null);
  const itemUrlRef = useRef<string | null>(null);
  const [itemPreviewUrl, setItemPreviewUrl] = useState<string | null>(null);
  const [itemCategory, setItemCategory] = useState<TryOnCategory>("auto");

  // 手机上结果/进度卡片排在上传区下面：生成开始、出结果、出错时需要主动滚到它，否则用户只看到按钮上的转圈
  // 「更多工具」面板：色彩分析是主打，其余工具收在这里，默认折起来
  const [showMoreTools, setShowMoreTools] = useState(false);
  // 看完很长的示例后「回去试自己的」：起始卡片是否已滚出视口、示例底部的行动区是否在视口里、上传框的短暂高亮
  const startAnchorRef = useRef<HTMLDivElement>(null);
  const exampleEndRef = useRef<HTMLDivElement>(null);
  const [pastStart, setPastStart] = useState(false);
  const [atExampleEnd, setAtExampleEnd] = useState(false);
  const [uploadPulse, setUploadPulse] = useState(false);
  const [saveImageUrl, setSaveImageUrl] = useState<string | null>(null);
  const { status: authStatus } = useSession();
  const signIn = useSignIn();
  const [saveSubDismissed, setSaveSubDismissed] = useState(false);
  const resultSectionRef = useRef<HTMLDivElement>(null);
  const noQuotaRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(false);

  const scrollToElement = useCallback((el: HTMLElement | null) => {
    if (!el || typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToResult = useCallback(() => {
    autoScrollRef.current = true;
    scrollToElement(resultSectionRef.current);
  }, [scrollToElement]);

  const resumedRef = useRef(false);

  useEffect(() => {
    if (phase === "no_quota") {
      autoScrollRef.current = false;
      // 额度墙卡片刚渲染，等下一帧再滚动
      const id = window.requestAnimationFrame(() => scrollToElement(noQuotaRef.current));
      return () => window.cancelAnimationFrame(id);
    }
    if (!autoScrollRef.current) return;
    if (phase === "done" || phase === "error") {
      autoScrollRef.current = false;
      const id = window.requestAnimationFrame(() => scrollToElement(resultSectionRef.current));
      return () => window.cancelAnimationFrame(id);
    }
  }, [phase, scrollToElement]);

  useEffect(() => {
    setLastUploadedPhotoUrl(loadLastPhotoUrl());
    const prefs = loadPrefs();
    if (prefs.reportLang && REPORT_LANGUAGES.some((l) => l.code === prefs.reportLang)) setReportLang(prefs.reportLang);
    if (prefs.resolution) setResolution(prefs.resolution);
  }, []);

  // 出结果后通知全局：匿名用户会在几秒后看到一次 Google One Tap（保存记录/订阅）
  useEffect(() => {
    // 演示报告不算真实结果：不触发「保存记录 / 订阅」的 One Tap
    if (phase === "done" && hasResult && !demoMode) {
      window.dispatchEvent(new Event(RESULT_READY_EVENT));
    }
  }, [phase, hasResult, demoMode]);

  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;

    webInit().then((initRes) => {
      if (initRes.code === 200 && initRes.data) {
        const data = initRes.data;
        setQuota(data.web_quota);
        setUserCredits(toUserCredits(data));
        Promise.all([fetchHistory(1, 20, LOCALE_TO_REPORT_LANG[locale] || "en"), fetchProcessingTask()])
          .then(([historyRes, procRes]) => {
            if (historyRes.code === 200 && historyRes.data?.list) {
              setHistory(historyRes.data.list);
            }
            const pendingTask = procRes.data?.task;
            if (pendingTask) {
              setAnalysisType(pendingTask.type as AnalysisType);
              setPhase("generating");
              pollAnalysis(pendingTask.task_id, pendingTask.type, loadPrefs().reportLang || reportLang, (season) => setLensStage({ season }))
                .then((result) => {
                  setResultUrls(result.urls);
                  setResultReport(reportStateOf(result));
                  setResultLock(lockStateOf(result));
                  setResultTaskId(pendingTask.task_id);
                  setPhase("done");
                  reloadHistory();
                })
                .catch((err) => {
                  setErrorMsg(err instanceof Error && err.message === "no_face" ? t("errorNoFace") : err instanceof Error ? err.message : "Resume failed");
                  setPhase("error");
                });
            }
          })
          .finally(() => setHistoryLoading(false));
      } else {
        setHistoryLoading(false);
      }
    }).catch(() => setHistoryLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 从「名人匹配」页进来的访客想看的是同季名人：名人匹配已经并入色彩报告（文字 + 色板），
  // 报告出来后直接滚到「同季名人」那一章。这一章在报告里按需加载，所以等它出现了再滚
  const celebrityFocusDone = useRef(false);
  useEffect(() => {
    if (initialType !== "celebrity_match" || celebrityFocusDone.current) return;
    if (phase !== "done" || !resultReport) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const section = document.getElementById("report-celebrities");
      if (section) {
        celebrityFocusDone.current = true;
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (section || ++tries >= 15) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  }, [initialType, phase, resultReport]);

  useEffect(() => {
    const isGenerating = phase === "uploading" || phase === "generating" || phase === "preparing";
    if (!isGenerating) return;
    const handler = () => trackEvent("page_leave_during_generation", { type: analysisType, phase });
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase, analysisType]);

  useEffect(() => {
    const isGenerating = phase === "uploading" || phase === "generating" || phase === "preparing";
    if (!isGenerating) {
      setGenerateElapsed(0);
      return;
    }
    const timer = setInterval(() => {
      setGenerateElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const reloadHistory = useCallback(() => {
    fetchHistory(1, 20, LOCALE_TO_REPORT_LANG[locale] || "en").then((res) => {
      if (res.code === 200 && res.data?.list) {
        setHistory(res.data.list);
      }
    });
  }, [locale]);

  /**
   * 按意图打开付费墙（点解锁 / 额度用完 / 积分角标 …），source 用于归因。
   * intent：report = 买色彩报告（先看套装）；credits = 买积分（试戴图，先看积分包）；taskId = 要解锁的色彩报告，openTaskId = 买完回到的试戴结果
   */
  const openPricing = useCallback((source: string, previewImage?: string | null, taskId?: string | null, opts?: { intent?: "report" | "credits"; openTaskId?: string | null }) => {
    trackEvent("pricing_modal_opened", { source, intent: opts?.intent ?? "auto" });
    setPricingSource(source);
    setPricingPreview(previewImage ?? null);
    setPricingTaskId(taskId ?? null);
    setPricingIntent(opts?.intent);
    setPricingOpenTaskId(opts?.openTaskId ?? null);
    setShowPricingModal(true);
  }, []);

  /** 生成 / 解锁之后，从服务端同步最新的三类积分 */
  const refreshCredits = useCallback(async () => {
    try {
      const res = await webInit();
      if (res.code === 200 && res.data) {
        setQuota(res.data.web_quota);
        setUserCredits(toUserCredits(res.data));
      }
    } catch {
      /* 同步失败不影响主流程，下次操作会再同步 */
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMsg(message);
    window.setTimeout(() => setToastMsg(null), 3500);
  }, []);

  /** 解锁成功后把新的（无打码）图片同步到当前结果、后台任务和已打开的大图 */
  const applyUnlocked = useCallback((taskId: string, imageUrls: string[], report?: ColorReportData) => {
    if (taskId === resultTaskId) {
      setResultUrls(imageUrls);
      if (report) setResultReport((prev) => (prev ? { ...prev, report } : prev));
      setResultLock((prev) => ({ ...prev, locked: false, unlocked: true }));
    }
    setBackgroundTasks((prev) => prev.map((task) => (
      task.taskId === taskId ? { ...task, resultUrls: imageUrls, report: report ?? task.report, locked: false, unlocked: true } : task
    )));
    setLightbox((prev) => (
      prev && prev.entry.id === taskId
        ? { ...prev, entry: { ...prev.entry, image_urls: imageUrls, report: report ?? prev.entry.report, locked: false, unlocked: true } }
        : prev
    ));
    reloadHistory();
  }, [resultTaskId, reloadHistory]);

  /**
   * 点击锁定的色彩报告上的「解锁」：色彩报告单独购买，不花积分。
   * - 账户里有报告额度（买过报告还没用掉）：直接用它解锁这份报告
   * - 没有：打开付费弹窗买报告（套装）；买完回到页面后自动解锁
   */
  const handleUnlock = useCallback(async (taskId: string | null | undefined, type: string, previewImage?: string | null) => {
    const reportCredits = userCredits?.report ?? 0;
    trackEvent("locked_cta_clicked", { type, has_report_credit: reportCredits > 0 });
    // 没有报告额度的老图片类报告仍是用积分解锁（只是历史记录里的旧结果）
    const spendable = type === "color_analysis" ? reportCredits : (userCredits?.pack ?? 0);
    const cost = creditCostOf(type);
    if (!taskId || spendable < cost) {
      openPricing("report_lock", previewImage, taskId, { intent: type === "color_analysis" ? "report" : "credits" });
      return;
    }
    if (unlockingId) return;
    setUnlockingId(taskId);
    try {
      const res = await unlockReport(taskId);
      if (res.code === 200 && res.data?.unlocked) {
        applyUnlocked(taskId, res.data.image_urls, res.data.report);
        trackEvent("report_unlocked_with_credits", { type, cost: res.data.credit_cost ?? cost });
        refreshCredits();
      } else if (res.code === 429) {
        openPricing("report_lock", previewImage, taskId, { intent: type === "color_analysis" ? "report" : "credits" });
      } else {
        showToast(t("unlockFailed"));
      }
    } catch {
      showToast(t("unlockFailed"));
    } finally {
      setUnlockingId(null);
    }
  }, [userCredits, unlockingId, openPricing, applyUnlocked, refreshCredits, showToast, t]);

  // 从 Waffo 支付页返回（successUrl 带 ?checkout=success）：
  // 积分由 webhook 异步写入，这里轮询状态，看 pack_credits 是否比下单前增加；
  // 到账后刷新额度与历史记录
  const checkoutHandledRef = useRef(false);
  useEffect(() => {
    if (checkoutHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    checkoutHandledRef.current = true;

    const ctx = consumeCheckoutContext();
    trackEvent("checkout_returned", { product: ctx?.product, source: ctx?.source });

    // 清掉地址栏参数，避免刷新页面时重复触发
    params.delete("checkout");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));

    setCheckoutStatus("confirming");
    (async () => {
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        try {
          const res = await webInit();
          const data = res.data;
          // 套装 / 加购包（以及停售前下单的单份 / 积分包）都按积分到账判断
          const packArrived = (data?.pack_credits ?? 0) > (ctx?.packBefore ?? 0);
          const addedCredits = packCreditsFor(ctx?.product);
          if (res.code === 200 && data && packArrived) {
            setQuota(data.web_quota);
            setUserCredits(toUserCredits(data));
            reloadHistory();
            trackCheckoutEvent("checkout_completed", { product: ctx?.product, source: ctx?.source });

            // 买报告就是为了看某份被锁的色彩报告：到账后直接用买到的报告额度把它解锁并打开，不让用户再多点一步
            let unlockedAfterPurchase = false;
            let creditsNow = data.pack_credits ?? 0;
            if (addedCredits != null && ctx?.unlockTaskId) {
              try {
                const unlockRes = await unlockReport(ctx.unlockTaskId);
                if (unlockRes.code === 200 && unlockRes.data?.unlocked) {
                  unlockedAfterPurchase = true;
                  creditsNow = unlockRes.data.pack_credits ?? creditsNow;
                  trackEvent("report_unlocked_with_credits", { source: "after_purchase" });
                  const [histRes] = await Promise.all([fetchHistory(1, 20, LOCALE_TO_REPORT_LANG[locale] || "en"), refreshCredits()]);
                  const list = histRes.data?.list;
                  if (histRes.code === 200 && list) {
                    setHistory(list);
                    const entry = list.find((item) => item.id === ctx.unlockTaskId);
                    if (entry) setLightbox({ entry, imageIndex: 0 });
                  }
                }
              } catch {
                /* 自动解锁失败不影响到账：用户可以在报告上手动点「解锁」 */
              }
            }
            // 买积分是为了解锁某个分析的试戴图：回到那份结果，积分留给用户自己点「试戴」（不替他花）
            if (addedCredits != null && ctx?.openTaskId) {
              try {
                const [histRes] = await Promise.all([fetchHistory(1, 20, LOCALE_TO_REPORT_LANG[locale] || "en"), refreshCredits()]);
                const list = histRes.data?.list;
                if (histRes.code === 200 && list) {
                  setHistory(list);
                  const entry = list.find((item) => item.id === ctx.openTaskId);
                  if (entry) setLightbox({ entry, imageIndex: 0 });
                }
              } catch {
                /* 回到结果失败不影响到账：结果仍在历史记录里 */
              }
            }

            if (ctx?.product !== "kit" && addedCredits != null) {
              setCheckoutBought({ kind: "addon", unlocked: unlockedAfterPurchase, credits: addedCredits });
            } else {
              // 没读到下单信息（换了浏览器 / 标签页）时，积分到账了就按套装提示
              setCheckoutBought({ kind: "kit", unlocked: unlockedAfterPurchase, credits: creditsNow });
            }
            setCheckoutStatus("success");
            window.setTimeout(() => setCheckoutStatus("idle"), 6000);
            return;
          }
        } catch {
          /* 网络抖动，继续轮询 */
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      setCheckoutStatus("delayed");
      trackEvent("checkout_activation_delayed", { product: ctx?.product, source: ctx?.source });
    })();
  }, [reloadHistory, refreshCredits, locale]);

  const handleCorrectionOpen = useCallback((entry: HistoryEntry) => {
    if (!entry.source_image_url) return;
    trackEvent("correction_opened", { type: entry.type || "unknown" });
    setLightbox(null);
    setCorrectionModal(entry);
  }, []);

  const handleCorrectionSubmit = useCallback(async (entry: HistoryEntry, corrections: string) => {
    if (!entry.source_image_url) return;
    const type = (entry.type || "color_analysis") as AnalysisType;
    trackEvent("correction_submitted", { type });
    setCorrectionModal(null);
    setPhase("generating");
    setErrorMsg("");
    setResultUrls([]);
    setResultReport(null);
    setResultLock(NO_LOCK);
    setAnalysisType(type);
    scrollToResult();

    try {
      const signInRes = await webInit();
      if (signInRes.code !== 200 || !signInRes.data) throw new Error(signInRes.message);
      const data = signInRes.data;
      if (remainingFor(data, type) <= 0) {
        setPhase("no_quota");
        return;
      }

      const taskRes = await createTask(entry.source_image_url, type, reportLang, { corrections, resolution });
      if (taskRes.code === 429) { setPhase("no_quota"); return; }
      const checkKey = contentCheckErrorKey(taskRes.code);
      if (checkKey) {
        trackEvent("content_check_rejected", { type, reason: taskRes.message, source: "correction" });
        setErrorMsg(t(checkKey));
        setPhase("error");
        return;
      }
      if (taskRes.code !== 200 || !taskRes.data?.task_id) throw new Error(taskRes.message);

      const result = await pollUntilDone(taskRes.data.task_id, undefined, ...pollOptionsFor(type));
      setResultUrls(result.urls);
      setResultReport(reportStateOf(result));
      setResultLock(lockStateOf(result));
      setResultTaskId(taskRes.data.task_id);
      setPhase("done");
      reloadHistory();
      refreshCredits();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Correction failed");
      setPhase("error");
    }
  }, [reportLang, resolution, reloadHistory, refreshCredits, scrollToResult, t]);

  const handleDownload = useCallback(async (url: string) => {
    trackEvent("result_download", { type: analysisType });
    const isMobile = isMobileDevice();
    try {
      const res = await fetch(url);
      const blob = await res.blob();

      // 手机上 <a download> 在 iOS Safari / 内置浏览器里基本无效：优先走系统分享面板（可直接「存储图像」到相册）
      if (isMobile && typeof navigator.share === "function") {
        const type = blob.type || "image/jpeg";
        const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
        const file = new File([blob], `belle-ai-report-${Date.now()}.${ext}`, { type });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file] });
            trackEvent("result_download_method", { method: "share_sheet" });
            return;
          } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return; // 用户主动取消
          }
        }
      }

      if (isMobile) {
        // 不支持文件分享时，给出整宽大图和「长按保存」说明
        trackEvent("result_download_method", { method: "long_press_sheet" });
        setSaveImageUrl(url);
        return;
      }

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `belle-ai-report-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      if (isMobile) setSaveImageUrl(url);
      else window.open(url, "_blank");
    }
  }, [analysisType]);

  /**
   * 分享链接优先用「公开分享页」（好友先看到报告，再被引导去试），失败时退回工具页链接。
   * 分享页由用户主动点击分享时才创建，不会自动公开任何报告。
   */
  const resolveShareLink = useCallback(async (taskId?: string | null): Promise<string> => {
    const fallback = buildFallbackShareUrl(SITE_URL);
    if (!taskId) return fallback;
    try {
      const res = await createShare(taskId);
      if (res.code === 200 && res.data?.token) {
        return buildSharePageUrl(SITE_URL, locale, res.data.token);
      }
    } catch { /* 退回工具页链接 */ }
    return fallback;
  }, [locale]);

  /**
   * 分享：url 是要附带的图（报告海报 / 结果图），独立工具没有现成的图就传空——手机上会改用分享页的预览图。
   * 手机的系统分享面板会把「图片 + 文字（含链接）」一起发出去，好友在聊天里直接看到图；
   * 读不到图（或系统不支持带文件）时只发文字 + 链接，由社交平台抓取分享页的预览卡片。
   */
  const handleShare = useCallback(async (url: string | null, taskId?: string | null, report?: boolean) => {
    if (shareBusyRef.current) return;
    shareBusyRef.current = true;
    try {
      const isMobile = isMobileDevice();
      // 要附带的图和创建分享页同时去取，不让用户多等一轮（系统分享面板必须在点击后很短时间内调起）
      const ownImage = isMobile && url ? fetchShareImage([url]) : Promise.resolve(null);

      const link = await resolveShareLink(taskId ?? resultTaskId);
      const isSharePage = link.includes("/share/");
      trackEvent("share_link_created", { type: analysisType, kind: isSharePage ? "share_page" : "plain_link" });

      if (isMobile && navigator.share) {
        const nativeLink = tagShareLink(link, "native");
        const photoPath = isSharePage ? sharePhotoPath(link) : null;
        const file = (await ownImage) ?? (photoPath ? await fetchShareImage([photoPath]) : null);
        trackEvent("result_share", { method: "native", type: analysisType, with_image: file ? "yes" : "no" });
        if (file) {
          const shareWithFile = { title: t("shareTitle"), text: `${t("shareText")} ${nativeLink}`, files: [file] };
          try {
            if (navigator.canShare?.(shareWithFile)) {
              await navigator.share(shareWithFile);
              return;
            }
          } catch (err) {
            // 用户在分享面板里点了取消：不要再弹第二次纯文字分享
            if (err instanceof DOMException && err.name === "AbortError") return;
            /* 其它错误退回纯文字分享 */
          }
        }
        const status = await nativeShare({ title: t("shareTitle"), text: t("shareText"), url: nativeLink });
        // 系统分享面板失败（部分内置浏览器声明支持但调用报错）：退回自带的分享面板，保证点了有反应
        if (status === "failed") setShareModal({ imageUrl: url ?? "", link, report });
      } else {
        trackEvent("result_share", { method: "panel", type: analysisType });
        setShareModal({ imageUrl: url ?? "", link, report });
      }
    } finally {
      shareBusyRef.current = false;
    }
  }, [t, analysisType, resolveShareLink, resultTaskId]);

  const handleUploadClick = useCallback(() => {
    trackEvent("upload_area_clicked");
    fileRef.current?.click();
  }, []);

  const handleTakeSelfie = useCallback(() => {
    trackEvent("upload_camera_clicked");
    cameraRef.current?.click();
  }, []);

  const clearSelectedFile = useCallback(() => {
    selectedFileRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }, []);

  const clearDemoTimer = useCallback(() => {
    if (demoTimerRef.current !== null) {
      window.clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  }, []);

  // 卸载时清掉演示计时器
  useEffect(() => clearDemoTimer, [clearDemoTimer]);

  /** 直接展示某个类型预先生成好的完整示例；该类型没有示例时返回 false */
  const showDemoResult = useCallback((type: AnalysisType) => {
    const data = demoDataRef.current;
    if (!isDemoType(type) || !data) return false;
    // 示例都是同一位人物的色彩报告（季型）+ 完整 Lookbook：色彩分析整份展示，独立工具只取自己那一章（见 LensPanel demo）
    setResultUrls([]);
    setResultReport({ report: data.report, sourceUrl: personaPhoto(data.id), createdAt: Date.now() / 1000 });
    setResultLock(DEMO_LOCK);
    setResultTaskId(null);
    setPhase("done");
    return true;
  }, []);

  const exitDemo = useCallback(() => {
    clearDemoTimer();
    demoRunRef.current += 1;
    setDemoMode(false);
    setPreviewUrl(null);
    setSourceImageUrl(null);
    setResultUrls([]);
    setResultReport(null);
    setResultLock(NO_LOCK);
    setResultTaskId(null);
    setErrorMsg("");
    setPhase("idle");
    clearSelectedFile();
  }, [clearDemoTimer, clearSelectedFile]);

  /** 示例照片体验：不上传、不请求后端、不扣积分，放一个很短的动画后直接出完整示例报告 */
  const startDemo = useCallback((type: AnalysisType) => {
    if (!isDemoType(type)) return;
    clearDemoTimer();
    const run = (demoRunRef.current += 1);
    demoTypeRef.current = type;
    setDemoMode(true);
    selectedFileRef.current = null;
    setSourceImageUrl(null);
    setPreviewUrl(personaPhoto(personaRef.current));
    setResultUrls([]);
    setResultReport(null);
    setResultLock(NO_LOCK);
    setResultTaskId(null);
    setErrorMsg("");
    setPhase("generating");
    scrollToResult();
    trackEvent("demo_started", { type });
    demoTimerRef.current = window.setTimeout(() => {
      demoTimerRef.current = null;
      // 等待期间用户可能已经换了类型：以最新的类型为准
      const finalType = demoTypeRef.current;
      const wanted = personaRef.current;
      loadDemoReport(wanted).then((report) => {
        if (run !== demoRunRef.current) return; // 读取期间用户已经退出 / 重来了
        if (!report) {
          // 示例数据读不到（网络问题）：退回起始页，不留一个空白结果
          exitDemo();
          return;
        }
        demoDataRef.current = { id: wanted, report };
        if (showDemoResult(finalType)) trackEvent("demo_completed", { type: finalType, persona: wanted });
      });
    }, DEMO_DELAY_MS);
  }, [clearDemoTimer, exitDemo, scrollToResult, showDemoResult]);

  /** 换示例人物：写进地址栏（分享出去的链接是同一位人物）；示例已经在展示时，报告和 Lookbook 随之换成这位人物 */
  const selectPersona = useCallback((id: DemoPersonaId) => {
    if (id === personaRef.current) return;
    personaRef.current = id;
    setPersona(id);
    trackEvent("demo_persona_selected", { persona: id, type: analysisType });
    const params = new URLSearchParams(window.location.search);
    params.set("persona", id);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [analysisType]);

  // 内容页的「先看示例」入口（?type=xxx&sample=1）：落地后只自动开一次示例。
  // 放进下一帧再触发，让页面先画出来，示例的「生成中」动画才看得见
  const autoSampleDone = useRef(false);
  useEffect(() => {
    if (!autoSample) return;
    const timer = window.setTimeout(() => {
      if (autoSampleDone.current) return;
      autoSampleDone.current = true;
      startDemo(validInitialType);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoSample, startDemo, validInitialType]);

  /**
   * 选择分析类型：
   * - 示例体验中：所有类型都有完整示例，直接切过去，不用再等；
   * - 已经有结果 / 出错：结果属于上一个工具，回到起始页（照片还在，可以直接拿同一张照片做下一个）；
   * - 正在生成：先不切换，免得结果和工具对不上。
   */
  const selectType = useCallback((type: AnalysisType) => {
    if (demoMode) {
      setAnalysisType(type);
      demoTypeRef.current = type;
      clearDemoTimer();
      if (showDemoResult(type)) {
        scrollToResult();
      } else {
        exitDemo();
      }
      return;
    }
    if (phase === "preparing" || phase === "uploading" || phase === "generating") return;
    if (phase === "done" || phase === "error") {
      setResultUrls([]);
      setResultReport(null);
      setResultLock(NO_LOCK);
      setResultTaskId(null);
      setErrorMsg("");
      setPhase("idle");
    }
    setAnalysisType(type);
  }, [demoMode, phase, clearDemoTimer, showDemoResult, scrollToResult, exitDemo]);

  /** 看完演示后用自己的照片生成：退出演示并直接打开选择照片 */
  const handleUseOwnPhoto = useCallback(() => {
    trackEvent("demo_use_own_photo_clicked", { type: analysisType });
    exitDemo();
    fileRef.current?.click();
  }, [analysisType, exitDemo]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // 换成自己的照片：退出演示模式，之后走真实的生成流程
      if (demoMode) {
        clearDemoTimer();
        setDemoMode(false);
        setResultLock(NO_LOCK);
        setResultTaskId(null);
      }
      const fromCamera = e.target === cameraRef.current;
      // 上传前会在浏览器里重新编码（保持原始宽高，只有放不进约 6MB 预算时才降质量 / 缩小），所以这里可以放宽到 25MB（手机原图常见 5–12MB）
      if (file.size > MAX_PHOTO_BYTES) {
        trackEvent("photo_rejected", { reason: "file_too_large", size_mb: Math.round(file.size / 1024 / 1024) });
        setPreviewUrl(null);
        setSourceImageUrl(null);
        clearSelectedFile();
        setErrorMsg(t("fileTooLarge"));
        autoScrollRef.current = true;
        setPhase("error");
        return;
      }
      trackEvent("photo_selected", { size_kb: Math.round(file.size / 1024), type: file.type, source: fromCamera ? "camera" : "library" });
      selectedFileRef.current = file;
      // 清空 input：之后再选同一张照片也会触发 change；File 对象本身不受影响
      e.target.value = "";
      // 选了新照片就必须丢掉上一张已上传的地址，否则「再来一张」会继续用上一次上传的照片生成
      setSourceImageUrl(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPhase("idle");
      setResultUrls([]);
      setResultReport(null);
      setErrorMsg("");
    },
    [t, clearSelectedFile, demoMode, clearDemoTimer]
  );

  const handleItemUploadClick = useCallback(() => {
    trackEvent("tryon_item_upload_clicked");
    itemInputRef.current?.click();
  }, []);

  /** 试穿的单品照片：换了照片就丢掉上一张已上传的地址 */
  const handleItemSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (file.size > MAX_PHOTO_BYTES) {
        showToast(t("fileTooLarge"));
        return;
      }
      trackEvent("tryon_item_selected", { size_kb: Math.round(file.size / 1024), type: file.type });
      itemFileRef.current = file;
      itemUrlRef.current = null;
      setItemPreviewUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      // 有结果 / 出错时选了新单品：回到可以重新开始的状态
      if (phase === "done" || phase === "error" || phase === "no_quota") {
        setResultUrls([]);
        setResultReport(null);
        setResultLock(NO_LOCK);
        setResultTaskId(null);
        setErrorMsg("");
        setPhase("idle");
      }
    },
    [phase, showToast, t]
  );

  const clearTryOnItem = useCallback(() => {
    itemFileRef.current = null;
    itemUrlRef.current = null;
    setItemPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const isTryOn = analysisType === "scan_tryon";
  const tryOnReady = !isTryOn || !!itemPreviewUrl;

  const handleGenerate = useCallback(async () => {
    if (!previewUrl) return;
    if (analysisType === "scan_tryon" && !itemFileRef.current) return;
    // 示例照片：不请求后端、不扣积分，直接重放演示
    if (demoMode) {
      startDemo(analysisType);
      return;
    }

    const generateStart = Date.now();
    setPhase("preparing");
    setErrorMsg("");
    setGenerateElapsed(0);
    setLensStage(null);
    trackEvent("generate_started", { type: analysisType, resolution, language: reportLang });

    // rawMessage 只上报给统计（用于排查），界面上展示翻译过的、能告诉用户下一步怎么做的提示
    const fail = (event: string, rawMessage: string, userMessage: string, extra?: Record<string, string | number>) => {
      setErrorMsg(userMessage);
      autoScrollRef.current = true;
      setPhase("error");
      trackEvent(event, {
        type: analysisType,
        error: rawMessage.slice(0, 100),
        size_kb: Math.round((selectedFileRef.current?.size ?? 0) / 1024),
        ...extra,
      });
    };

    try {
      const signInRes = await webInit();
      if (signInRes.code !== 200 || !signInRes.data) {
        fail("init_failed", signInRes.message || "Init failed", t("errorGenerate"));
        return;
      }
      const data = signInRes.data;
      const webQuota = data.web_quota;
      setQuota(webQuota);
      setUserCredits(toUserCredits(data));

      // 按这个类型对应的额度池判断（主打产品预览 / 免费小工具），免费重测不占额度
      if (remainingFor(data, analysisType) <= 0) {
        trackEvent("quota_exhausted", { type: analysisType });
        setPhase("no_quota");
        // 用户点了「开始分析」却被额度挡住：直接弹出购买窗口，别只在页面上摆一张卡片（桌面端卡片不在视口里，看起来像没反应）
        openPricing("no_quota_generate", null, null, { intent: analysisType === "color_analysis" ? "report" : "credits" });
        return;
      }

      // 额度检查通过后，把手机视口滚到进度卡片，生成完成时会再滚到结果
      scrollToResult();

      let imageUrl = sourceImageUrl;

      if (!imageUrl) {
        setUploadStage("compressing");
        setPhase("uploading");
        const file = selectedFileRef.current;
        if (!file) {
          fail("upload_failed", "No file selected", t("errorUpload"));
          return;
        }

        // 上报到 GA 的排查信息：压缩后的请求体大小、文件格式（在 GA 里把 error / payload_kb / file_type 注册成自定义维度就能拆分）
        let payloadKb = 0;
        const uploadDiag = () => ({ payload_kb: payloadKb, file_type: file.type || "unknown" });
        try {
          // 先压缩再上传：大图 + 移动网络是 upload_failed 的主要来源
          const base64 = await prepareImageForUpload(file);
          payloadKb = Math.round(base64.length / 1024);
          setUploadStage("uploading");
          const uploadRes = await uploadImage(base64);
          if (uploadRes.code !== 200 || !uploadRes.data?.url) {
            fail(
              "upload_failed",
              uploadRes.message || "Upload failed",
              uploadRes.code === 413 ? t("errorUploadTooLarge") : t("errorUpload"),
              { ...uploadDiag(), http: uploadRes.code },
            );
            return;
          }
          imageUrl = uploadRes.data.url;
          setSourceImageUrl(imageUrl);
          setLastUploadedPhotoUrl(imageUrl);
          saveLastPhotoUrl(imageUrl);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload error";
          fail(
            "upload_failed",
            message,
            message === IMAGE_TOO_LARGE ? t("errorUploadTooLarge") : t("errorUpload"),
            uploadDiag(),
          );
          return;
        }
      }

      // 真人试穿还要上传单品照片（和自拍一样先压缩）；已经传过的不重复传
      let itemImageUrl: string | undefined;
      if (analysisType === "scan_tryon") {
        if (!itemUrlRef.current) {
          const itemFile = itemFileRef.current;
          if (!itemFile) {
            fail("upload_failed", "No item file", t("errorUpload"));
            return;
          }
          setUploadStage("compressing");
          setPhase("uploading");
          try {
            const itemBase64 = await prepareImageForUpload(itemFile);
            setUploadStage("uploading");
            const itemRes = await uploadImage(itemBase64);
            if (itemRes.code !== 200 || !itemRes.data?.url) {
              fail(
                "upload_failed",
                itemRes.message || "Item upload failed",
                itemRes.code === 413 ? t("errorUploadTooLarge") : t("errorUpload"),
                { http: itemRes.code, item: 1 },
              );
              return;
            }
            itemUrlRef.current = itemRes.data.url;
          } catch (err) {
            const message = err instanceof Error ? err.message : "Item upload error";
            fail("upload_failed", message, message === IMAGE_TOO_LARGE ? t("errorUploadTooLarge") : t("errorUpload"), { item: 1 });
            return;
          }
        }
        itemImageUrl = itemUrlRef.current ?? undefined;
      }

      setPhase("generating");
      savePrefs(resolution, reportLang);

      let taskRes;
      try {
        taskRes = await createTask(imageUrl, analysisType, reportLang, {
          // 试穿没有免费预览，每次都是积分生成的完整图：直接出 2K
          resolution: analysisType === "scan_tryon" ? TRYON_DEFAULT_RESOLUTION : resolution,
          ...(analysisType === "occasion_makeup" ? { occasion } : {}),
          ...(analysisType === "scan_tryon" && itemImageUrl && itemCategory
            ? { itemImageUrl, tryon: { category: itemCategory } }
            : {}),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Task creation error";
        fail("task_create_failed", message, t("errorGenerate"));
        return;
      }

      if (taskRes.code === 429) {
        trackEvent("quota_exhausted", { type: analysisType });
        setQuota(taskRes.data?.quota ?? { total: 3, used: 3, remaining: 0 });
        setPhase("no_quota");
        openPricing("no_quota_generate", null, null, { intent: analysisType === "color_analysis" ? "report" : "credits" });
        return;
      }
      if (taskRes.code !== 200 || !taskRes.data?.task_id) {
        const checkKey = contentCheckErrorKey(taskRes.code);
        fail(
          checkKey ? "content_check_rejected" : "task_create_failed",
          taskRes.message || "Task creation failed",
          t(checkKey ?? "errorGenerate"),
        );
        return;
      }

      if (taskRes.data.quota) {
        setQuota(taskRes.data.quota);
      }

      const result = await pollAnalysis(taskRes.data.task_id, analysisType, reportLang, (season) => setLensStage({ season }));
      setResultUrls(result.urls);
      setResultReport(reportStateOf(result));
      setResultLock(lockStateOf(result));
      setResultTaskId(taskRes.data.task_id);
      setPhase("done");
      // 出图后再同步剩余积分：生成过程中就显示「额度已用完」会很突兀
      refreshCredits();
      trackEvent("generate_completed", {
        type: analysisType,
        resolution,
        image_count: result.urls.length,
        locked: result.locked,
        duration_sec: Math.round((Date.now() - generateStart) / 1000),
      });
      if (result.locked) {
        trackEvent("locked_report_shown", { type: analysisType });
      }
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        const n = new Notification(t("notifyTitle"), { body: t("notifyBody"), icon: "/favicon-32.png" });
        n.onclick = () => { window.focus(); n.close(); };
      }
      reloadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      fail("generate_failed", message, t(generateErrorKey(message)));
    }
  }, [previewUrl, sourceImageUrl, analysisType, itemCategory, reportLang, resolution, occasion, reloadHistory, refreshCredits, scrollToResult, openPricing, t, demoMode, startDemo]);

  const startRecommendedAnalysis = useCallback(async (type: AnalysisType, opts?: { photoUrl?: string; colorSeason?: string }) => {
    // 演示模式：直接切到该类型的示例报告，不开后台任务、不扣积分
    if (demoMode) {
      trackEvent("analysis_type_selected", { type, source: "demo_recommendation" });
      selectType(type);
      return;
    }
    const photoUrl = opts?.photoUrl || sourceImageUrl || lastUploadedPhotoUrl;
    if (!photoUrl) return;

    const taskId = `bg_${Date.now()}_${type}`;
    trackEvent("recommended_analysis_started", { type, source: "recommendation" });

    setBackgroundTasks((prev) => [...prev, { id: taskId, type, phase: "generating", resultUrls: [] }]);

    try {
      const signInRes = await webInit();
      if (signInRes.code !== 200 || !signInRes.data) throw new Error(signInRes.message);
      if (remainingFor(signInRes.data, type) <= 0) {
        setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: "error", errorMsg: "No credits" } : t));
        openPricing("no_quota_recommended");
        return;
      }

      const taskRes = await createTask(photoUrl, type, reportLang, {
        resolution,
        ...(opts?.colorSeason ? { color_season: opts.colorSeason } : {}),
      });
      if (taskRes.code === 429) {
        setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: "error", errorMsg: "No credits" } : t));
        openPricing("no_quota_recommended");
        return;
      }
      if (taskRes.code !== 200 || !taskRes.data?.task_id) throw new Error(taskRes.message);

      const backendTaskId = taskRes.data.task_id;
      setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, taskId: backendTaskId } : t));

      const result = await pollAnalysis(backendTaskId, type, reportLang);
      setBackgroundTasks((prev) => prev.map((t) => t.id === taskId
        ? { ...t, phase: "done", resultUrls: result.urls, report: result.report, sourceUrl: result.sourceImageUrl ?? photoUrl, locked: result.locked, unlocked: result.unlocked, lockStart: result.lockStart }
        : t));
      trackEvent("recommended_analysis_completed", { type, image_count: result.urls.length, locked: result.locked });
      if (result.locked) trackEvent("locked_report_shown", { type, source: "recommendation" });
      reloadHistory();
      refreshCredits();
    } catch (err) {
      setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: "error", errorMsg: err instanceof Error ? err.message : "Failed" } : t));
    }
  }, [sourceImageUrl, lastUploadedPhotoUrl, reportLang, resolution, reloadHistory, refreshCredits, openPricing, demoMode, selectType]);

  /** 报告里的「在我身上试这些颜色」：用季型的色板做换装预览，作为后台任务生成 */
  const handleTryOn = useCallback((season: string, photoUrl?: string | null) => {
    const photo = photoUrl || sourceImageUrl || lastUploadedPhotoUrl;
    if (!photo) {
      showToast(t("tryOnNeedPhoto"));
      return;
    }
    trackEvent("tryon_started", { season });
    setLightbox(null);
    showToast(t("tryOnStarted"));
    void startRecommendedAnalysis("outfit_color", { photoUrl: photo, colorSeason: season });
  }, [sourceImageUrl, lastUploadedPhotoUrl, showToast, startRecommendedAnalysis, t]);

  const handleUseLastPhoto = useCallback(async () => {
    if (!lastUploadedPhotoUrl) return;
    trackEvent("last_photo_reused");
    setSourceImageUrl(lastUploadedPhotoUrl);
    setPreviewUrl(lastUploadedPhotoUrl);
    setPhase("idle");
    setResultUrls([]);
    setResultReport(null);
    setErrorMsg("");
  }, [lastUploadedPhotoUrl]);

  // 没有合适照片的访客：用示例照片体验。直接展示预先生成好的完整示例报告：不等待、不扣积分、不用解锁
  const handleUseSamplePhoto = useCallback(() => {
    trackEvent("sample_photo_clicked", { type: analysisType });
    startDemo(analysisType);
  }, [analysisType, startDemo]);

  /**
   * 看完（或看到一半）很长的示例，想试自己的：回到页面顶部，示例体验则同时退出示例，上传框高亮一下，
   * 让用户一眼知道「从这里开始」。
   */
  const handleBackToTry = useCallback((source: "example_end" | "floating") => {
    trackEvent("example_back_to_try_clicked", { type: analysisType, source, demo: demoMode });
    if (demoMode) exitDemo();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setUploadPulse(true);
    window.setTimeout(() => setUploadPulse(false), 2200);
  }, [analysisType, demoMode, exitDemo]);

  // 起始卡片滚出视口（上方）+ 示例底部的行动区进入视口：决定悬浮的「回去试自己的」要不要显示。
  // 示例的结构在类型 / 阶段切换时会重建，所以这几项变了就重新观察。
  useEffect(() => {
    if (view !== "tool" || typeof IntersectionObserver === "undefined") return;
    const observers: IntersectionObserver[] = [];
    const start = startAnchorRef.current;
    if (start) {
      const io = new IntersectionObserver(([entry]) => setPastStart(!entry.isIntersecting && entry.boundingClientRect.top < 0));
      io.observe(start);
      observers.push(io);
    }
    const end = exampleEndRef.current;
    if (end) {
      const io = new IntersectionObserver(([entry]) => setAtExampleEnd(entry.isIntersecting));
      io.observe(end);
      observers.push(io);
    }
    return () => observers.forEach((io) => io.disconnect());
  }, [view, analysisType, phase, demoMode]);

  // 通知权限不再在点「生成」时弹出：等用户等得久了，主动点「完成后通知我」才请求（必须由点击触发，Safari 也才会弹）
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifyPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotify = useCallback(async () => {
    if (!("Notification" in window)) return;
    trackEvent("notify_permission_requested");
    try {
      const result = await Notification.requestPermission();
      setNotifyPermission(result);
      trackEvent("notify_permission_result", { result });
    } catch {
      setNotifyPermission(Notification.permission);
    }
  }, []);

  const recommendedTypes = (RECOMMENDED_TYPES[analysisType] || []).filter(
    (t) => !backgroundTasks.some((bt) => bt.type === t) && (!demoMode || isDemoType(t))
  );

  const activeTaskCount = backgroundTasks.filter((t) => t.phase === "generating" || t.phase === "uploading").length;

  // 失败的任务没有图也没有报告，渲染出来只是一张空白卡片，点开也没有内容
  const shownHistory = history.filter((entry) => entry.report || entry.image_urls[0]);
  // 在记录页的时候，做分析的流程还在后台跑：返回按钮上给个转圈提示
  const analysisBusy = phase === "preparing" || phase === "uploading" || phase === "generating";

  // 点开大图 / 改错重生成时用：id 用真实任务 ID，分享、解锁都靠它
  const buildCurrentEntry = (): HistoryEntry => ({
    id: demoMode ? "demo" : resultTaskId ?? "current",
    status: "success",
    type: analysisType,
    image_urls: resultUrls,
    source_image_url: resultReport?.sourceUrl ?? sourceImageUrl ?? undefined,
    created_at: Date.now() / 1000,
    locked: resultLock.locked,
    unlocked: resultLock.unlocked,
    lock_start: resultLock.lockStart,
    ...(resultReport ? { kind: "report" as const, report: resultReport.report } : {}),
  });

  /** 色彩报告上的解锁按钮文案：有报告额度就直接用，否则标报告（套装）的价格——色彩报告不花积分 */
  const reportUnlockLabel = (type: string) => {
    if (type === "color_analysis" && (userCredits?.report ?? 0) > 0) return t("unlockWithReport");
    return t("unlockPriceCta", { price: kitPrice });
  };

  /** 解锁后免费重测——回到上传表单，选一张新照片重新做色彩分析（后端自动识别为免费重测，不占额度） */
  const handleRetest = useCallback(() => {
    trackEvent("kit_retest_started");
    setAnalysisType("color_analysis");
    setPhase("idle");
    setPreviewUrl(null);
    setSourceImageUrl(null);
    setResultUrls([]);
    setResultReport(null);
    setResultLock(NO_LOCK);
    setResultTaskId(null);
    setErrorMsg("");
    clearSelectedFile();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(tKit("retestPrompt"));
  }, [clearSelectedFile, showToast, tKit]);
  const kitRetest = userCredits && userCredits.retestLeft > 0 && !demoMode
    ? { left: userCredits.retestLeft, expiresAt: userCredits.retestExpiresAt, onRetest: handleRetest }
    : undefined;

  const tryOnBusy = backgroundTasks.some((bt) => bt.type === "outfit_color" && (bt.phase === "generating" || bt.phase === "uploading"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:py-12">
      <DevUnlockToggle />
      {view === "tool" ? (
        // 这个页面只做一件事：让人试起来。标题一行 + 右边是记录入口，没有副标题、没有说明文字
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <h1 className="font-serif text-xl font-bold sm:text-3xl">{t("title")}</h1>
          {/* 分析记录入口：有记录才显示（记录本身在单独的页面里，不再堆在这一页最底下）；手机上只留图标和数量 */}
          {shownHistory.length > 0 && (
            <button
              type="button"
              onClick={() => { trackEvent("history_view_opened", { source: "try_pill" }); openView("history"); }}
              aria-label={t("historyOpen")}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:border-primary/40 sm:gap-2 sm:px-4"
            >
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="max-sm:hidden">{t("historyOpen")}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{shownHistory.length}</span>
            </button>
          )}
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => openView("tool")}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:border-primary/40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            {t("historyBack")}
            {analysisBusy && <Spinner />}
          </button>
          <h1 className="mt-5 font-serif text-3xl font-bold sm:text-4xl">{t("historyTitle")}</h1>
        </div>
      )}

      {/* 从 Instagram / TikTok / Pinterest 等 App 内置浏览器进来时，提示用系统浏览器打开（记录与积分才会保存） */}
      <InAppBrowserNotice className="mx-auto mt-4 max-w-2xl" />

      {/* 有积分但未登录：积分挂在当前浏览器的匿名账号上，换浏览器/设备就找不回，提示登录保存 */}
      {(userCredits?.pack ?? 0) > 0 && authStatus === "unauthenticated" && !saveSubDismissed && (
        // 做成一行的小药丸：只留标题 + 登录按钮 + 关闭；完整说明放在悬停提示里，不再占一整块版面
        <div
          title={t("saveCreditsDesc")}
          className="mx-auto mt-3 flex max-w-xl items-center gap-2 rounded-2xl border border-green-200 bg-green-50/80 py-1 pl-3 pr-1 text-xs text-green-900 sm:rounded-full"
        >
          <svg className="h-3.5 w-3.5 shrink-0 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /></svg>
          <span className="line-clamp-2 min-w-0 flex-1 font-medium leading-tight">{t("saveCreditsTitle")}</span>
          <button
            type="button"
            onClick={() => signIn.start("credits_save")}
            className="min-h-8 shrink-0 rounded-full bg-green-600 px-3 text-xs font-semibold text-white transition hover:bg-green-700"
          >
            {t("saveSubscriptionCta")}
          </button>
          <button
            type="button"
            onClick={() => setSaveSubDismissed(true)}
            aria-label={t("close")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-green-800/70 hover:bg-green-100"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      <InAppSignInSheet open={signIn.blockedOpen} onClose={signIn.closeBlocked} />

      {view === "tool" && (<>
      {/* 选工具：色彩分析是主打，常驻一个大按钮；其余工具收进「更多工具」，选中后按钮显示当前工具名。
          不带价格 / 免费标记（用到哪一步要花钱，在结果页的解锁处说明），也没有拍摄要求 / 产出说明：要求写在上传框里，产出看下面的完整示例 */}
      {(() => {
        const moreTypes = ANALYSIS_TYPE_GROUPS.flatMap((g) => g.items).filter((i) => i.value !== "color_analysis");
        const activeMore = moreTypes.find((i) => i.value === analysisType);
        const heroActive = analysisType === "color_analysis";
        return (
          <div className="mx-auto mt-4 max-w-2xl sm:mt-6">
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMoreTools(false);
                  if (!heroActive) {
                    selectType("color_analysis");
                    trackEvent("analysis_type_selected", { type: "color_analysis", source: "hero_pill" });
                  }
                }}
                aria-pressed={heroActive}
                className={`flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition sm:flex-none sm:px-7 ${
                  heroActive
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "border border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <span className="shrink-0">
                  <IconPalette />
                </span>
                <span className="truncate">{t("type_color_analysis")}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMoreTools((v) => !v)}
                aria-expanded={showMoreTools}
                aria-controls="more-tools-panel"
                className={`flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition sm:flex-none sm:px-5 ${
                  activeMore
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "border border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {activeMore && <span className="shrink-0">{activeMore.icon}</span>}
                <span className="truncate">{activeMore ? t(`type_${activeMore.value}`) : t("moreTools")}</span>
                <svg className={`h-3 w-3 shrink-0 transition ${showMoreTools ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2 4l4 4 4-4" /></svg>
              </button>
            </div>
            {showMoreTools && (
              <div id="more-tools-panel" className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-2.5 shadow-sm sm:grid-cols-3">
                {moreTypes.map((at) => (
                  <button
                    key={at.value}
                    type="button"
                    onClick={() => {
                      setShowMoreTools(false);
                      selectType(at.value);
                      trackEvent("analysis_type_selected", { type: at.value, source: "more_tools" });
                    }}
                    aria-pressed={analysisType === at.value}
                    className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                      analysisType === at.value
                        ? "bg-primary/10 text-primary ring-1 ring-primary/40"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="shrink-0 text-muted-foreground">{at.icon}</span>
                    <span className="min-w-0">{t(`type_${at.value}`)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Occasion selector for occasion_makeup */}
      {analysisType === "occasion_makeup" && (
        <div className="mt-3 rounded-xl border border-border bg-card p-3">
          <p className="mb-2 text-center text-xs font-medium text-muted-foreground">{t("occasion_select")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => { setOccasion(o.value); trackEvent("occasion_selected", { occasion: o.value }); }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  occasion === o.value
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`occasion_${o.value}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 新版流程：选工具 → 上传照片（或用示例照片）→ 先拿到文字分析，照片锁住 → 解锁照片。
          开始之前先给一份完整示例（全部解锁、所有照片都在），让人知道最后会拿到什么。 */}
      {(() => {
        const busy = phase === "preparing" || phase === "uploading" || phase === "generating";
        const finished = phase === "done" && hasResult;
        const lens = lensOf(analysisType);
        const demoAvailable = isDemoType(analysisType);
        const barPhoto = demoMode ? samplePhoto : (previewUrl ?? resultReport?.sourceUrl ?? sourceImageUrl);
        const seasonNameOf = (season: string) => (isSeasonSlug(season) ? reportMessages?.seasons[season]?.name : undefined) ?? season;
        /** 示例人物选择条：先看到「像我的人」才会代入；AI 生成的模特，写明白 */
        const personaPicker = (
          <SamplePersonaPicker
            value={shownPersona}
            onSelect={selectPersona}
            title={t("samplePick")}
            note={t("sampleAiNote", { season: seasonNameOf(personaSeason(shownPersona)) })}
            nameOf={(id) => seasonNameOf(personaSeason(id))}
          />
        );
        const typeName = t(`type_${analysisType}`);
        // 进度卡片第二步用：色彩报告先出的季型（按报告语言取名）
        const lensSeasonName = lensStage && isSeasonSlug(lensStage.season) ? reportMessages?.seasons[lensStage.season]?.name : undefined;

        /** 回到起始页：换一张照片重新来过；示例体验则退出示例 */
        const resetToStart = () => {
          if (demoMode) {
            exitDemo();
            return;
          }
          setPreviewUrl(null);
          setSourceImageUrl(null);
          setResultUrls([]);
          setResultReport(null);
          setResultLock(NO_LOCK);
          setResultTaskId(null);
          setErrorMsg("");
          setPhase("idle");
          clearSelectedFile();
          clearTryOnItem();
        };

        /** 示例：同一份完整示例，开始之前直接展示，用示例照片体验后也是这一份 */
        const demoBody = !demoData ? null : lens ? (
          <LensPanel key={`demo-${demoData.id}-${analysisType}`} taskId="demo" demo demoPersona={demoData.id} lens={lens} title={typeName} season={demoData.report.season} lang={reportLang} sourceImageUrl={samplePhoto} />
        ) : analysisType === "color_analysis" ? (
          <ReportPanel
            key={`demo-color-${demoData.id}`}
            taskId={null}
            demo
            demoPersona={demoData.id}
            report={demoData.report}
            sourceImageUrl={samplePhoto}
            preferredLang={reportLang}
            unlockLabel=""
            unlockBusy={false}
            onUnlock={() => {}}
            onSavePoster={() => {}}
            onShare={() => {}}
            onNotice={showToast}
          />
        ) : null;

        const startCard = (
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 sm:grid-cols-[14rem_minmax(0,1fr)]">
              {/* 照片 */}
              <div>
                <div
                  onClick={handleUploadClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleUploadClick(); } }}
                  aria-label={t("uploadTitle")}
                  // 手机上没选照片时压矮一点（下面有「拍自拍 / 从相册选」两个大按钮），选了照片再撑开看清脸；
                  // 从示例底部点「回去试自己的」时短暂高亮，告诉用户从这里开始
                  className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition sm:h-72 ${
                    previewUrl ? "h-64" : "h-36"
                  } ${
                    uploadPulse
                      ? "border-primary bg-primary/10 ring-4 ring-primary/25"
                      : previewUrl
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt={t("exampleBefore")} className="h-full w-full rounded-2xl object-contain" />
                  ) : (
                    <>
                      <svg className="mb-2 h-8 w-8 text-muted-foreground/50 sm:mb-3 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="px-3 text-center text-sm font-medium text-foreground">{t("uploadTitle")}</p>
                      {/* 拍摄要求就写在上传的地方：用户正要传照片时才需要看 */}
                      <p className="mt-1 px-3 text-center text-xs leading-snug text-muted-foreground">{t(`req_${analysisType}`)}</p>
                    </>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-1 text-center">
                    <button
                      onClick={() => {
                        if (demoMode) {
                          exitDemo();
                          return;
                        }
                        setPreviewUrl(null);
                        setSourceImageUrl(null);
                        setResultUrls([]);
                        setResultReport(null);
                        setPhase("idle");
                        clearSelectedFile();
                      }}
                      className="min-h-11 px-4 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {t("changePhoto")}
                    </button>
                  </div>
                )}
              </div>

              {/* 选项 + 开始 */}
              <div className="flex min-w-0 flex-col gap-3">
                {/* 报告语言：桌面在右栏最上面；手机上挪到「开始」按钮和示例入口之后，别挡在上传和开始之间。
                    试穿出的是一张图，没有文字，不需要选语言 */}
                {!isTryOn && (
                <div className="relative self-start max-sm:order-1">
                  <button
                    onClick={() => setShowLangPicker(!showLangPicker)}
                    aria-expanded={showLangPicker}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40"
                  >
                    <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                    {REPORT_LANGUAGES.find((l) => l.code === reportLang)?.label || reportLang}
                    <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4" /></svg>
                  </button>
                  {showLangPicker && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowLangPicker(false)} />
                      <div className="absolute left-0 top-full z-40 mt-1 max-h-64 w-44 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl">
                        {REPORT_LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => { setReportLang(lang.code); savePrefs(resolution, lang.code); setShowLangPicker(false); trackEvent("report_language_changed", { language: lang.code }); }}
                            className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition hover:bg-muted ${reportLang === lang.code ? "bg-primary/10 font-medium text-primary" : ""}`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                )}

                {/* 手机上的两个明确入口：拍自拍 / 从相册选；桌面端直接点左边的虚线框 */}
                {!previewUrl && (
                  <div className="grid grid-cols-2 gap-3 sm:hidden">
                    <button
                      type="button"
                      onClick={handleTakeSelfie}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition active:scale-[0.98]"
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                      <span className="text-center leading-tight">{t("takeSelfie")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition active:scale-[0.98]"
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                      <span className="text-center leading-tight">{t("chooseFromGallery")}</span>
                    </button>
                  </div>
                )}

                {lastUploadedPhotoUrl && !previewUrl && (
                  <button
                    type="button"
                    onClick={handleUseLastPhoto}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {t("useLastPhoto")}
                  </button>
                )}

                {/* 真人试穿：第二张图是要试的单品，再选一下它是什么（决定怎么穿到身上） */}
                {isTryOn && (
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs font-semibold text-foreground">{t("tryonItemTitle")}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleItemUploadClick}
                        disabled={busy}
                        aria-label={t("tryonItemTitle")}
                        className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition disabled:opacity-60 ${
                          itemPreviewUrl ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
                        }`}
                      >
                        {itemPreviewUrl ? (
                          <img src={itemPreviewUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <svg className="h-7 w-7 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        {itemPreviewUrl ? (
                          <button
                            type="button"
                            onClick={handleItemUploadClick}
                            disabled={busy}
                            className="min-h-11 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
                          >
                            {t("tryonItemChange")}
                          </button>
                        ) : (
                          <p className="text-xs leading-snug text-muted-foreground">{t("tryonItemHint")}</p>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium text-muted-foreground">{t("tryonCategoryLabel")}</p>
                    <div role="group" aria-label={t("tryonCategoryLabel")} className="mt-2 flex flex-wrap gap-1.5">
                      {(["auto", ...TRYON_CATEGORIES] as const).map((c) => {
                        const selected = itemCategory === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            disabled={busy}
                            aria-pressed={selected}
                            onClick={() => { setItemCategory(c); trackEvent("tryon_category_selected", { category: c }); }}
                            className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                              selected
                                ? "border-primary bg-primary font-semibold text-white shadow-md shadow-primary/30 ring-2 ring-primary/25"
                                : "border-border bg-white text-foreground/80 hover:border-primary/50 hover:text-foreground"
                            }`}
                          >
                            {selected ? (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : c === "auto" ? (
                              <IconSparkle />
                            ) : null}
                            {t(`tryonCat_${c}`)}
                          </button>
                        );
                      })}
                    </div>
                    {itemCategory === "auto" && <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{t("tryonAutoHint")}</p>}
                  </div>
                )}

                {/* 开始分析：手机上选好照片后吸在视口底部，不用再往下找按钮 */}
                <div
                  className={
                    previewUrl
                      ? "max-sm:sticky max-sm:bottom-0 max-sm:z-30 max-sm:-mx-4 max-sm:border-t max-sm:border-border/60 max-sm:bg-background/95 max-sm:px-4 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-sm:pt-3 max-sm:backdrop-blur-md"
                      : ""
                  }
                >
                  {isTryOn && previewUrl && !tryOnReady && !busy && (
                    <p className="mb-2 text-center text-xs text-muted-foreground">{t("tryonNeedItem")}</p>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={!previewUrl || busy || !tryOnReady}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy && <Spinner />}
                    {busy ? t("generating") : isTryOn ? t("tryonBtn") : t("analyzeBtn")}
                  </button>
                </div>

                {demoAvailable && !demoMode && (
                  <button
                    type="button"
                    onClick={handleUseSamplePhoto}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-primary/40 disabled:opacity-50"
                  >
                    <img src={samplePhoto} alt="" className="h-7 w-7 rounded-full object-cover object-top" />
                    {t("trySample")}
                  </button>
                )}

                {/* 隐私说明常驻显示：用户决定传不传脸部照片之前就能看到，并能点进隐私政策 */}
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground max-sm:order-2">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                  <span>
                    {t("uploadTrust")}{" "}
                    <Link href="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">{t("privacyLink")}</Link>
                    {!previewUrl && <span className="mt-1 block text-[11px] text-muted-foreground/80">{t("uploadConsent")}</span>}
                  </span>
                </p>

                {/* 额度状态：如实列出这次分析能用到的每一种额度（免费重测 / 报告额度 / 免费次数）；
                    色彩分析不消耗套餐积分，所以只有其他类型才显示积分 */}
                {userCredits && !finished && (
                  <QuotaStatus
                    credits={userCredits}
                    type={analysisType}
                    tKit={tKit}
                    locale={pageLocale}
                    onTopUp={() => openPricing("credits_chip", null, null, { intent: "credits" })}
                  />
                )}
              </div>
            </div>
          </section>
        );

        const resultBar = (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
            {barPhoto && <img src={barPhoto} alt="" className="h-14 w-11 shrink-0 rounded-lg border border-border object-cover object-top" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{typeName}</p>
              <p className="text-xs text-muted-foreground">{demoMode ? t("sampleResultHint") : t("resultTitle")}</p>
            </div>
            <button
              type="button"
              onClick={demoMode ? handleUseOwnPhoto : resetToStart}
              className="min-h-10 shrink-0 rounded-full border border-primary/40 bg-primary/5 px-4 text-xs font-semibold text-primary transition hover:bg-primary/10"
            >
              {demoMode ? t("demoUseMyPhoto") : t("analyzeAnother")}
            </button>
          </div>
        );

        const progressCard = (
          <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-violet-50/50 p-6 dark:from-primary/10 dark:to-violet-950/20">
            <div className="relative mb-4">
              <div className="h-16 w-16 rounded-full border-[3px] border-primary/20">
                <div className="h-full w-full animate-spin rounded-full border-[3px] border-transparent border-t-primary" style={{ animationDuration: "1.5s" }} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {Math.floor(generateElapsed / 60)}:{String(generateElapsed % 60).padStart(2, "0")}
                </span>
              </div>
            </div>
            {lens && phase === "generating" ? (
              // 独立工具：三步清清楚楚（读照片 → 识别色彩季型 → 写这一章建议），好了一次出齐，不再「先出一块、再转圈、再出一块」
              <ol aria-live="polite" className="mt-1 w-full max-w-xs space-y-2.5 px-2 text-sm">
                {[
                  { label: t("lensStepPhoto"), state: "done" },
                  {
                    label: lensStage ? (lensSeasonName ? t("lensStepSeasonDone", { season: lensSeasonName }) : t("lensStepSeasonDoneGeneric")) : t("lensStepSeason"),
                    state: lensStage ? "done" : "active",
                  },
                  { label: t("lensStepWrite"), state: lensStage ? "active" : "pending" },
                ].map((step) => (
                  <li key={step.label} className="flex items-center gap-2.5">
                    {step.state === "done" ? (
                      <svg className="h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : step.state === "active" ? (
                      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
                    ) : (
                      <span className="h-5 w-5 shrink-0 rounded-full border-2 border-border" aria-hidden="true" />
                    )}
                    <span className={step.state === "pending" ? "text-muted-foreground" : "font-medium text-foreground"}>{step.label}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-3 text-center text-sm font-medium text-foreground">
                {phase === "preparing"
                  ? t("preparing")
                  : phase === "uploading"
                    ? (uploadStage === "compressing" ? t("compressing") : t("uploading"))
                    : generateElapsed < 15
                      ? t("generating")
                      : generateElapsed < 40
                        ? t("generatingStage2")
                        : t("generatingStage3")}
              </p>
            )}
            {phase === "generating" && generateElapsed > 60 && <p className="mt-2 px-3 text-center text-xs text-muted-foreground">{t("almostDone")}</p>}
            {phase === "generating" && generateElapsed >= 20 && notifyPermission === "default" && (
              <button
                type="button"
                onClick={handleRequestNotify}
                className="mt-3 min-h-9 rounded-full border border-primary/40 bg-background/70 px-3 text-xs font-medium text-primary transition hover:bg-primary/10"
              >
                {t("notifyMe")}
              </button>
            )}
          </div>
        );

        const errorCard = (
          <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-2xl border border-red-200/60 bg-red-50/30 p-6 dark:border-red-900/30 dark:bg-red-950/10">
            <svg className="mb-3 h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            <p role="alert" className="px-3 text-center text-sm font-medium text-red-600 dark:text-red-400">{errorMsg}</p>
            {previewUrl && (
              <button
                onClick={() => {
                  trackEvent("generate_retry_clicked", { type: analysisType });
                  handleGenerate();
                }}
                className="mt-4 min-h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                {t("retryBtn")}
              </button>
            )}
          </div>
        );

        /** 示例很长：看到底时给一个回到顶部试自己照片的大按钮（示例体验结束后的结果页也用这一块） */
        const exampleEnd = (
          <div ref={exampleEndRef} className="rounded-2xl border border-gold/40 bg-gradient-to-br from-white to-primary/10 p-5 text-center shadow-sm">
            <p className="font-serif text-lg font-bold">{t("exampleEndTitle")}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t("exampleEndSub")}</p>
            <button
              type="button"
              onClick={() => handleBackToTry("example_end")}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl sm:w-auto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
              {t("demoUseMyPhoto")}
            </button>
          </div>
        );

        /** 开始之前：完整示例（真人试穿没有分析报告，示例是「试穿前 / 后」对比图） */
        const exampleBlock = isTryOn ? (
          <TryOnExample t={t} />
        ) : demoAvailable ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gradient-to-r from-white to-muted/50 p-3">
              <img src={samplePhoto} alt="" className="h-16 w-12 shrink-0 rounded-lg border border-border object-cover object-top" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t("exampleHeading", { type: typeName })}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t("exampleSub")}</p>
              </div>
            </div>
            {personaPicker}
            {demoBody}
            {exampleEnd}
          </div>
        ) : null;

        /** 结果：文字分析在最前面，照片锁住（色彩分析露出 1 张，其余类型全锁）；不同类型的解锁方式不一样 */
        let resultBody: React.ReactNode = null;
        if (finished) {
          if (demoMode && resultReport) {
            resultBody = demoBody;
          } else if (lens && resultReport && resultTaskId) {
            resultBody = (
              <LensPanel
                key={resultTaskId}
                taskId={resultTaskId}
                lens={lens}
                title={typeName}
                season={resultReport.report.season}
                lang={reportLang}
                sourceImageUrl={resultReport.sourceUrl ?? sourceImageUrl}
                onBuyCredits={() => openPricing("tryon_credits", null, null, { intent: "credits", openTaskId: resultTaskId })}
              >
                <LensShareButton label={t("share")} onClick={() => handleShare(null, resultTaskId, lens === "glow")} />
                <ResultFeedback key={resultTaskId} taskId={resultTaskId} type={analysisType} />
              </LensPanel>
            );
          } else if (resultReport) {
            resultBody = (
              <ReportPanel
                key={resultTaskId ?? "demo"}
                taskId={demoMode ? null : resultTaskId}
                report={resultReport.report}
                sourceImageUrl={resultReport.sourceUrl ?? sourceImageUrl}
                createdAt={resultReport.createdAt}
                demo={demoMode}
                preferredLang={reportLang}
                unlockLabel={reportUnlockLabel("color_analysis")}
                unlockBusy={unlockingId !== null && unlockingId === resultTaskId}
                onUnlock={() => handleUnlock(resultTaskId, "color_analysis", null)}
                onSavePoster={(url) => handleDownload(url)}
                onShare={(url, id) => handleShare(url, id, true)}
                onTryOn={(season) => handleTryOn(season, resultReport.sourceUrl)}
                tryOnBusy={tryOnBusy}
                kitRetest={kitRetest}
                onNotice={showToast}
                onReportUpdated={(report) => setResultReport((prev) => (prev ? { ...prev, report } : prev))}
              >
                {demoMode ? null : <ResultFeedback key={resultTaskId ?? "current"} taskId={resultTaskId} type={analysisType} />}
              </ReportPanel>
            );
          } else if (resultUrls.length > 0) {
            // 图片类结果（买前试穿、色板扫描等不走结构化分析的类型）
            resultBody = (
              <div className="space-y-3">
                <div
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-background transition hover:border-primary/40 hover:shadow-md"
                  onClick={() => {
                    trackEvent("result_viewed_full", { type: analysisType, locked: resultLock.locked });
                    setLightbox({ entry: buildCurrentEntry(), imageIndex: 0 });
                  }}
                >
                  <div className="relative">
                    <img src={resultUrls[0]} alt={`${typeName} — ${t("resultTitle")}`} className="h-auto w-full bg-muted/30 object-contain" style={{ aspectRatio: "3/4" }} />
                    {resultLock.locked ? (
                      <LockOverlay
                        type={analysisType}
                        lockStart={resultLock.lockStart}
                        cost={creditCostOf(analysisType)}
                        packCredits={userCredits?.pack ?? 0}
                        priceLabel={kitPrice}
                        busy={unlockingId === resultTaskId}
                        onUnlock={() => handleUnlock(resultTaskId, analysisType, resultUrls[0])}
                        t={t}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-100 transition [@media(hover:hover)]:from-black/50 [@media(hover:hover)]:opacity-0 group-hover:opacity-100">
                        <div className="mb-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                          {t("viewFull")}
                        </div>
                      </div>
                    )}
                    {resultUrls.length > 1 && (
                      <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">1/{resultUrls.length}</div>
                    )}
                  </div>
                </div>
                {!resultLock.unlocked && (
                  <button
                    onClick={() => handleUnlock(resultTaskId, analysisType, resultUrls[0])}
                    disabled={unlockingId !== null && unlockingId === resultTaskId}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark disabled:opacity-60"
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    {(userCredits?.pack ?? 0) >= creditCostOf(analysisType)
                      ? t("unlockWithCredits", { count: creditCostOf(analysisType) })
                      : t("unlockPriceCta", { price: kitPrice })}
                  </button>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      if (!resultLock.unlocked) {
                        trackEvent("download_blocked_free", { type: analysisType });
                        handleUnlock(resultTaskId, analysisType, resultUrls[0]);
                      } else {
                        handleDownload(resultUrls[0]);
                      }
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground transition hover:border-primary/40"
                  >
                    <DownloadIcon />
                    {resultLock.unlocked ? t("download") : t("upgradeToDownload")}
                  </button>
                  {SHARE_BUTTONS_ENABLED && (
                    <button
                      onClick={() => handleShare(resultUrls[0])}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-4 text-xs font-semibold text-primary transition hover:bg-primary/10"
                    >
                      <ShareIcon />
                      {t("share")}
                    </button>
                  )}
                  {analysisType !== "scan_tryon" && (
                    <button
                      onClick={() => handleCorrectionOpen(buildCurrentEntry())}
                      disabled={!sourceImageUrl}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground transition hover:border-primary/40 disabled:opacity-50"
                    >
                      <CorrectionIcon />
                      {t("correction")}
                    </button>
                  )}
                </div>
                <ResultFeedback key={resultTaskId ?? "current"} taskId={resultTaskId} type={analysisType} />
              </div>
            );
          }
        }

        // 示例体验的结果页（用示例照片「体验」出来的那一份）同样很长，底部也放回去试自己的入口
        const inExample = (phase === "idle" || phase === "no_quota") && exampleBlock !== null && !busy;
        const showBackPill = pastStart && !atExampleEnd && !previewUrl && (inExample || (finished && demoMode));

        return (
          <div className="mx-auto mt-4 max-w-2xl sm:mt-6">
            {/* 隐藏的选择器放在最外面：示例体验结束后「用我自己的照片」要能直接弹出选择器 */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            {/* 前置摄像头直接拍自拍；桌面浏览器会忽略 capture，等同普通选择文件 */}
            <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileSelect} />
            {/* 真人试穿的单品照片（商品图 / 衣服平铺图 / 口红色号图都行） */}
            <input ref={itemInputRef} type="file" accept="image/*" className="hidden" onChange={handleItemSelect} />

            {/* startAnchorRef：这一块滚出视口，说明用户在往下看示例，悬浮的「回去试自己的」才出现 */}
            <div ref={startAnchorRef}>
              {finished ? (
                <>
                  {resultBar}
                  {demoMode && demoAvailable && <div className="mt-3">{personaPicker}</div>}
                </>
              ) : (
                startCard
              )}
            </div>

            {/* 额度用完：额度墙紧跟在开始按钮下面（桌面端点了没反应的主要原因是它以前被放在整页最底部）；结果页自己在结果下面有一份 */}
            {(phase === "no_quota" || (phase !== "done" && phase !== "generating" && phase !== "uploading" && phase !== "preparing" && ((userCredits && startableCount(userCredits, analysisType) <= 0) || (!userCredits && quota && quota.remaining <= 0)))) && (
              <div ref={noQuotaRef} className="mt-4 scroll-mt-20">
                <NoQuotaCard
                  t={t}
                  tKit={tKit}
                  type={analysisType}
                  hasPurchased={userCredits?.hasPurchased ?? false}
                  onViewPlans={() => openPricing("no_quota_generate", null, null, { intent: analysisType === "color_analysis" ? "report" : "credits" })}
                />
              </div>
            )}

            <div ref={resultSectionRef} className="mt-6 scroll-mt-20">
              {busy ? progressCard : phase === "error" ? errorCard : finished ? resultBody : exampleBlock}
              {finished && demoMode && !busy && <div className="mt-4">{exampleEnd}</div>}
            </div>

            {/* 悬浮的「回去试自己的」：看示例看到一半（起始卡片已滚走、示例底部还没到）时一直在手边 */}
            {showBackPill && (
              <button
                type="button"
                onClick={() => handleBackToTry("floating")}
                className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 inline-flex min-h-11 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-primary-dark px-5 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:shadow-xl"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                {t("demoUseMyPhoto")}
              </button>
            )}
          </div>
        );
      })()}

      {/* Recommendations during generation */}
      {(phase === "generating" || phase === "uploading") && recommendedTypes.length > 0 && (sourceImageUrl || lastUploadedPhotoUrl) && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
            <h3 className="font-serif text-base font-bold">{t("tryMore")}</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">{t("tryMoreDesc")}</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {recommendedTypes.map((type) => (
              <button
                key={type}
                onClick={() => startRecommendedAnalysis(type)}
                className="group flex-shrink-0 w-[160px] overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="relative h-[100px] overflow-hidden">
                  <img
                    src={CARD_IMAGES[type]}
                    alt={t(`type_${type}`)}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold truncate">{t(`type_${type}`)}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-primary">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="text-xs font-medium">{t("startNow")}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      </>)}

      {/* Background Tasks */}
      {backgroundTasks.length > 0 && (
        <div className="mt-6" data-task-panel>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
              <h3 className="text-sm font-semibold">{t("multiTaskTitle")}</h3>
            </div>
            {activeTaskCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {t("tasksRunning", { count: activeTaskCount })}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {backgroundTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/20"
              >
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                  <img src={CARD_IMAGES[task.type]} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t(`type_${task.type}`)}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.phase === "done" ? t("taskDone") : task.phase === "error" ? t("taskError") : task.phase === "uploading" ? t("taskUploading") : t("taskAnalyzing")}
                  </p>
                </div>
                {task.phase === "done" && (task.resultUrls[0] || task.report) && (
                  <button
                    onClick={() => setLightbox({
                      entry: {
                        id: task.taskId ?? task.id,
                        status: "success",
                        type: task.type,
                        image_urls: task.resultUrls,
                        source_image_url: task.sourceUrl ?? sourceImageUrl ?? lastUploadedPhotoUrl ?? undefined,
                        created_at: Date.now() / 1000,
                        locked: task.locked,
                        unlocked: task.unlocked,
                        lock_start: task.lockStart,
                        ...(task.report ? { kind: "report" as const, report: task.report } : {}),
                      },
                      imageIndex: 0,
                    })}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    {t("viewResults")}
                  </button>
                )}
                {task.phase === "generating" && <Spinner />}
                {task.phase === "error" && (
                  <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "tool" && (<>
      {/* Post-result: Recommendations */}
      {phase === "done" && hasResult && (
        <div className="mt-8">
          {/* AI 生成内容标注 */}
          <p className="mb-4 text-center text-xs text-muted-foreground">{t("aiGeneratedNote")}</p>

          {recommendedTypes.length > 0 && (demoMode || sourceImageUrl || lastUploadedPhotoUrl) && (
            <div className="rounded-2xl border border-border bg-gradient-to-br from-muted/30 to-muted/10 p-5">
              <div className="flex items-center gap-2 mb-1">
                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                <h3 className="font-serif text-base font-bold">{t("tryAnother")}</h3>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">{t("tryAnotherDesc")}</p>
              <div className="grid grid-cols-3 gap-3">
                {recommendedTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => startRecommendedAnalysis(type)}
                    className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={CARD_IMAGES[type]}
                        alt={t(`type_${type}`)}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5 text-center">
                      <p className="text-xs font-semibold truncate">{t(`type_${type}`)}</p>
                      <div className="mt-1 flex items-center justify-center gap-1 text-primary">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        <span className="text-xs font-medium">{t("startNow")}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 以「总剩余次数」为准：免费额度用完但还有付费积分 / 订阅额度的用户不应该看到额度墙 */}
          {!demoMode && (userCredits ? startableCount(userCredits, analysisType) <= 0 : !!quota && quota.remaining <= 0) && (
            <div className="mt-6">
              <NoQuotaCard
                t={t}
                tKit={tKit}
                type={analysisType}
                hasPurchased={userCredits?.hasPurchased ?? false}
                onViewPlans={() => openPricing("no_quota_result", null, null, { intent: analysisType === "color_analysis" ? "report" : "credits" })}
              />
            </div>
          )}
        </div>
      )}

      </>)}

      {/* 分析记录（单独一页：?view=history） */}
      {view === "history" && (
      <div id="history" className="mt-6">
        {historyLoading && (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <Spinner /> {t("historyLoading")}
          </div>
        )}
        {!historyLoading && shownHistory.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("historyEmptyView")}</p>
            <button
              type="button"
              onClick={() => openView("tool")}
              className="mt-4 min-h-11 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:shadow-lg"
            >
              {t("historyStart")}
            </button>
          </div>
        )}
        {!historyLoading && shownHistory.length > 0 && (
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {shownHistory.map((entry) => {
                const typeKey = entry.type || "color_analysis";
                const label = ALL_VALID_TYPES.includes(typeKey as AnalysisType) ? t(`type_${typeKey}`) : typeKey;
                const dateText = new Date(entry.created_at * 1000).toLocaleString(undefined, {
                  month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div
                    key={entry.id}
                    className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
                    onClick={() => { trackEvent("history_item_opened", { type: typeKey }); setLightbox({ entry, imageIndex: 0 }); }}
                  >
                    {entry.report ? (
                      // 结构化报告（色彩分析 + 所有独立工具）：直接摆出主要结论（季型 / 脸型 / 发色 / 色号…），原照只做小头像
                      <HistoryReportCard
                        report={entry.report}
                        profile={entry.lens_profile}
                        coverUrl={entry.cover_url}
                        sourceImageUrl={entry.source_image_url}
                        lang={LOCALE_TO_REPORT_LANG[locale] ?? "en"}
                        type={typeKey}
                        label={label}
                        icon={TYPE_ICONS[typeKey]}
                        dateText={dateText}
                        lockedLabel={entry.locked && !lensOf(entry.type) ? t("lockedBadge") : undefined}
                      />
                    ) : (
                      <>
                        {entry.image_urls[0] && (
                          <div className="relative">
                            <img
                              src={entry.image_urls[0]}
                              alt={label}
                              className="aspect-[4/3] w-full object-cover object-top sm:aspect-[3/4]"
                            />
                            {entry.locked && (
                              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                                <LockIcon className="h-3 w-3" />
                                {t("lockedBadge")}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between px-3 py-3">
                          <div>
                            <p className="text-sm font-semibold leading-snug text-foreground">{label}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{dateText}</p>
                          </div>
                          {entry.image_urls.length > 1 && (
                            <span className="text-xs text-muted-foreground">+{entry.image_urls.length - 1}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Lightbox */}
      {lightbox && lightbox.entry.report && lensOf(lightbox.entry.type) && (
        <LensLightbox
          entry={lightbox.entry}
          lens={lensOf(lightbox.entry.type)!}
          preferredLang={reportLang}
          onBuyCredits={() => openPricing("tryon_credits", null, null, { intent: "credits", openTaskId: lightbox.entry.id })}
          onShare={(taskId) => handleShare(null, taskId, lensOf(lightbox.entry.type) === "glow")}
          onClose={() => setLightbox(null)}
          t={t}
        />
      )}
      {lightbox && lightbox.entry.report && !lensOf(lightbox.entry.type) && (
        <ReportLightbox
          entry={lightbox.entry}
          preferredLang={reportLang}
          unlockLabel={reportUnlockLabel(lightbox.entry.type || "color_analysis")}
          unlocking={unlockingId !== null && unlockingId === lightbox.entry.id}
          onClose={() => setLightbox(null)}
          onUnlock={(entry) => handleUnlock(entry.id, entry.type || "color_analysis", null)}
          onSavePoster={(url) => handleDownload(url)}
          onShare={handleShare}
          onTryOn={(season) => handleTryOn(season, lightbox.entry.source_image_url)}
          tryOnBusy={tryOnBusy}
          kitRetest={kitRetest ? { left: kitRetest.left, expiresAt: kitRetest.expiresAt, onRetest: () => { setLightbox(null); kitRetest.onRetest(); } } : undefined}
          onNotice={showToast}
          t={t}
        />
      )}
      {lightbox && !lightbox.entry.report && (
        <ImageLightbox
          entry={lightbox.entry}
          initialIndex={lightbox.imageIndex}
          onClose={() => setLightbox(null)}
          onCorrection={handleCorrectionOpen}
          onDownload={handleDownload}
          onShare={handleShare}
          packCredits={userCredits?.pack ?? 0}
          kitPrice={kitPrice}
          unlocking={unlockingId !== null && unlockingId === lightbox.entry.id}
          onUnlock={(entry) => handleUnlock(entry.id, entry.type || "color_analysis", entry.image_urls[0])}
          demo={lightbox.entry.id === "demo"}
          t={t}
        />
      )}

      {/* 手机端「长按保存」兜底 */}
      {saveImageUrl && (
        <SaveImageSheet url={saveImageUrl} onClose={() => setSaveImageUrl(null)} t={t} />
      )}

      {/* Correction Modal */}
      {correctionModal && (
        <CorrectionSheet
          entry={correctionModal}
          onClose={() => setCorrectionModal(null)}
          onSubmit={handleCorrectionSubmit}
          t={t}
        />
      )}

      {/* Share Panel */}
      {shareModal && (
        <SharePanel
          url={shareModal.imageUrl}
          shareLink={shareModal.link}
          report={shareModal.report}
          onClose={() => setShareModal(null)}
          onCopied={() => { setShareToast(true); setTimeout(() => setShareToast(false), 2000); }}
          t={t}
        />
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-[200] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-center text-sm text-background shadow-lg max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]">
          {t("shareCopied")}
        </div>
      )}

      {/* Floating task indicator */}
      {activeTaskCount > 0 && (
        <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 z-50 max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:right-6">
          <button
            onClick={() => {
              const el = document.querySelector('[data-task-panel]');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            <Spinner />
            {t("tasksRunning", { count: activeTaskCount })}
          </button>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal
        open={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        source={pricingSource}
        previewUrl={pricingPreview}
        // 弹窗拿这份锁定报告的季型和已露出的颜色做预览：当前结果页 / 历史记录 / 后台任务里找到哪份用哪份
        unlockReport={
          showPricingModal && pricingTaskId
            ? ((pricingTaskId === resultTaskId ? resultReport?.report : undefined) ??
              history.find((e) => e.id === pricingTaskId)?.report ??
              backgroundTasks.find((b) => b.taskId === pricingTaskId)?.report ??
              null)
            : null
        }
        unlockTaskId={pricingTaskId}
        openTaskId={pricingOpenTaskId}
        intent={pricingIntent}
        packCredits={userCredits?.pack ?? 0}
        hasPurchased={userCredits?.hasPurchased ?? false}
      />

      {/* 解锁失败等一次性提示 */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-[260] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-center text-sm text-background shadow-lg max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
        >
          {toastMsg}
        </div>
      )}

      {/* 从支付页返回后的状态提示 */}
      {checkoutStatus !== "idle" && (
        <div
          role="status"
          className={`fixed left-1/2 top-4 z-[250] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            checkoutStatus === "success"
              ? "bg-green-600 text-white"
              : checkoutStatus === "delayed"
                ? "bg-amber-500 text-white"
                : "bg-foreground text-background"
          }`}
        >
          <div className="flex items-start gap-2">
            {checkoutStatus === "confirming" && <Spinner />}
            <span className="flex-1">
              {checkoutStatus === "confirming"
                ? t("checkoutConfirming")
                : checkoutStatus === "success"
                  // 套装 / 加购包：到账提示里告诉用户有多少积分、报告是不是已经解锁
                  ? tKit(
                      checkoutBought.kind === "kit"
                        ? checkoutBought.unlocked ? "checkoutKitUnlocked" : "checkoutKit"
                        : checkoutBought.unlocked ? "checkoutAddonUnlocked" : "checkoutAddon",
                      { credits: checkoutBought.credits },
                    )
                  : t("checkoutDelayed")}
            </span>
            {checkoutStatus !== "confirming" && (
              <button
                onClick={() => setCheckoutStatus("idle")}
                aria-label={t("close")}
                className="-mr-1 rounded-full px-1.5 text-white/80 transition hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 结果下方的真实反馈入口：1–5 星 + 可选一句话。评分进 GA；点「发送」才把评分和留言发给团队并存进后端（不含照片）。
 * 评分较高且写了像样的一句话时，才询问「是否允许匿名展示」，默认不勾选——只展示用户明确同意的真实评价。
 */
function ResultFeedback({ taskId, type }: { taskId: string | null; type: string }) {
  const t = useTranslations("tryPage");
  const locale = useLocale();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [allowDisplay, setAllowDisplay] = useState(false);
  const [sent, setSent] = useState(false);

  const canOfferConsent = rating >= 4 && comment.trim().length >= 10;

  const submit = (text: string) => {
    const trimmed = text.trim() || undefined;
    // 用户先勾选、后来又把留言删短了：同意作废，以最终提交时的状态为准
    const consent = canOfferConsent && allowDisplay;
    trackFeedbackSubmitted({ type, rating, comment: trimmed, taskId, allowDisplay: consent });
    saveReportFeedback({ userId: getCachedUserId(), taskId, rating, comment: trimmed, allowDisplay: consent, locale });
    setSent(true);
  };

  if (sent) {
    return <p className="rounded-xl bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">{t("feedbackThanks")}</p>;
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3 text-center">
      <p className="text-xs font-medium text-foreground">{t("feedbackQuestion")}</p>
      <div className="mt-1.5 flex items-center justify-center gap-1" role="radiogroup" aria-label={t("feedbackQuestion")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={t("feedbackStar", { count: n })}
            onClick={() => {
              setRating(n);
              trackEvent("result_rated", { type, rating: n });
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-primary/10"
          >
            <svg className={`h-6 w-6 ${n <= rating ? "text-amber-400" : "text-muted-foreground/40"}`} viewBox="0 0 24 24" fill={n <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="mt-2 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 120))}
            maxLength={120}
            rows={2}
            placeholder={t("feedbackPlaceholder")}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary/60"
          />
          {canOfferConsent && (
            <label className="flex cursor-pointer items-start gap-2 py-1 text-left text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={allowDisplay}
                onChange={(e) => setAllowDisplay(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span>{t("feedbackConsent")}</span>
            </label>
          )}
          <p className="text-[11px] text-muted-foreground">{t("feedbackPrivacy")}</p>
          <button
            type="button"
            onClick={() => submit(comment)}
            className="min-h-10 rounded-full bg-primary px-5 text-xs font-semibold text-white transition hover:bg-primary-dark"
          >
            {t("feedbackSend")}
          </button>
        </div>
      )}
    </div>
  );
}


/**
 * 开始按钮下面的额度状态。四种额度彼此独立，有哪种就如实写哪种：
 * - 免费重测（只对色彩分析）：不扣任何额度，写明剩余次数和到期日
 * - 报告额度（只对色彩分析）：买套装得到的完整报告
 * - 免费次数：主打产品的免费预览，或小工具的免费分析；手上有这个类型能用的积分 / 报告额度时不显示
 *   （生成时积分优先，不会动免费次数，同时列两行只会让人困惑）；真人试穿没有免费次数
 * - 套餐积分（含老的赠送积分）：只给其他类型的结果图用，色彩分析不消耗它，所以这里不显示
 */
function QuotaStatus({
  credits: c,
  type,
  tKit,
  locale,
  onTopUp,
}: {
  credits: UserCredits;
  type: string;
  tKit: (key: string, values?: Record<string, string | number>) => string;
  locale: string;
  onTopUp: () => void;
}) {
  const isColor = type === "color_analysis";
  const hero = isKitHeroType(type);
  const tryOn = isCreditsOnlyType(type);
  const rows: { key: string; text: string; highlight?: boolean }[] = [];

  if (isColor && c.retestLeft > 0) {
    rows.push({
      key: "retest",
      text: tKit("quotaRetest", { date: formatRetestDate(locale, c.retestExpiresAt) }),
      highlight: true,
    });
  }
  if (isColor && c.report > 0) {
    rows.push({ key: "report", text: tKit("quotaReport", { count: c.report }), highlight: true });
  }
  if (tryOn) {
    rows.push({ key: "tryon", text: tKit("quotaTryOn") });
  } else {
    const hasCredits = isColor ? c.report > 0 : c.pack > 0;
    const free = hero ? c.free : c.toolsFree;
    if (free > 0 && !hasCredits) {
      rows.push({ key: "free", text: tKit(hero ? "quotaPreview" : "quotaFree", { count: free }) });
    }
  }

  // 试穿只能用积分：没买过的也给一个入口去补充
  const showCredits = !isColor && (tryOn || c.hasPurchased || c.pack > 0);
  if (rows.length === 0 && !showCredits) return null;

  return (
    <div className="flex flex-col items-start gap-1.5">
      {rows.map((row) => (
        <p
          key={row.key}
          className={`inline-flex items-start gap-1.5 text-xs ${row.highlight ? "font-medium text-primary" : "text-muted-foreground"}`}
        >
          <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          <span>{row.text}</span>
        </p>
      ))}
      {showCredits && (
        <button
          type="button"
          onClick={onTopUp}
          className="inline-flex items-center gap-1 self-start rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/10"
        >
          {c.pack > 0 ? tKit("chipCredits", { count: c.pack }) : c.hasPurchased ? tKit("chipTopUp") : tKit("chipGetCredits")}
        </button>
      )}
    </div>
  );
}

/**
 * 额度用完时的付费墙：只有一条出路——买套装（老顾客是加购包）。没有邀请 / 签到换额度，免得绕开付费。
 */
/** 虚拟试穿的示例：选一件单品，左右对比「试穿前 / 试穿后」，单品缩略图叠在前图一角 */
function TryOnExample({ t }: { t: (key: string, values?: Record<string, string | number>) => string }) {
  const [active, setActive] = useState<(typeof TRYON_EXAMPLES)[number]>(TRYON_EXAMPLES[0]);
  const src = (kind: "before" | "after" | "item") => `/demo/tryon/${active}-${kind}.webp`;
  const category = t(`tryonCat_${active}`);
  return (
    <section className="rounded-2xl border border-gold/40 bg-gradient-to-br from-white to-muted/50 p-4 shadow-sm">
      <p className="text-sm font-semibold">{t("tryonExHeading")}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t("tryonExSub")}</p>
      <div role="group" aria-label={t("tryonExHeading")} className="mt-3 flex flex-wrap gap-1.5">
        {TRYON_EXAMPLES.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={key === active}
            onClick={() => {
              setActive(key);
              trackEvent("tryon_example_switched", { category: key });
            }}
            className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs font-medium transition ${
              key === active ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground hover:border-primary/50"
            }`}
          >
            {t(`tryonCat_${key}`)}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <figure className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src("before")} alt={t("tryonExBefore")} width={720} height={960} className="aspect-[3/4] w-full rounded-xl border border-border object-cover" />
          <figcaption className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-semibold text-white">{t("tryonExBefore")}</figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src("item")} alt={`${t("tryonExItem")}: ${category}`} width={400} height={400} className="absolute bottom-2 right-2 h-[26%] w-auto rounded-lg border-2 border-white bg-white object-cover shadow-md" />
        </figure>
        <figure className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src("after")} alt={t("tryonExAfter")} width={720} height={960} className="aspect-[3/4] w-full rounded-xl border border-border object-cover" />
          <figcaption className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-white">{t("tryonExAfter")}</figcaption>
        </figure>
      </div>
      <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">{t("tryonExNote")}</p>
    </section>
  );
}

function NoQuotaCard({
  t,
  tKit,
  type,
  hasPurchased = false,
  onViewPlans,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
  /** 套装相关文案（kit 命名空间） */
  tKit: (key: string, values?: Record<string, string | number>) => string;
  /** 当前分析类型：色彩分析用的是报告额度，不是积分，老顾客也要重新买套装，文案要分开说 */
  type: string;
  hasPurchased?: boolean;
  onViewPlans: () => void;
}) {
  const { money } = usePrices();
  useEffect(() => {
    // 只在卡片出现时上报一次
    trackEvent("quota_wall_shown");
  }, []);

  // 买过的人：色彩分析要再买套装（积分不能做色彩分析），其余类型再买加购包
  const buyerNeedsKit = hasPurchased && type === "color_analysis";
  const buyerNeedsCredits = hasPurchased && !buyerNeedsKit;
  // 虚拟试穿从来没有免费次数：没买过的人看到的不是「额度用完了」，而是「试穿要用积分」
  const tryOnNeedsKit = !hasPurchased && type === "scan_tryon";

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
      <p className="text-lg font-semibold text-amber-900">
        {buyerNeedsKit ? tKit("noQuotaReportTitle") : buyerNeedsCredits ? tKit("noQuotaBuyerTitle") : tryOnNeedsKit ? tKit("noQuotaTryOnTitle") : t("noQuotaTitle")}
      </p>
      <p className="mt-1 text-sm text-amber-700">
        {buyerNeedsKit ? tKit("noQuotaReportDesc") : buyerNeedsCredits ? tKit("noQuotaBuyerDesc") : tryOnNeedsKit ? tKit("noQuotaTryOnDesc") : tKit("noQuotaDesc")}
      </p>
      <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2.5">
        <button
          onClick={() => {
            trackEvent("quota_wall_option_click", { option: "pay" });
            onViewPlans();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
        >
          {buyerNeedsCredits
            ? tKit("addonCta", { credits: ADDON_CREDITS, price: money("addon") })
            : tKit("cta", { price: money("kit") })}
        </button>
      </div>
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className || "h-4 w-4"}`} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        className="opacity-75"
      />
    </svg>
  );
}

function ImageLightbox({
  entry,
  initialIndex,
  onClose,
  onCorrection,
  onDownload,
  onShare,
  packCredits,
  kitPrice,
  unlocking,
  onUnlock,
  demo = false,
  t,
}: {
  entry: HistoryEntry;
  initialIndex: number;
  onClose: () => void;
  onCorrection: (entry: HistoryEntry) => void;
  onDownload: (url: string) => void;
  onShare: (url: string, taskId?: string | null) => void;
  packCredits: number;
  /** 套装价：写在解锁按钮上，用户点开付费弹窗前就知道多少钱 */
  kitPrice: string;
  unlocking: boolean;
  /** 解锁：积分包够就直接扣积分，不够则由调用方打开付费弹窗 */
  onUnlock: (entry: HistoryEntry) => void;
  /** 示例报告：不是真实生成的结果，不提供下载 / 分享 / 改错 */
  demo?: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [index, setIndex] = useState(initialIndex);
  const urls = entry.image_urls;
  const currentUrl = urls[index];
  const reportUnlocked = !!entry.unlocked;
  const reportLocked = !!entry.locked;
  const unlockCost = creditCostOf(entry.type || "color_analysis");

  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1);
      if (e.key === "ArrowRight" && index < urls.length - 1) setIndex(index + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, urls.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // 手机上左右滑动翻页（多页报告）
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = e.changedTouches[0];
    if (!start || !touch || urls.length < 2) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && index < urls.length - 1) setIndex(index + 1);
    if (dx > 0 && index > 0) setIndex(index - 1);
  };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("exampleAfter")} tabIndex={-1} className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-black/80 outline-none backdrop-blur-sm" onClick={onClose}>
      {/* Close：固定在右上角并避开刘海，不再依赖内容容器的 -top 偏移 */}
      <button
        onClick={onClose}
        aria-label={t("close")}
        className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="flex min-h-full flex-col items-center justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16">
        <div className="flex w-full max-w-full flex-col items-center sm:w-auto" onClick={(e) => e.stopPropagation()}>
        {/* Image */}
        <div
          className="relative flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {index > 0 && (
            <button onClick={() => setIndex(index - 1)} aria-label={t("prev")} className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          {/* 外层 relative 紧贴图片尺寸（宽度上限用视口单位，避免百分比 max-width 让外层塌缩），锁定覆盖层按图片高度的比例定位 */}
          <div className="relative">
            <img
              src={currentUrl}
              alt={`${t(`type_${entry.type || "color_analysis"}`)} ${index + 1}/${urls.length}`}
              className="block max-h-[68dvh] w-auto max-w-[calc(100vw-1.5rem)] rounded-xl object-contain shadow-2xl sm:max-h-[75dvh] sm:max-w-[85vw]"
            />
            {reportLocked && (
              <LockOverlay
                type={entry.type}
                lockStart={entry.lock_start ?? DEFAULT_LOCK_START}
                cost={unlockCost}
                packCredits={packCredits}
                priceLabel={kitPrice}
                busy={unlocking}
                onUnlock={() => onUnlock(entry)}
                rounded
                t={t}
              />
            )}
          </div>
          {index < urls.length - 1 && (
            <button onClick={() => setIndex(index + 1)} aria-label={t("next")} className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>

        {/* 触屏设备：提示可长按图片保存到相册（桌面不显示） */}
        {!reportLocked && !demo && (
          <p className="mt-2 hidden text-center text-xs text-white/70 [@media(hover:none)]:block">{t("saveImageHint")}</p>
        )}

        {/* Page indicator：圆点外层加大到 24px 的点击区域 */}
        {urls.length > 1 && (
          <div className="mt-1 flex items-center">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Page ${i + 1}`}
                className="flex h-6 w-6 items-center justify-center"
              >
                <span className={`block h-2 w-2 rounded-full transition ${i === index ? "bg-white" : "bg-white/40"}`} />
              </button>
            ))}
          </div>
        )}

        {/* 未解锁（打码预览；预览补生成失败时的带水印兜底图也算）的解锁入口 */}
        {!reportUnlocked && (
          <button
            onClick={() => onUnlock(entry)}
            disabled={unlocking}
            className="mt-3 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/90 to-primary px-5 py-2 text-sm font-medium text-white shadow-lg transition hover:shadow-primary/25 disabled:opacity-60"
          >
            <LockIcon className="h-4 w-4" />
            {packCredits >= unlockCost
              ? t("unlockWithCredits", { count: unlockCost })
              : t("unlockPriceCta", { price: kitPrice })}
          </button>
        )}

        {/* Action bar */}
        {!demo && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={() => reportUnlocked ? onDownload(currentUrl) : onUnlock(entry)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/20"
          >
            <DownloadIcon />
            {reportUnlocked ? t("download") : t("upgradeToDownload")}
          </button>
          {SHARE_BUTTONS_ENABLED && (
            <button
              onClick={() => onShare(currentUrl, entry.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/20"
            >
              <ShareIcon />
              {t("share")}
            </button>
          )}
          {entry.source_image_url && entry.type !== "scan_tryon" && (
            <button
              onClick={() => onCorrection(entry)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary/80 px-4 py-2 text-sm text-white hover:bg-primary"
            >
              <CorrectionIcon />
              {t("correction")}
            </button>
          )}
        </div>
        )}
        </div>
      </div>
    </div>
  );
}

/** 结构化报告（色彩分析）的弹窗查看：历史记录、后台任务、付款后自动解锁都从这里打开 */
function ReportLightbox({
  entry,
  preferredLang,
  unlockLabel,
  unlocking,
  onClose,
  onUnlock,
  onSavePoster,
  onShare,
  onTryOn,
  tryOnBusy,
  kitRetest,
  onNotice,
  t,
}: {
  entry: HistoryEntry;
  preferredLang: string;
  unlockLabel: string;
  unlocking: boolean;
  onClose: () => void;
  onUnlock: (entry: HistoryEntry) => void;
  onSavePoster: (posterUrl: string) => void;
  onShare: (posterUrl: string, taskId?: string | null, report?: boolean) => void;
  onTryOn: (season: string) => void;
  tryOnBusy: boolean;
  kitRetest?: { left: number; expiresAt: number | null; onRetest: () => void };
  onNotice: (message: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);
  const [report, setReport] = useState(entry.report!);

  // 解锁后 entry 里换成了完整数据（渲染期间同步，避免 effect 里 setState 多一次渲染）
  const [prevEntryReport, setPrevEntryReport] = useState(entry.report);
  if (entry.report !== prevEntryReport) {
    setPrevEntryReport(entry.report);
    if (entry.report) setReport(entry.report);
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("resultTitle")} tabIndex={-1} className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-black/80 outline-none backdrop-blur-sm" onClick={onClose}>
      <button
        onClick={onClose}
        aria-label={t("close")}
        className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <div className="flex min-h-full justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16">
        <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
          <ReportPanel
            taskId={entry.id === "demo" ? null : entry.id}
            report={report}
            sourceImageUrl={entry.source_image_url}
            createdAt={entry.created_at}
            demo={entry.id === "demo"}
            preferredLang={preferredLang}
            unlockLabel={unlockLabel}
            unlockBusy={unlocking}
            onUnlock={() => onUnlock(entry)}
            onSavePoster={onSavePoster}
            onShare={(url, id) => onShare(url, id, true)}
            onTryOn={entry.source_image_url ? onTryOn : undefined}
            tryOnBusy={tryOnBusy}
            kitRetest={kitRetest}
            onNotice={onNotice}
            onReportUpdated={setReport}
          />
        </div>
      </div>
    </div>
  );
}

/** 独立工具（脸型 / 发型 / 眼镜 …）的弹窗查看：历史记录、后台任务从这里打开；样子和结果页一致（文字分析 + 试戴） */
function LensLightbox({
  entry,
  lens,
  preferredLang,
  onBuyCredits,
  onShare,
  onClose,
  t,
}: {
  entry: HistoryEntry;
  lens: LookbookSheetKey;
  preferredLang: string;
  onBuyCredits: () => void;
  onShare: (taskId: string) => void;
  onClose: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t(`type_${entry.type || "color_analysis"}`)} tabIndex={-1} className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-black/80 outline-none backdrop-blur-sm" onClick={onClose}>
      <button
        onClick={onClose}
        aria-label={t("close")}
        className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <div className="flex min-h-full justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16">
        <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
          <LensPanel
            taskId={entry.id}
            lens={lens}
            title={t(`type_${entry.type || "color_analysis"}`)}
            season={entry.report?.season}
            lang={preferredLang}
            sourceImageUrl={entry.source_image_url}
            onBuyCredits={onBuyCredits}
          >
            <LensShareButton label={t("share")} onClick={() => onShare(entry.id)} />
          </LensPanel>
        </div>
      </div>
    </div>
  );
}

/** 手机上无法调起系统分享面板时的「长按保存」兜底：整宽大图 + 说明 */
function SaveImageSheet({
  url,
  onClose,
  t,
}: {
  url: string;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("saveImageTitle")} tabIndex={-1} className="fixed inset-0 z-[180] flex items-end justify-center bg-black/60 outline-none backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">{t("saveImageTitle")}</h3>
          <button onClick={onClose} aria-label={t("close")} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl">
          <img src={url} alt={t("saveImageTitle")} className="h-auto w-full rounded-xl" />
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">{t("saveImageHint")}</p>
      </div>
    </div>
  );
}

function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

/**
 * 覆盖层里点名「解锁后能看到什么」的报告类型。文案（tryPage.lockedUnlocks_<type>）列的是各类报告
 * 打码线以下实际会生成的章节，来源是后端提示词里的章节结构，改提示词章节时这里的文案要一起改。
 * 不在这个集合里的类型（旧类型、未知类型）回退到通用提示 lockedHint。
 */
const LOCK_CONTENT_TYPES = new Set([
  "color_analysis",
  "makeup",
  "face_shape",
  "hair_preview",
  "outfit_color",
  "glasses_match",
  "occasion_makeup",
  "jewelry_guide",
  "glow_up_report",
  "style_personality",
  "celebrity_match",
  "palette_scan",
  "scan_tryon",
]);

/**
 * 锁定报告上的「解锁」覆盖层：图片下半部分已经由服务端打码（原图根本没下发），
 * 这里只是把引导文案和按钮摆在打码区域里，top 按服务端给出的 lock_start 比例定位。
 * 文案不说「细节被隐藏」这种负面提示，而是点名这份报告解锁后会看到的具体内容。
 */
function LockOverlay({
  type,
  lockStart,
  cost,
  packCredits,
  priceLabel,
  busy,
  onUnlock,
  rounded,
  t,
}: {
  type?: string | null;
  lockStart: number;
  cost: number;
  packCredits: number;
  /** 套装价：积分不够时按钮写成「解锁完整报告 · $19.99」 */
  priceLabel: string;
  busy: boolean;
  onUnlock: () => void;
  rounded?: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const canSpend = packCredits >= cost;
  const hint = type && LOCK_CONTENT_TYPES.has(type) ? t(`lockedUnlocks_${type}`) : t("lockedHint");
  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-2 px-4 text-center ${rounded ? "rounded-b-xl" : ""}`}
      style={{ top: `${Math.round(lockStart * 100)}%` }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow">
        <LockIcon className="h-4 w-4" />
      </span>
      <p className="max-w-[17rem] text-xs font-semibold leading-snug text-neutral-800">{hint}</p>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onUnlock(); }}
        disabled={busy}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
      >
        {busy ? <Spinner className="h-3.5 w-3.5" /> : null}
        {canSpend ? t("unlockWithCredits", { count: cost }) : t("unlockPriceCta", { price: priceLabel })}
      </button>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

/** 独立工具结果卡片下面的「分享」：分享出去的是只含这一章的公开页（分析文字 + 试戴过的图） */
function LensShareButton({ label, onClick }: { label: string; onClick: () => void }) {
  if (!SHARE_BUTTONS_ENABLED) return null;
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-5 text-sm font-semibold text-primary transition hover:bg-primary/10"
      >
        <ShareIcon />
        {label}
      </button>
    </div>
  );
}

function CorrectionIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  );
}

function CorrectionSheet({
  entry,
  onClose,
  onSubmit,
  t,
}: {
  entry: HistoryEntry;
  onClose: () => void;
  onSubmit: (entry: HistoryEntry, corrections: string) => void;
  t: (key: string) => string;
}) {
  const [text, setText] = useState("");

  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("correction")} tabIndex={-1} className="fixed inset-0 z-[150] flex items-end justify-center outline-none sm:items-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("correction")}</h3>
          <button onClick={onClose} aria-label={t("close")} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{t("correctionDesc")}</p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("correctionPlaceholder")}
          className="w-full h-32 resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-base sm:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />

        <button
          onClick={() => { if (text.trim()) onSubmit(entry, text.trim()); }}
          disabled={!text.trim()}
          className="mt-4 min-h-12 w-full rounded-full bg-gradient-to-r from-primary to-primary-dark py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("correctionSubmit")}
        </button>
      </div>
    </div>
  );
}

const SHARE_PLATFORMS = [
  {
    id: "x",
    name: "X (Twitter)",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    buildUrl: (url: string, text: string, tags: string) => {
      const hashtags = tags ? ` ${tags.split(",").map((t) => `#${t.trim()}`).join(" ")}` : "";
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + hashtags)}&url=${encodeURIComponent(url)}`;
    },
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    buildUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    buildUrl: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0a12 12 0 00-4.373 23.178c-.07-.633-.134-1.606.028-2.298.146-.625.943-3.998.943-3.998s-.24-.482-.24-1.194c0-1.118.648-1.953 1.457-1.953.687 0 1.019.516 1.019 1.134 0 .691-.44 1.724-.667 2.681-.19.8.402 1.452 1.192 1.452 1.43 0 2.529-1.508 2.529-3.683 0-1.926-1.384-3.27-3.361-3.27-2.289 0-3.633 1.717-3.633 3.493 0 .692.267 1.433.599 1.835a.24.24 0 01.056.23c-.061.255-.197.8-.224.912-.035.146-.116.177-.268.107-1-.465-1.624-1.926-1.624-3.1 0-2.523 1.834-4.84 5.286-4.84 2.775 0 4.932 1.977 4.932 4.62 0 2.757-1.739 4.976-4.151 4.976-.811 0-1.573-.421-1.834-.919l-.498 1.902c-.181.695-.669 1.566-.995 2.097A12 12 0 1012 0z" />
      </svg>
    ),
    buildUrl: (url: string, text: string, _tags: string, media?: string) =>
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}${media ? `&media=${encodeURIComponent(media)}` : ""}`,
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: <span className="text-xs font-bold text-sky-500">TG</span>,
    buildUrl: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "threads",
    name: "Threads",
    icon: <span className="text-sm font-bold text-foreground">@</span>,
    buildUrl: (url: string, text: string) => `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: <span className="text-xs font-bold text-orange-600">r/</span>,
    buildUrl: (url: string, text: string) => `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <span className="text-xs font-bold text-blue-700">in</span>,
    buildUrl: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
] as const;

type SharePlatform = typeof SHARE_PLATFORMS[number];

// 所有语种用同一组国际主流渠道，不按地区定制（每行 4 列）。
// Instagram / YouTube 没有网页分享链接：手机上走系统分享面板（会带图片），这里放不了按钮
const SHARE_PLATFORM_IDS = ["facebook", "x", "threads", "whatsapp", "pinterest", "telegram", "reddit", "linkedin"];

function getSharePlatforms(): SharePlatform[] {
  return SHARE_PLATFORM_IDS
    .map((id) => SHARE_PLATFORMS.find((p) => p.id === id))
    .filter((p): p is SharePlatform => Boolean(p));
}

function SharePanel({
  url,
  shareLink,
  report,
  onClose,
  onCopied,
  t,
}: {
  url: string;
  shareLink: string;
  /** 分享的是结构化报告：分享页封面会露出用户的照片，提示文案要如实说明 */
  report?: boolean;
  onClose: () => void;
  onCopied: () => void;
  t: (key: string) => string;
}) {
  const [caption, setCaption] = useState(t("shareText"));
  const [tags, setTags] = useState("BelleAI,ColorAnalysis,Beauty");
  const platforms = getSharePlatforms();
  // 没有现成的图（没解锁的报告 / 独立工具）时，预览和 Pinterest 的配图用分享页的预览图；本地 blob / data 地址别人读不到，Pinterest 只收公开地址
  const photoPath = sharePhotoPath(shareLink);
  const preview = url || photoPath || "";
  const pinMedia = /^https?:/.test(url) ? url : photoPath ? new URL(photoPath, shareLink).toString() : "";

  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handlePlatformClick = (platform: SharePlatform) => {
    trackEvent("share_platform_click", { platform: platform.id });
    // 每个渠道的链接带上 utm_content，之后可以在 GA 里比较各渠道的带来的访问与转化
    const link = tagShareLink(shareLink, platform.id);
    const target = platform.id === "pinterest"
      ? (platform.buildUrl as (u: string, t: string, tg: string, m?: string) => string)(link, caption, tags, pinMedia)
      : platform.buildUrl(link, caption, tags);
    openShareWindow(target);
  };

  const handleCopyLink = async () => {
    trackEvent("share_link_copied");
    const ok = await copyText(tagShareLink(shareLink, "copy"));
    if (!ok) {
      trackEvent("share_link_copy_failed", { source: "share_panel" });
      return;
    }
    onCopied();
    onClose();
  };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("share")} tabIndex={-1} className="fixed inset-0 z-[150] flex items-end justify-center outline-none sm:items-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl bg-card border border-border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("share")}</h3>
          <button onClick={onClose} aria-label={t("close")} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Preview */}
        <div className="mb-4 flex gap-3 rounded-xl border border-border p-3">
          {preview && <img src={preview} alt="" className="h-16 w-12 rounded-lg object-cover" />}
          <div className="flex-1 min-w-0">
            {/* 输入框字号至少 16px，否则 iOS 聚焦时会自动放大整页 */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full resize-none rounded-lg border-0 bg-transparent p-0 text-base focus:outline-none focus:ring-0 sm:text-sm"
              rows={2}
              placeholder={t("shareText")}
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border-0 bg-transparent p-0 text-base text-primary focus:outline-none focus:ring-0 sm:text-xs"
              placeholder="#BelleAI #Beauty"
            />
          </div>
        </div>

        {/* Platform buttons */}
        <div className="grid grid-cols-4 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handlePlatformClick(platform)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition hover:bg-muted"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {platform.icon}
              </div>
              <span className="text-xs text-muted-foreground">{platform.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">{t(report ? "shareLinkNoticeReport" : "shareLinkNotice")}</p>

        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {t("copyLink")}
        </button>
      </div>
    </div>
  );
}
