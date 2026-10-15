"use client";

import { useState, useRef, useCallback, useEffect, useSyncExternalStore } from "react";
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
  getReferralCode,
  webCheckin,
  createShare,
  unlockReport,
  REFERRAL_BONUS_EVENT,
  DEFAULT_LOCK_START,
  type HistoryEntry,
  type ReportResult,
  type WebInitData,
  type AnalysisType as ApiAnalysisType,
} from "@/lib/api";
import {
  storeReferralCode,
  buildReferralUrl,
  buildSharePageUrl,
  tagShareLink,
} from "@/lib/referral";
import { SITE_URL, PACK_CREDITS, PACK_PRICE } from "@/lib/constants";
import { trackEvent, trackCheckoutEvent, trackFeedbackSubmitted } from "@/lib/analytics";
import { consumeCheckoutContext } from "@/lib/checkout";
import { prepareImageForUpload } from "@/lib/imageUpload";
import { isMobileDevice, copyText, canUseNativeShare, nativeShare, openShareWindow } from "@/lib/device";
import { RESULT_READY_EVENT } from "@/lib/google-signin";
import { useSignIn } from "@/lib/useSignIn";
import { useDialogA11y } from "@/lib/useDialogA11y";
import { PricingModal } from "@/components/PricingModal";
import { InAppBrowserNotice, InAppSignInSheet } from "@/components/InAppBrowserNotice";

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

const ALL_VALID_TYPES: AnalysisType[] = [
  "makeup", "color_analysis", "face_shape", "hair_preview", "outfit_color",
  "glasses_match", "occasion_makeup", "jewelry_guide", "glow_up_report",
  "style_personality", "palette_scan", "celebrity_match",
];

function IconPalette() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>; }
function IconShirt() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>; }
function IconFace() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>; }
function IconScissors() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm9.304 0l-1.536.887M17.152 8.25a3 3 0 105.196-3 3 3 0 00-5.196 3zM12 18.75l-3.537-5.29m3.537 5.29l3.537-5.29M12 18.75l-7.5-10.5h15l-7.5 10.5z" /></svg>; }
function IconGlasses() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function IconLipstick() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>; }
function IconSparkle() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>; }
function IconGem() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 5v8l-8 5-8-5V8l8-5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M4 8l8 5 8-5" /></svg>; }
function IconCrown() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 18l3-12 6 6 6-6 3 12H3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18" /></svg>; }
function IconMirror() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="10" r="6" /><path strokeLinecap="round" d="M12 16v5M9 21h6" /></svg>; }
function IconStar() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>; }
function IconSwatch() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197" /></svg>; }

interface AnalysisTypeGroup {
  category: string;
  items: { value: AnalysisType; icon: React.ReactNode; creditCost?: number }[];
}

const ANALYSIS_TYPE_GROUPS: AnalysisTypeGroup[] = [
  {
    category: "discover_colors",
    items: [
      { value: "color_analysis", icon: <IconPalette /> },
      { value: "outfit_color", icon: <IconShirt /> },
    ],
  },
  {
    category: "find_style",
    items: [
      { value: "face_shape", icon: <IconFace /> },
      { value: "hair_preview", icon: <IconScissors /> },
      { value: "glasses_match", icon: <IconGlasses /> },
    ],
  },
  {
    category: "get_look",
    items: [
      { value: "makeup", icon: <IconLipstick /> },
      { value: "occasion_makeup", icon: <IconSparkle /> },
      { value: "jewelry_guide", icon: <IconGem /> },
    ],
  },
  {
    category: "premium",
    items: [
      { value: "glow_up_report", icon: <IconCrown />, creditCost: 3 },
      { value: "style_personality", icon: <IconMirror /> },
      { value: "celebrity_match", icon: <IconStar /> },
    ],
  },
];

const FLAT_ANALYSIS_TYPES = ANALYSIS_TYPE_GROUPS.flatMap((g) => g.items);

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
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "th", label: "ไทย" },
  { code: "id", label: "Bahasa" },
  { code: "tr", label: "Türkçe" },
  { code: "vi", label: "Tiếng Việt" },
];

const LOCALE_TO_REPORT_LANG: Record<string, string> = {
  en: "en", zh: "zh-Hans", ja: "ja", ko: "ko", es: "es", fr: "fr",
  de: "de", pt: "pt", it: "it", ru: "ru", ar: "ar", hi: "hi",
  th: "th", id: "id", tr: "tr", vi: "vi",
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
  hair_preview: ["color_analysis", "outfit_color", "celebrity_match"],
  outfit_color: ["color_analysis", "jewelry_guide", "style_personality"],
  glasses_match: ["face_shape", "style_personality", "celebrity_match"],
  occasion_makeup: ["color_analysis", "jewelry_guide", "outfit_color"],
  jewelry_guide: ["outfit_color", "color_analysis", "glow_up_report"],
  glow_up_report: ["celebrity_match", "style_personality", "occasion_makeup"],
  style_personality: ["outfit_color", "celebrity_match", "glow_up_report"],
  palette_scan: ["color_analysis", "outfit_color", "makeup"],
  celebrity_match: ["style_personality", "makeup", "hair_preview"],
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
};

const EXAMPLE_IMAGES: Partial<Record<AnalysisType, string>> = {
  color_analysis: "/images/examples/report_color_analysis.webp",
  makeup: "/images/examples/report_makeup.webp",
  face_shape: "/images/examples/report_face_shape.webp",
  hair_preview: "/images/examples/report_hair_preview.webp",
  outfit_color: "/images/examples/report_outfit_color.webp",
  glasses_match: "/images/examples/report_glasses_match.webp",
  occasion_makeup: "/images/examples/report_occasion_makeup.webp",
  jewelry_guide: "/images/examples/report_jewelry_guide.webp",
  glow_up_report: "/images/examples/report_glow_up_report.webp",
  style_personality: "/images/examples/report_style_personality.webp",
  celebrity_match: "/images/examples/report_celebrity_match.webp",
};

/** 示例照片：所有类型的示例报告都是用这张照片预先生成好的 */
const SAMPLE_PHOTO_URL = "/images/examples/before.webp";
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
}

/** 积分分三类显示：免费（每日额度 + 签到/邀请，只能生成预览报告）、积分包（完整报告）、订阅额度 */
interface UserCredits {
  /** 免费额度剩余 */
  free: number;
  /** 签到 / 邀请获得的积分 */
  bonus: number;
  /** 积分包积分：用它生成或解锁的报告是完整的 */
  pack: number;
  subRemaining: number;
  subPlan: string | null;
  totalRemaining: number;
}

function toUserCredits(data: WebInitData): UserCredits {
  return {
    free: data.web_quota.remaining,
    bonus: data.paid_credits ?? 0,
    pack: data.pack_credits ?? 0,
    subRemaining: data.subscription?.remaining ?? 0,
    subPlan: data.subscription?.plan ?? null,
    totalRemaining: data.total_remaining ?? data.web_quota.remaining,
  };
}

/** 与后端 _credit_cost 保持一致：Glow-Up 报告 3 积分，其余 1 积分 */
function creditCostOf(type: string): number {
  return type === "glow_up_report" ? 3 : 1;
}

function lockStateOf(result: Pick<ReportResult, "locked" | "unlocked" | "lockStart">): ResultLock {
  return { locked: result.locked, unlocked: result.unlocked, lockStart: result.lockStart };
}

interface ResultLock {
  locked: boolean;
  unlocked: boolean;
  lockStart: number;
}

const NO_LOCK: ResultLock = { locked: false, unlocked: false, lockStart: DEFAULT_LOCK_START };
/** 演示报告是预先生成好的完整图，不打码、不用解锁 */
const DEMO_LOCK: ResultLock = { locked: false, unlocked: true, lockStart: DEFAULT_LOCK_START };

export function TryClient({ locale, initialType }: { locale: string; initialType?: string }) {
  const t = useTranslations("tryPage");

  const validInitialType = (ALL_VALID_TYPES.includes(initialType as AnalysisType) ? initialType : "color_analysis") as AnalysisType;

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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [correctionModal, setCorrectionModal] = useState<HistoryEntry | null>(null);
  const [shareModal, setShareModal] = useState<{ imageUrl: string; link: string } | null>(null);
  // 当前结果页对应的任务 ID：创建公开分享链接时需要
  const [resultTaskId, setResultTaskId] = useState<string | null>(null);
  const shareBusyRef = useRef(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingSource, setPricingSource] = useState("unknown");
  // 从锁定报告点进来时，付费弹窗里展示这份报告的打码预览，让用户知道买的是什么
  const [pricingPreview, setPricingPreview] = useState<string | null>(null);
  // 同时记下是哪份报告：买完积分包回到页面后，自动用积分解锁它
  const [pricingTaskId, setPricingTaskId] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "confirming" | "success" | "delayed">("idle");
  const [checkoutBought, setCheckoutBought] = useState<"pack" | "pack_unlocked" | "sub">("sub");
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
  const [lastUploadedPhotoUrl, setLastUploadedPhotoUrl] = useState<string | null>(null);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [examplePreview, setExamplePreview] = useState<string | null>(null);

  const [resolution, setResolution] = useState<Resolution>("1K");
  const [reportLang, setReportLang] = useState(LOCALE_TO_REPORT_LANG[locale] || "en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [generateElapsed, setGenerateElapsed] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [checkinAvailable, setCheckinAvailable] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinJustDone, setCheckinJustDone] = useState(false);
  const [checkinStreak, setCheckinStreak] = useState(0);
  const [checkinMaxStreak, setCheckinMaxStreak] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [invitePopupCopied, setInvitePopupCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [referralBonus, setReferralBonus] = useState<number | null>(null);
  // 默认只露出当前分析类型，其余折叠成「更多分析类型」；带 ?type= 深链进来时直接展开，保持原来的选择体验
  const [typesExpanded, setTypesExpanded] = useState(!!initialType && validInitialType !== "color_analysis");
  // 上传阶段拆成「压缩」和「上传」两步，大图在手机上压缩要几秒，用户需要知道在做什么
  const [uploadStage, setUploadStage] = useState<"compressing" | "uploading">("compressing");
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  // 示例照片演示模式：不上传、不扣积分、不请求后端，直接展示预先生成好的完整示例报告
  const [demoMode, setDemoMode] = useState(false);
  const demoTimerRef = useRef<number | null>(null);
  const demoTypeRef = useRef<AnalysisType>(validInitialType);

  const fileRef = useRef<HTMLInputElement>(null);
  // 手机上有「拍一张自拍」和「从相册选择」两个入口（两个 input），所以不能再从某个 input 的 files 里取文件
  const cameraRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  // 手机上结果/进度卡片排在上传区下面：生成开始、出结果、出错时需要主动滚到它，否则用户只看到按钮上的转圈
  const [showTypeInfo, setShowTypeInfo] = useState(false);
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
    if (prefs.reportLang) setReportLang(prefs.reportLang);
    if (prefs.resolution) setResolution(prefs.resolution);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      storeReferralCode(ref);
    }
  }, []);

  useEffect(() => {
    getReferralCode().then((res) => {
      if (res.code === 200 && res.data) {
        setReferralCode(res.data.referral_code);
      }
    });
  }, []);

  // 被邀请人第一次分析成功后，后端发放奖励；这里提示用户并刷新积分
  useEffect(() => {
    let hideTimer: number | undefined;
    const onBonus = (e: Event) => {
      const count = Number((e as CustomEvent<number>).detail) || 0;
      if (count <= 0) return;
      setReferralBonus(count);
      trackEvent("referral_bonus_received", { credits: count });
      webInit().then((res) => {
        const data = res.data;
        if (res.code === 200 && data) {
          setQuota(data.web_quota);
          setUserCredits(toUserCredits(data));
        }
      });
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setReferralBonus(null), 7000);
    };
    window.addEventListener(REFERRAL_BONUS_EVENT, onBonus);
    return () => {
      window.removeEventListener(REFERRAL_BONUS_EVENT, onBonus);
      window.clearTimeout(hideTimer);
    };
  }, []);

  // 出结果后通知全局：匿名用户会在几秒后看到一次 Google One Tap（保存记录/订阅）
  useEffect(() => {
    // 演示报告不算真实结果：不触发「保存记录 / 订阅」的 One Tap
    if (phase === "done" && resultUrls.length > 0 && !demoMode) {
      window.dispatchEvent(new Event(RESULT_READY_EVENT));
    }
  }, [phase, resultUrls.length, demoMode]);

  useEffect(() => {
    if (phase !== "done" || resultUrls.length === 0 || demoMode) return;
    // 报告还被锁着时用户的注意力在「解锁」上，邀请弹窗留到下一份完整报告再弹
    if (resultLock.locked) return;
    try {
      if (localStorage.getItem("belle_invite_popup_shown") === "true") return;
    } catch {
      /* 隐私模式读不到时按未展示处理 */
    }

    // 手机屏幕小，弹窗会整个盖住刚出的报告：多给用户一点时间先看结果
    const timer = window.setTimeout(() => {
      setShowInvitePopup(true);
      trackEvent("invite_popup_shown");
    }, isMobileDevice() ? 10000 : 2000);

    return () => window.clearTimeout(timer);
  }, [phase, resultUrls.length, resultLock.locked, demoMode]);

  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;

    webInit().then((initRes) => {
      if (initRes.code === 200 && initRes.data) {
        const data = initRes.data;
        setQuota(data.web_quota);
        setUserCredits(toUserCredits(data));
        setIsPaid(data.subscription?.status === "active");
        setCheckinAvailable(data.checkin_available ?? false);
        setCheckinStreak(data.checkin_streak ?? 0);
        setCheckinMaxStreak(data.checkin_max_streak ?? 0);
        setHistoryLoading(true);
        Promise.all([fetchHistory(), fetchProcessingTask()])
          .then(([historyRes, procRes]) => {
            if (historyRes.code === 200 && historyRes.data?.list) {
              setHistory(historyRes.data.list);
            }
            const pendingTask = procRes.data?.task;
            if (pendingTask) {
              setAnalysisType(pendingTask.type as AnalysisType);
              setPhase("generating");
              pollUntilDone(pendingTask.task_id)
                .then((result) => {
                  setResultUrls(result.urls);
                  setResultLock(lockStateOf(result));
                  setResultTaskId(pendingTask.task_id);
                  setPhase("done");
                  reloadHistory();
                })
                .catch((err) => {
                  setErrorMsg(err instanceof Error ? err.message : "Resume failed");
                  setPhase("error");
                });
            }
          })
          .finally(() => setHistoryLoading(false));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    fetchHistory().then((res) => {
      if (res.code === 200 && res.data?.list) {
        setHistory(res.data.list);
      }
    });
  }, []);

  /** 按意图打开付费墙（点下载 / 解锁条幅 / 选 2K4K / 额度用完…），source 用于归因 */
  const openPricing = useCallback((source: string, previewImage?: string | null, taskId?: string | null) => {
    trackEvent("pricing_modal_opened", { source });
    setPricingSource(source);
    setPricingPreview(previewImage ?? null);
    setPricingTaskId(taskId ?? null);
    setShowPricingModal(true);
  }, []);

  /** 生成 / 解锁 / 签到之后，从服务端同步最新的三类积分 */
  const refreshCredits = useCallback(async () => {
    try {
      const res = await webInit();
      if (res.code === 200 && res.data) {
        setQuota(res.data.web_quota);
        setUserCredits(toUserCredits(res.data));
        setIsPaid(res.data.subscription?.status === "active");
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
  const applyUnlocked = useCallback((taskId: string, imageUrls: string[]) => {
    if (taskId === resultTaskId) {
      setResultUrls(imageUrls);
      setResultLock((prev) => ({ ...prev, locked: false, unlocked: true }));
    }
    setBackgroundTasks((prev) => prev.map((task) => (
      task.taskId === taskId ? { ...task, resultUrls: imageUrls, locked: false, unlocked: true } : task
    )));
    setLightbox((prev) => (
      prev && prev.entry.id === taskId
        ? { ...prev, entry: { ...prev.entry, image_urls: imageUrls, locked: false, unlocked: true } }
        : prev
    ));
    reloadHistory();
  }, [resultTaskId, reloadHistory]);

  /**
   * 点击锁定报告上的「解锁」：
   * - 积分包够用：直接花积分解锁这份报告（不重新生成）
   * - 不够：打开付费弹窗（积分包为主，订阅为辅）
   */
  const handleUnlock = useCallback(async (taskId: string | null | undefined, type: string, previewImage?: string | null) => {
    const cost = creditCostOf(type);
    const pack = userCredits?.pack ?? 0;
    trackEvent("locked_cta_clicked", { type, has_pack: pack >= cost });
    if (!taskId || pack < cost) {
      openPricing("report_lock", previewImage, taskId);
      return;
    }
    if (unlockingId) return;
    setUnlockingId(taskId);
    try {
      const res = await unlockReport(taskId);
      if (res.code === 200 && res.data?.unlocked) {
        const packAfter = res.data.pack_credits;
        applyUnlocked(taskId, res.data.image_urls);
        trackEvent("report_unlocked_with_credits", { type, cost: res.data.credit_cost ?? cost });
        // 先本地扣掉，界面立即变化；随后用服务端数据校准
        setUserCredits((prev) => {
          if (!prev || packAfter == null) return prev;
          const delta = packAfter - prev.pack;
          return { ...prev, pack: packAfter, totalRemaining: Math.max(0, prev.totalRemaining + delta) };
        });
        refreshCredits();
      } else if (res.code === 429) {
        openPricing("report_lock", previewImage, taskId);
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
  // 订阅 / 积分包都由 webhook 异步写入，这里轮询状态：订阅看 status，积分包看 pack_credits 是否比下单前增加；
  // 到账后刷新额度与历史记录（订阅用户的历史图片会换成无打码的签名地址）
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
          const subActive = data?.subscription?.status === "active";
          const packArrived = (data?.pack_credits ?? 0) > (ctx?.packBefore ?? 0);
          const arrived = ctx?.product === "pack" ? packArrived : ctx?.product ? subActive : (subActive || packArrived);
          if (res.code === 200 && data && arrived) {
            setQuota(data.web_quota);
            setUserCredits(toUserCredits(data));
            setIsPaid(subActive);
            reloadHistory();
            trackCheckoutEvent("checkout_completed", { product: ctx?.product, source: ctx?.source });

            // 买积分包就是为了看某份被锁的报告：到账后直接用积分把它解锁并打开，不让用户再多点一步
            let unlockedAfterPurchase = false;
            if (ctx?.product === "pack" && ctx.unlockTaskId) {
              try {
                const unlockRes = await unlockReport(ctx.unlockTaskId);
                if (unlockRes.code === 200 && unlockRes.data?.unlocked) {
                  unlockedAfterPurchase = true;
                  trackEvent("report_unlocked_with_credits", { source: "after_purchase" });
                  const [histRes] = await Promise.all([fetchHistory(), refreshCredits()]);
                  const list = histRes.data?.list;
                  if (histRes.code === 200 && list) {
                    setHistory(list);
                    const entry = list.find((item) => item.id === ctx.unlockTaskId);
                    if (entry) setLightbox({ entry, imageIndex: 0 });
                  }
                }
              } catch {
                /* 自动解锁失败不影响到账：用户可以在报告上手动点「用积分解锁」 */
              }
            }

            setCheckoutBought(ctx?.product === "pack" ? (unlockedAfterPurchase ? "pack_unlocked" : "pack") : "sub");
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
  }, [reloadHistory, refreshCredits]);

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
    setResultLock(NO_LOCK);
    setAnalysisType(type);
    scrollToResult();

    try {
      const signInRes = await webInit();
      if (signInRes.code !== 200 || !signInRes.data) throw new Error(signInRes.message);
      const data = signInRes.data;
      if ((data.total_remaining ?? data.web_quota.remaining) <= 0) {
        setPhase("no_quota");
        return;
      }

      const taskRes = await createTask(entry.source_image_url, type, reportLang, { corrections, resolution });
      if (taskRes.code === 429) { setPhase("no_quota"); return; }
      if (taskRes.code !== 200 || !taskRes.data?.task_id) throw new Error(taskRes.message);

      const result = await pollUntilDone(taskRes.data.task_id);
      setResultUrls(result.urls);
      setResultLock(lockStateOf(result));
      setResultTaskId(taskRes.data.task_id);
      setPhase("done");
      reloadHistory();
      refreshCredits();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Correction failed");
      setPhase("error");
    }
  }, [reportLang, resolution, reloadHistory, refreshCredits, scrollToResult]);

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
   * 分享链接优先用「公开分享页」（好友先看到报告，再被引导去试），失败时退回普通邀请链接。
   * 分享页由用户主动点击分享时才创建，不会自动公开任何报告。
   */
  const resolveShareLink = useCallback(async (taskId?: string | null): Promise<string> => {
    const fallback = buildReferralUrl(SITE_URL, referralCode);
    if (!taskId) return fallback;
    try {
      const res = await createShare(taskId);
      if (res.code === 200 && res.data?.token) {
        return buildSharePageUrl(SITE_URL, locale, res.data.token);
      }
    } catch { /* 退回邀请链接 */ }
    return fallback;
  }, [referralCode, locale]);

  const handleShare = useCallback(async (url: string, taskId?: string | null) => {
    if (shareBusyRef.current) return;
    shareBusyRef.current = true;
    try {
      const isMobile = isMobileDevice();

      const link = await resolveShareLink(taskId ?? resultTaskId);
      const isSharePage = link.includes("/share/");
      trackEvent("share_link_created", { type: analysisType, kind: isSharePage ? "share_page" : "invite_link" });

      if (isMobile && navigator.share) {
        trackEvent("result_share", { method: "native", type: analysisType });
        const nativeLink = tagShareLink(link, "native");
        // 分享页本身带有报告图和邀请码，所以只发文字 + 链接，让社交平台抓取 OG 卡片；
        // 退回邀请链接时才附带图片文件，保证好友至少能看到报告
        if (!isSharePage) {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const file = new File([blob], `belle-ai-report.jpg`, { type: "image/jpeg" });
            const shareWithFile = { title: t("shareTitle"), text: `${t("shareText")} ${nativeLink}`, files: [file] };
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
        if (status === "failed") setShareModal({ imageUrl: url, link });
      } else {
        trackEvent("result_share", { method: "panel", type: analysisType });
        setShareModal({ imageUrl: url, link });
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

  /** 直接展示某个类型预先生成好的示例报告；该类型没有示例时返回 false */
  const showDemoResult = useCallback((type: AnalysisType) => {
    const example = EXAMPLE_IMAGES[type];
    if (!example) return false;
    setResultUrls([example]);
    setResultLock(DEMO_LOCK);
    setResultTaskId(null);
    setPhase("done");
    return true;
  }, []);

  const exitDemo = useCallback(() => {
    clearDemoTimer();
    setDemoMode(false);
    setPreviewUrl(null);
    setSourceImageUrl(null);
    setResultUrls([]);
    setResultLock(NO_LOCK);
    setResultTaskId(null);
    setErrorMsg("");
    setPhase("idle");
    clearSelectedFile();
  }, [clearDemoTimer, clearSelectedFile]);

  /** 示例照片体验：不上传、不请求后端、不扣积分，放一个很短的动画后直接出完整示例报告 */
  const startDemo = useCallback((type: AnalysisType) => {
    if (!EXAMPLE_IMAGES[type]) return;
    clearDemoTimer();
    demoTypeRef.current = type;
    setDemoMode(true);
    selectedFileRef.current = null;
    setSourceImageUrl(null);
    setPreviewUrl(SAMPLE_PHOTO_URL);
    setResultUrls([]);
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
      if (showDemoResult(finalType)) trackEvent("demo_completed", { type: finalType });
    }, DEMO_DELAY_MS);
  }, [clearDemoTimer, scrollToResult, showDemoResult]);

  /** 选择分析类型；演示模式下所有类型都有现成的示例报告，直接切过去，不用再等 */
  const selectType = useCallback((type: AnalysisType) => {
    setAnalysisType(type);
    if (!demoMode) return;
    demoTypeRef.current = type;
    clearDemoTimer();
    if (showDemoResult(type)) {
      scrollToResult();
    } else {
      exitDemo();
    }
  }, [demoMode, clearDemoTimer, showDemoResult, scrollToResult, exitDemo]);

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
      // 上传前会在浏览器里压缩到长边 2048px，所以这里可以放宽到 25MB（手机原图常见 5–12MB）
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
      setErrorMsg("");
    },
    [t, clearSelectedFile, demoMode, clearDemoTimer]
  );

  const handleGenerate = useCallback(async () => {
    if (!previewUrl) return;
    // 示例照片：不请求后端、不扣积分，直接重放演示
    if (demoMode) {
      startDemo(analysisType);
      return;
    }

    const generateStart = Date.now();
    setPhase("preparing");
    setErrorMsg("");
    setGenerateElapsed(0);
    trackEvent("generate_started", { type: analysisType, resolution, language: reportLang });

    // rawMessage 只上报给统计（用于排查），界面上展示翻译过的、能告诉用户下一步怎么做的提示
    const fail = (event: string, rawMessage: string, userMessage: string) => {
      setErrorMsg(userMessage);
      autoScrollRef.current = true;
      setPhase("error");
      trackEvent(event, {
        type: analysisType,
        error: rawMessage.slice(0, 100),
        size_kb: Math.round((selectedFileRef.current?.size ?? 0) / 1024),
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
      setIsPaid(data.subscription?.status === "active");

      if ((data.total_remaining ?? webQuota.remaining) <= 0) {
        trackEvent("quota_exhausted", { type: analysisType });
        setPhase("no_quota");
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

        try {
          // 先压缩再上传：大图 + 移动网络是 upload_failed 的主要来源
          const base64 = await prepareImageForUpload(file);
          setUploadStage("uploading");
          const uploadRes = await uploadImage(base64);
          if (uploadRes.code !== 200 || !uploadRes.data?.url) {
            fail("upload_failed", uploadRes.message || "Upload failed", t("errorUpload"));
            return;
          }
          imageUrl = uploadRes.data.url;
          setSourceImageUrl(imageUrl);
          setLastUploadedPhotoUrl(imageUrl);
          saveLastPhotoUrl(imageUrl);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload error";
          fail("upload_failed", message, t("errorUpload"));
          return;
        }
      }

      setPhase("generating");
      savePrefs(resolution, reportLang);

      let taskRes;
      try {
        taskRes = await createTask(imageUrl, analysisType, reportLang, {
          resolution,
          ...(analysisType === "occasion_makeup" ? { occasion } : {}),
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
        return;
      }
      if (taskRes.code !== 200 || !taskRes.data?.task_id) {
        fail("task_create_failed", taskRes.message || "Task creation failed", t("errorGenerate"));
        return;
      }

      if (taskRes.data.quota) {
        setQuota(taskRes.data.quota);
      }

      const result = await pollUntilDone(taskRes.data.task_id);
      setResultUrls(result.urls);
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
      fail("generate_failed", message, t("errorGenerate"));
    }
  }, [previewUrl, sourceImageUrl, analysisType, reportLang, resolution, occasion, reloadHistory, refreshCredits, scrollToResult, t, demoMode, startDemo]);

  const startRecommendedAnalysis = useCallback(async (type: AnalysisType) => {
    // 演示模式：直接切到该类型的示例报告，不开后台任务、不扣积分
    if (demoMode) {
      trackEvent("analysis_type_selected", { type, source: "demo_recommendation" });
      selectType(type);
      return;
    }
    const photoUrl = sourceImageUrl || lastUploadedPhotoUrl;
    if (!photoUrl) return;

    const taskId = `bg_${Date.now()}_${type}`;
    trackEvent("recommended_analysis_started", { type, source: "recommendation" });

    setBackgroundTasks((prev) => [...prev, { id: taskId, type, phase: "generating", resultUrls: [] }]);

    try {
      const signInRes = await webInit();
      if (signInRes.code !== 200 || !signInRes.data) throw new Error(signInRes.message);
      if ((signInRes.data.total_remaining ?? signInRes.data.web_quota.remaining) <= 0) {
        setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: "error", errorMsg: "No credits" } : t));
        openPricing("no_quota_recommended");
        return;
      }

      const taskRes = await createTask(photoUrl, type, reportLang, { resolution });
      if (taskRes.code === 429) {
        setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: "error", errorMsg: "No credits" } : t));
        openPricing("no_quota_recommended");
        return;
      }
      if (taskRes.code !== 200 || !taskRes.data?.task_id) throw new Error(taskRes.message);

      const backendTaskId = taskRes.data.task_id;
      setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, taskId: backendTaskId } : t));

      const result = await pollUntilDone(backendTaskId);
      setBackgroundTasks((prev) => prev.map((t) => t.id === taskId
        ? { ...t, phase: "done", resultUrls: result.urls, locked: result.locked, unlocked: result.unlocked, lockStart: result.lockStart }
        : t));
      trackEvent("recommended_analysis_completed", { type, image_count: result.urls.length, locked: result.locked });
      if (result.locked) trackEvent("locked_report_shown", { type, source: "recommendation" });
      reloadHistory();
      refreshCredits();
    } catch (err) {
      setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: "error", errorMsg: err instanceof Error ? err.message : "Failed" } : t));
    }
  }, [sourceImageUrl, lastUploadedPhotoUrl, reportLang, resolution, reloadHistory, refreshCredits, openPricing, demoMode, selectType]);

  const handleUseLastPhoto = useCallback(async () => {
    if (!lastUploadedPhotoUrl) return;
    trackEvent("last_photo_reused");
    setSourceImageUrl(lastUploadedPhotoUrl);
    setPreviewUrl(lastUploadedPhotoUrl);
    setPhase("idle");
    setResultUrls([]);
    setErrorMsg("");
  }, [lastUploadedPhotoUrl]);

  // 没有合适照片的访客：用示例照片体验。直接展示预先生成好的完整示例报告：不等待、不扣积分、不用解锁
  const handleUseSamplePhoto = useCallback(() => {
    trackEvent("sample_photo_clicked", { type: analysisType });
    startDemo(analysisType);
  }, [analysisType, startDemo]);

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

  const handleCheckin = useCallback(async () => {
    if (!checkinAvailable || checkinLoading) return;
    setCheckinLoading(true);
    try {
      const res = await webCheckin();
      if (res.code === 200 && res.data) {
        const d = res.data;
        if (d.checked_in) {
          setCheckinAvailable(false);
          setCheckinJustDone(true);
          setCheckinStreak(d.checkin_streak ?? 0);
          setCheckinMaxStreak(d.checkin_max_streak ?? 0);
          setStreakBonus(d.streak_bonus ?? 0);
          setTimeout(() => setCheckinJustDone(false), 3000);
          if (d.total_remaining != null) {
            setUserCredits((prev) => prev ? {
              ...prev,
              bonus: d.paid_credits ?? prev.bonus,
              pack: d.pack_credits ?? prev.pack,
              totalRemaining: d.total_remaining!,
            } : prev);
          }
          trackEvent("checkin_completed");
        } else {
          setCheckinAvailable(false);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setCheckinLoading(false);
    }
  }, [checkinAvailable, checkinLoading]);

  const recommendedTypes = (RECOMMENDED_TYPES[analysisType] || []).filter(
    (t) => !backgroundTasks.some((bt) => bt.type === t) && (!demoMode || !!EXAMPLE_IMAGES[t])
  );

  const activeTaskCount = backgroundTasks.filter((t) => t.phase === "generating" || t.phase === "uploading").length;

  // 点开大图 / 改错重生成时用：id 用真实任务 ID，分享、解锁都靠它
  const buildCurrentEntry = (): HistoryEntry => ({
    id: demoMode ? "demo" : resultTaskId ?? "current",
    status: "success",
    type: analysisType,
    image_urls: resultUrls,
    source_image_url: sourceImageUrl ?? undefined,
    created_at: Date.now() / 1000,
    locked: resultLock.locked,
    unlocked: resultLock.unlocked,
    lock_start: resultLock.lockStart,
  });

  // 免费预览只能 1K；有积分包积分（或订阅）才能选 2K / 4K，积分用完后自动退回 1K，避免界面选着 2K 实际出 1K
  const canUseHd = isPaid || (userCredits?.pack ?? 0) > 0;
  const creditsLoaded = userCredits !== null;
  useEffect(() => {
    if (creditsLoaded && !canUseHd && resolution !== "1K") setResolution("1K");
  }, [creditsLoaded, canUseHd, resolution]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* 从 Instagram / TikTok / Pinterest 等 App 内置浏览器进来时，提示用系统浏览器打开（记录与订阅才会保存） */}
      <InAppBrowserNotice className="mx-auto mt-4 max-w-2xl" />

      {/* 已付费（订阅或积分包）但未登录：订阅 / 积分都挂在当前浏览器的匿名账号上，换浏览器/设备就找不回，提示登录保存 */}
      {(isPaid || (userCredits?.pack ?? 0) > 0) && authStatus === "unauthenticated" && !saveSubDismissed && (
        <div className="relative mx-auto mt-4 flex max-w-2xl items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3 pr-10">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-green-900">{isPaid ? t("saveSubscriptionTitle") : t("saveCreditsTitle")}</p>
            <p className="mt-0.5 text-xs text-green-800">{isPaid ? t("saveSubscriptionDesc") : t("saveCreditsDesc")}</p>
          </div>
          <button
            type="button"
            onClick={() => signIn.start(isPaid ? "subscription_save" : "credits_save")}
            className="min-h-10 shrink-0 rounded-full bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            {t("saveSubscriptionCta")}
          </button>
          <button
            type="button"
            onClick={() => setSaveSubDismissed(true)}
            aria-label={t("close")}
            className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full text-green-800/70 hover:bg-green-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      <InAppSignInSheet open={signIn.blockedOpen} onClose={signIn.closeBlocked} />

      {/* Analysis Type Selector — Category Tabs + Type Grid */}
      <div className="mt-8">
        {!typesExpanded ? (
          /* 折叠态：只显示当前类型 + 展开入口，首屏焦点留给上传 */
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary/30">
              <span className="shrink-0">{FLAT_ANALYSIS_TYPES.find((i) => i.value === analysisType)?.icon}</span>
              {t(`type_${analysisType}`)}
            </span>
            <button
              type="button"
              onClick={() => { setTypesExpanded(true); trackEvent("analysis_types_expanded"); }}
              aria-expanded={false}
              className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40"
            >
              {t("moreTypes")}
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2 4l4 4 4-4" /></svg>
            </button>
          </div>
        ) : (
        <>
        {/* Category Tabs */}
        <div className="-mx-4 flex overflow-x-auto overscroll-x-contain border-b border-border px-4 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:px-0 [&::-webkit-scrollbar]:hidden">
          {ANALYSIS_TYPE_GROUPS.map((group) => (
            <button
              key={group.category}
              onClick={() => {
                const firstItem = group.items[0];
                if (firstItem && !group.items.some((i) => i.value === analysisType)) {
                  selectType(firstItem.value);
                  trackEvent("analysis_type_selected", { type: firstItem.value, source: "category_tab" });
                }
              }}
              className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
                group.items.some((i) => i.value === analysisType)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`category_${group.category}`)}
              {group.items.some((i) => i.value === analysisType) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Type Options within active category */}
        {ANALYSIS_TYPE_GROUPS.filter((g) =>
          g.items.some((i) => i.value === analysisType)
        ).map((group) => (
          <div key={group.category} className="mt-4 flex flex-wrap justify-center gap-2">
            {group.items.map((at) => (
              <button
                key={at.value}
                onClick={() => { selectType(at.value); trackEvent("analysis_type_selected", { type: at.value, source: "type_pill" }); }}
                className={`flex min-h-10 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                  analysisType === at.value
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "border border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <span className="shrink-0">{at.icon}</span>
                {t(`type_${at.value}`)}
                {at.creditCost && at.creditCost > 1 && (
                  <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {at.creditCost}x
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
        </>
        )}

        {/* Type Info Panel: Photo Requirement + Output */}
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("photoReq")}</p>
                <p className="mt-0.5 text-sm">{t(`req_${analysisType}`)}</p>
              </div>
            </div>
            {/* 手机上默认只展示拍摄要求，输出说明折叠，让上传区更靠前 */}
            <div className={`${showTypeInfo ? "flex" : "hidden"} items-start gap-2.5 sm:flex`}>
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("output")}</p>
                <p className="mt-0.5 text-sm">{t(`out_${analysisType}`)}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTypeInfo((v) => !v)}
            aria-expanded={showTypeInfo}
            className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-medium text-primary sm:hidden"
          >
            {t("output")}
            <svg className={`h-3 w-3 transition ${showTypeInfo ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4" /></svg>
          </button>
        </div>
      </div>

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

      {/* Example / Result + Upload — Left/Right Layout */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Before/After comparison — always same structure */}
        {(() => {
          const isActive = phase === "preparing" || phase === "uploading" || phase === "generating" || phase === "done" || phase === "error";
          const hasExample = !!EXAMPLE_IMAGES[analysisType];
          const leftLabel = isActive
            ? t(`type_${analysisType}`)
            : hasExample ? t("exampleBefore") : "";
          const rightLabel = isActive
            ? (phase === "done" ? t("resultTitle") : phase === "error" ? t("error") : t("generating"))
            : hasExample ? t("exampleAfter") : "";
          const leftImage = isActive && previewUrl
            ? previewUrl
            : hasExample ? "/images/examples/before.webp" : null;

          return (
            <div ref={resultSectionRef} className="flex scroll-mt-20 flex-col max-lg:order-2">
              <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
                {isActive
                  ? (phase === "done" ? t("resultTitle") : t(`type_${analysisType}`))
                  : hasExample ? t("exampleTitle") : t(`type_${analysisType}`)}
              </p>
              {/* 手机上出结果后，报告图独占整行（原来被挤在约 165px 的半宽栏里，文字根本看不清）；原照片列在小屏隐藏 */}
              <div className={`grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4 ${phase === "done" && resultUrls.length > 0 ? "max-sm:grid-cols-1" : ""}`}>
                {/* Left column — photo */}
                <div className={`space-y-1.5 ${phase === "done" && resultUrls.length > 0 ? "max-sm:hidden" : ""}`}>
                  <span className="block text-center text-xs font-medium text-muted-foreground">{leftLabel}</span>
                  <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
                    {leftImage ? (
                      <img
                        src={leftImage}
                        alt={leftLabel}
                        className="h-auto w-full object-cover"
                        style={{ aspectRatio: "3/4" }}
                      />
                    ) : (
                      <div className="flex items-center justify-center bg-muted/30" style={{ aspectRatio: "3/4" }}>
                        <svg className="h-10 w-10 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column — report / progress / error / example */}
                <div className="space-y-1.5">
                  <span className="block text-center text-xs font-medium text-muted-foreground">{rightLabel}</span>

                  {(phase === "preparing" || phase === "uploading" || phase === "generating") ? (
                    /* Generating progress */
                    <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-primary/5 to-violet-50/50 dark:from-primary/10 dark:to-violet-950/20" style={{ aspectRatio: "3/4" }}>
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
                      <p className="px-3 text-center text-xs font-medium text-foreground">
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
                      {phase === "generating" && generateElapsed > 60 && (
                        <p className="mt-2 px-3 text-center text-xs text-muted-foreground">{t("almostDone")}</p>
                      )}
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
                  ) : phase === "done" && resultUrls.length > 0 ? (
                    /* Result report image */
                    <div
                      className="group cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-background transition hover:border-primary/40 hover:shadow-md"
                      onClick={() => {
                        trackEvent("result_viewed_full", { type: analysisType, locked: resultLock.locked });
                        setLightbox({ entry: buildCurrentEntry(), imageIndex: 0 });
                      }}
                    >
                      <div className="relative">
                        <img
                          src={resultUrls[0]}
                          alt={`${t(`type_${analysisType}`)} — ${t("exampleAfter")}`}
                          className="h-auto w-full bg-muted/30 object-contain"
                          style={{ aspectRatio: "3/4" }}
                        />
                        {demoMode && (
                          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                            {t("demoBadge")}
                          </span>
                        )}
                        {resultLock.locked ? (
                          /* 服务端已把细节打码：覆盖层只负责引导解锁，点图片其它位置仍可放大查看免费预览 */
                          <LockOverlay
                            lockStart={resultLock.lockStart}
                            cost={creditCostOf(analysisType)}
                            packCredits={userCredits?.pack ?? 0}
                            busy={unlockingId === resultTaskId}
                            onUnlock={() => handleUnlock(resultTaskId, analysisType, resultUrls[0])}
                            t={t}
                          />
                        ) : (
                          /* 触屏没有 hover：提示常显；只有支持 hover 的设备才改成悬停显示 */
                          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-100 transition [@media(hover:hover)]:from-black/50 [@media(hover:hover)]:opacity-0 group-hover:opacity-100">
                            <div className="mb-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                              {t("viewFull")}
                            </div>
                          </div>
                        )}
                        {/* Page count badge */}
                        {resultUrls.length > 1 && (
                          <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                            1/{resultUrls.length}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : phase === "error" ? (
                    /* Error state */
                    <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-red-200/60 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10" style={{ aspectRatio: "3/4" }}>
                      <svg className="mb-3 h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      <p className="px-3 text-center text-xs font-medium text-red-600 dark:text-red-400">{errorMsg}</p>
                      {previewUrl && (
                        <button
                          onClick={() => {
                            trackEvent("generate_retry_clicked", { type: analysisType });
                            handleGenerate();
                          }}
                          className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark"
                        >
                          {t("retryBtn")}
                        </button>
                      )}
                    </div>
                  ) : hasExample ? (
                    /* Idle — example report */
                    <div
                      className="cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-background transition hover:shadow-md"
                      onClick={() => {
                        trackEvent("example_viewed", { type: analysisType });
                        setExamplePreview(EXAMPLE_IMAGES[analysisType]!);
                      }}
                    >
                      <img
                        src={EXAMPLE_IMAGES[analysisType]!}
                        alt={`${t(`type_${analysisType}`)} — ${t("exampleAfter")}`}
                        className="h-auto w-full object-cover"
                        style={{ aspectRatio: "3/4" }}
                      />
                    </div>
                  ) : (
                    /* Idle — no example */
                    <div className="flex items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-muted/30" style={{ aspectRatio: "3/4" }}>
                      <svg className="h-10 w-10 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom actions / hints */}
              {phase === "done" && resultUrls.length > 0 && demoMode ? (
                /* 示例报告：说明这是现成的演示，引导换成自己的照片；不提供下载 / 分享 / 反馈（不是真实生成的结果） */
                <p className="mt-2 text-center text-xs text-muted-foreground">{t("demoNotice")}</p>
              ) : phase === "done" && resultUrls.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {/* 报告还没解锁（打码预览；预览补生成失败时的带水印兜底图也算）：给出解锁入口；积分包够用时直接用积分解锁 */}
                  {!resultLock.unlocked && (
                    <button
                      onClick={() => handleUnlock(resultTaskId, analysisType, resultUrls[0])}
                      disabled={unlockingId !== null && unlockingId === resultTaskId}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark disabled:opacity-60"
                    >
                      <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                      {(userCredits?.pack ?? 0) >= creditCostOf(analysisType)
                        ? t("unlockWithCredits", { count: creditCostOf(analysisType) })
                        : t("watermarkBanner")}
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
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground transition hover:border-primary/40 sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-0 sm:font-normal sm:text-muted-foreground sm:hover:text-foreground"
                    >
                      <DownloadIcon />
                      {resultLock.unlocked ? t("download") : t("upgradeToDownload")}
                    </button>
                    <button
                      onClick={() => handleShare(resultUrls[0])}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-4 text-xs font-semibold text-primary transition hover:bg-primary/10 sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-0 sm:font-normal sm:text-muted-foreground sm:hover:text-foreground"
                    >
                      <ShareIcon />
                      {t("share")}
                    </button>
                    <button
                      onClick={() => handleCorrectionOpen(buildCurrentEntry())}
                      disabled={!sourceImageUrl}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground transition hover:border-primary/40 disabled:opacity-50 sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-0 sm:font-normal sm:text-muted-foreground sm:hover:text-foreground"
                    >
                      <CorrectionIcon />
                      {t("correction")}
                    </button>
                  </div>
                  <ResultFeedback key={resultTaskId ?? "current"} taskId={resultTaskId} type={analysisType} />
                </div>
              ) : (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {phase === "error" ? "" : hasExample || isActive ? t("exampleCta") : ""}
                </p>
              )}
            </div>
          );
        })()}


        {/* Right: Settings + Upload + Generate（手机上排在示例/结果之前，让上传入口更靠前） */}
        <div className="flex flex-col gap-5 max-lg:order-1">
          {/* Settings: Resolution + Report Language */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Resolution */}
            <div className="flex items-center rounded-full border border-border bg-card p-0.5">
              {(["1K", "2K", "4K"] as Resolution[]).map((r) => {
                const needsPro = r !== "1K" && !canUseHd;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      if (needsPro) {
                        trackEvent("resolution_upgrade_clicked", { resolution: r });
                        openPricing(`resolution_${r}`);
                      } else {
                        setResolution(r); savePrefs(r, reportLang); trackEvent("resolution_changed", { resolution: r });
                      }
                    }}
                    className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                      resolution === r
                        ? "bg-primary text-white shadow-sm"
                        : needsPro
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r}{needsPro && <span className="ml-0.5 text-[9px] opacity-70">{t("hdPaidTag")}</span>}
                  </button>
                );
              })}
            </div>

            {/* Report Language */}
            <div className="relative">
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40"
              >
                <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                {REPORT_LANGUAGES.find((l) => l.code === reportLang)?.label || reportLang}
                <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4" /></svg>
              </button>
              {showLangPicker && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowLangPicker(false)} />
                  <div className="absolute left-1/2 top-full z-40 mt-1 -translate-x-1/2 max-h-64 w-44 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl">
                    {REPORT_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setReportLang(lang.code); savePrefs(resolution, lang.code); setShowLangPicker(false); trackEvent("report_language_changed", { language: lang.code }); }}
                        className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition hover:bg-muted ${
                          reportLang === lang.code ? "bg-primary/10 font-medium text-primary" : ""
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upload Area — fixed height */}
          <div>
            <div
              onClick={handleUploadClick}
              className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${
                previewUrl
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              }`}
              style={{ height: 280 }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={t("exampleBefore")}
                  className="h-full w-full rounded-2xl object-contain"
                />
              ) : (
                <>
                  <svg
                    className="mb-3 h-10 w-10 text-muted-foreground/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <p className="text-center text-sm font-medium text-foreground">
                    {t("uploadTitle")}
                  </p>
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    {t("uploadHint")}
                  </p>
                  {EXAMPLE_IMAGES[analysisType] && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleUseSamplePhoto(); }}
                      className="mt-3 min-h-9 px-3 text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {t("useSamplePhoto")}
                    </button>
                  )}
                  {lastUploadedPhotoUrl && !previewUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUseLastPhoto(); }}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      {t("useLastPhoto")}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* 隐私说明放在上传框外面、常驻显示：用户决定传不传脸部照片之前就能看到，并能点进隐私政策 */}
            <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              <span>
                {t("uploadTrust")}{" "}
                <Link href="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
                  {t("privacyLink")}
                </Link>
              </span>
            </p>
            {!previewUrl && (
              <p className="mt-1 text-center text-[11px] text-muted-foreground/80">{t("uploadConsent")}</p>
            )}

            {/* image/*：手机相册里的 HEIC / 截图等也能选（Safari 会自动转成 JPEG，上传前还会统一压缩）。
                两个 input 放在虚线框外面：程序化 click 会冒泡到虚线框的 onClick，导致同时弹出两个选择器 */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {/* 前置摄像头直接拍自拍；桌面浏览器会忽略 capture，等同普通选择文件 */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* 手机上的两个明确入口：拍自拍 / 从相册选；桌面端直接点上面的虚线框 */}
            {!previewUrl && (
              <div className="mt-3 grid grid-cols-2 gap-3 lg:hidden">
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

            {previewUrl && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => {
                    if (demoMode) {
                      exitDemo();
                      return;
                    }
                    setPreviewUrl(null);
                    setSourceImageUrl(null);
                    setResultUrls([]);
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

          {/* Generate Button：手机上选好照片后吸在视口底部，不用再往下找按钮 */}
          <div
            className={`text-center ${
              previewUrl
                ? "max-lg:sticky max-lg:bottom-0 max-lg:z-30 max-lg:-mx-4 max-lg:border-t max-lg:border-border/60 max-lg:bg-background/95 max-lg:px-4 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:pt-3 max-lg:backdrop-blur-md"
                : ""
            }`}
          >
            <button
              onClick={() => {
                // 看完示例报告后，主按钮变成「用我自己的照片试试」
                if (demoMode && phase === "done") {
                  handleUseOwnPhoto();
                  return;
                }
                handleGenerate();
              }}
              disabled={
                !previewUrl ||
                phase === "uploading" ||
                phase === "generating" ||
                phase === "preparing"
              }
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(phase === "uploading" ||
                phase === "generating" ||
                phase === "preparing") && <Spinner />}
              {(phase === "preparing" || phase === "uploading" || phase === "generating")
                ? t("generating")
                : demoMode && phase === "done"
                  ? t("demoUseMyPhoto")
                  : t("generate")}
            </button>
          </div>

          <div className="-mt-2 text-center lg:-mt-3">
            {userCredits && phase !== "done" && (
              userCredits.subPlan && isPaid ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary uppercase">Pro</span>
                    {t("quotaInfo", { remaining: userCredits.totalRemaining })}
                  </span>
                </p>
              ) : (
                /* 两种积分分开显示：免费积分只能出打码预览，积分包积分出完整报告 */
                <div className="mt-2">
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-muted-foreground">
                      {t("creditsFree", { count: userCredits.free + userCredits.bonus })}
                    </span>
                    <button
                      type="button"
                      onClick={() => openPricing("credits_chip")}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 font-medium text-primary transition hover:bg-primary/10"
                    >
                      {userCredits.pack > 0
                        ? t("creditsPack", { count: userCredits.pack })
                        : t("creditsGetPack")}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                    {userCredits.pack > 0 ? t("creditsExplainPack") : t("creditsExplainFree")}
                  </p>
                </div>
              )
            )}
            {!userCredits && quota && phase !== "done" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("quotaInfo", { remaining: quota.remaining })}
              </p>
            )}

            <InviteEarnBanner />
          </div>
        </div>
      </div>

      {/* Example Preview Modal */}
      {examplePreview && <ExamplePreviewModal src={examplePreview} onClose={() => setExamplePreview(null)} t={t} />}

      {/* Check-in + Streak Section */}
      {(checkinAvailable || checkinJustDone || checkinStreak > 0) && phase !== "uploading" && phase !== "generating" && phase !== "preparing" && (
        <div className="mt-6 rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          {/* Streak counter */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="font-semibold text-amber-800">
                {t("streakDays", { count: checkinStreak })}
              </span>
            </div>
            {checkinMaxStreak > 0 && (
              <span className="text-xs text-amber-600">
                {t("streakBest", { count: checkinMaxStreak })}
              </span>
            )}
          </div>

          {/* 7-day calendar strip */}
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: 7 }, (_, i) => {
              const dayIndex = i + 1;
              const isCompleted = dayIndex <= (checkinStreak % 7 || (checkinStreak > 0 && checkinStreak % 7 === 0 ? 7 : 0));
              return (
                <div key={i} className={`flex-1 h-2 rounded-full ${isCompleted ? "bg-amber-400" : "bg-amber-200/50"}`} />
              );
            })}
          </div>

          {/* Milestone indicators */}
          <div className="flex justify-between text-xs text-amber-600 mb-3">
            <span>{checkinStreak >= 7 ? "✅" : `${Math.min(checkinStreak, 7)}/7`} {t("streakBonus7")}</span>
            <span>{checkinStreak >= 30 ? "✅" : `${Math.min(checkinStreak, 30)}/30`} {t("streakBonus30")}</span>
          </div>

          {/* Check-in button */}
          {checkinJustDone ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
              <span>✓</span>
              <span>{t("checkinDone")}</span>
              {streakBonus > 0 && <span className="ml-1 font-bold">+{streakBonus} bonus!</span>}
            </div>
          ) : checkinAvailable ? (
            <button
              onClick={handleCheckin}
              disabled={checkinLoading}
              className="w-full rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              {checkinLoading ? "..." : t("checkinBtn")}
            </button>
          ) : null}
        </div>
      )}

      {/* Show NoQuotaCard when credits are exhausted (regardless of phase) */}
      {(phase === "no_quota" || (phase !== "done" && phase !== "generating" && phase !== "uploading" && phase !== "preparing" && ((userCredits && userCredits.totalRemaining <= 0) || (!userCredits && quota && quota.remaining <= 0)))) && (
        <div ref={noQuotaRef} className="mt-4 scroll-mt-20">
          <NoQuotaCard
            t={t}
            onViewPlans={() => openPricing("no_quota_generate")}
            checkinAvailable={checkinAvailable}
            checkinLoading={checkinLoading}
            onCheckin={handleCheckin}
          />
        </div>
      )}

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
                {task.phase === "done" && task.resultUrls[0] && (
                  <button
                    onClick={() => setLightbox({
                      entry: {
                        id: task.taskId ?? task.id,
                        status: "success",
                        type: task.type,
                        image_urls: task.resultUrls,
                        source_image_url: sourceImageUrl ?? lastUploadedPhotoUrl ?? undefined,
                        created_at: Date.now() / 1000,
                        locked: task.locked,
                        unlocked: task.unlocked,
                        lock_start: task.lockStart,
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

      {/* Post-result: Invite + Recommendations */}
      {phase === "done" && resultUrls.length > 0 && (
        <div className="mt-8">
          {/* AI 生成内容标注 */}
          <p className="mb-4 text-center text-xs text-muted-foreground">{t("aiGeneratedNote")}</p>
          {!demoMode && (
            <div className="mb-6">
              <InviteEarnBanner variant="card" referralCode={referralCode} />
            </div>
          )}

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
          {!demoMode && (userCredits ? userCredits.totalRemaining <= 0 : !!quota && quota.remaining <= 0) && (
            <div className="mt-6">
              <NoQuotaCard
                t={t}
                onViewPlans={() => openPricing("no_quota_result")}
                checkinAvailable={checkinAvailable}
                checkinLoading={checkinLoading}
                onCheckin={handleCheckin}
              />
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="mt-12 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold">{t("tipsTitle")}</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            {t("tip1")}
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            {t("tip2")}
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            {t("tip3")}
          </li>
        </ul>
      </div>

      {/* History */}
      <div id="history">
        {historyLoading && (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <Spinner /> {t("historyTitle")}
          </div>
        )}
        {!historyLoading && history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold">{t("historyTitle")}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
                  onClick={() => { trackEvent("history_item_opened", { type: entry.type || "unknown" }); setLightbox({ entry, imageIndex: 0 }); }}
                >
                  {entry.image_urls[0] && (
                    <div className="relative">
                      <img
                        src={entry.image_urls[0]}
                        alt={t(`type_${entry.type || "color_analysis"}`)}
                        className="aspect-[3/4] w-full object-cover"
                      />
                      {entry.locked && (
                        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                          <LockIcon className="h-3 w-3" />
                          {t("lockedBadge")}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {ALL_VALID_TYPES.includes(entry.type as AnalysisType) ? t(`type_${entry.type}`) : entry.type}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(entry.created_at * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    {entry.image_urls.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        +{entry.image_urls.length - 1}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          entry={lightbox.entry}
          initialIndex={lightbox.imageIndex}
          onClose={() => setLightbox(null)}
          onCorrection={handleCorrectionOpen}
          onDownload={handleDownload}
          onShare={handleShare}
          packCredits={userCredits?.pack ?? 0}
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
          locale={locale}
          onClose={() => setShareModal(null)}
          onCopied={() => { setShareToast(true); setTimeout(() => setShareToast(false), 2000); }}
          t={t}
          referralCode={referralCode}
        />
      )}

      {/* 邀请奖励到账提示 */}
      {referralBonus !== null && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-[250] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          🎁 {t("referralBonusToast", { count: referralBonus })}
        </div>
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
        unlockTaskId={pricingTaskId}
        packCredits={userCredits?.pack ?? 0}
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
                  ? t(checkoutBought === "pack_unlocked" ? "checkoutSuccessPackUnlocked" : checkoutBought === "pack" ? "checkoutSuccessPack" : "checkoutSuccess")
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

      {/* First-time invite popup */}
      {showInvitePopup && (
        <InvitePopup
          referralCode={referralCode}
          copied={invitePopupCopied}
          onCopy={async () => {
            const refUrl = buildReferralUrl(SITE_URL, referralCode);
            trackEvent("invite_earn_click", { source: "result_popup" });
            // 手机上直接调起系统分享面板；不支持或失败时复制链接
            if (canUseNativeShare()) {
              const status = await nativeShare({ title: t("shareTitle"), text: t("shareText"), url: tagShareLink(refUrl, "native") });
              if (status !== "failed") return;
            }
            const ok = await copyText(refUrl);
            if (!ok) return;
            setInvitePopupCopied(true);
            setTimeout(() => setInvitePopupCopied(false), 2000);
          }}
          onDismiss={() => {
            try { localStorage.setItem("belle_invite_popup_shown", "true"); } catch { /* 隐私模式不可写，忽略 */ }
            setShowInvitePopup(false);
          }}
          t={t}
        />
      )}
    </div>
  );
}

/** 结果下方的真实反馈入口：1–5 星 + 可选一句话。评分进 GA；点「发送」才把评分和留言发给团队（不含照片）。 */
function ResultFeedback({ taskId, type }: { taskId: string | null; type: string }) {
  const t = useTranslations("tryPage");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (text: string) => {
    trackFeedbackSubmitted({ type, rating, comment: text.trim() || undefined, taskId });
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

function InviteEarnBanner({ variant = "compact", referralCode }: { variant?: "compact" | "card"; referralCode?: string | null }) {
  const t = useTranslations("tryPage");
  const locale = useLocale();
  const [linkCopied, setLinkCopied] = useState(false);
  // 服务端恒为 false、客户端挂载后才读真实能力：不会触发 hydration 不一致
  const nativeReady = useSyncExternalStore(
    () => () => {},
    canUseNativeShare,
    () => false
  );

  if (variant === "compact") {
    return (
      <Link
        href="/referral"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
        onClick={() => trackEvent("invite_earn_click", { source: "quota_area" })}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
        {t("inviteEarn")}
      </Link>
    );
  }

  const refUrl = referralCode ? buildReferralUrl(SITE_URL, referralCode) : null;
  const shareText = t("shareText");
  const shareTags = "BelleAI,ColorAnalysis,Beauty";

  const handleCopyLink = async () => {
    if (!refUrl) return;
    trackEvent("invite_earn_click", { source: "result_card" });
    const ok = await copyText(refUrl);
    if (!ok) {
      trackEvent("share_link_copy_failed", { source: "result_card" });
      return;
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleNativeInvite = async () => {
    if (!refUrl) return;
    trackEvent("invite_earn_click", { source: "result_card" });
    trackEvent("share_platform_click", { platform: "native" });
    const status = await nativeShare({ title: t("shareTitle"), text: shareText, url: tagShareLink(refUrl, "native") });
    if (status === "failed") handleCopyLink();
  };

  const handlePlatformShare = (platform: SharePlatform) => {
    if (!refUrl) return;
    trackEvent("invite_earn_click", { source: "result_card" });
    trackEvent("share_platform_click", { platform: platform.id });
    const taggedUrl = tagShareLink(refUrl, platform.id);
    const shareUrl = platform.id === "pinterest"
      ? (platform.buildUrl as (u: string, txt: string, tg: string, m?: string) => string)(taggedUrl, shareText, shareTags)
      : platform.buildUrl(taggedUrl, shareText, shareTags);
    openShareWindow(shareUrl);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-violet-50/80 to-purple-50/60 p-5 shadow-sm dark:from-primary/15 dark:via-violet-950/30 dark:to-purple-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-base font-bold text-foreground">{t("inviteCardTitle")}</h3>
          <p className="mt-1 text-sm font-medium text-primary">{t("inviteEarn")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("inviteCardDesc")}</p>
        </div>
      </div>

      {refUrl ? (
        <div className="mt-4 space-y-3">
          {/* 手机上主推系统分享面板：覆盖所有已安装的 App（含内置浏览器里 window.open 打不开的平台） */}
          {nativeReady && (
            <button
              onClick={handleNativeInvite}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition active:scale-[0.98]"
            >
              <ShareIcon />
              {t("share")}
            </button>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-background/70 px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{refUrl}</p>
            <button
              onClick={handleCopyLink}
              className="min-h-10 shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90"
            >
              {linkCopied ? t("linkCopied") : t("copyLink")}
            </button>
          </div>
          {!nativeReady && (
            <div className="grid grid-cols-4 gap-2">
              {getSharePlatforms(locale).map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformShare(platform)}
                  className="flex flex-col items-center gap-1 rounded-xl p-2 transition hover:bg-primary/5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 shadow-sm">
                    {platform.icon}
                  </div>
                  <span className="text-xs text-muted-foreground">{platform.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/referral"
          onClick={() => trackEvent("invite_earn_click", { source: "result_card" })}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          {t("inviteEarn")}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
      )}
    </div>
  );
}

function ExamplePreviewModal({ src, onClose, t }: { src: string; onClose: () => void; t: (key: string) => string }) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("exampleTitle")}
      tabIndex={-1}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 outline-none backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-h-[90dvh] max-w-lg overflow-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={t("exampleAfter")} className="h-auto w-full rounded-2xl" />
      </div>
    </div>
  );
}

function InvitePopup({
  referralCode,
  copied,
  onCopy,
  onDismiss,
  t,
}: {
  referralCode: string | null;
  copied: boolean;
  onCopy: () => void;
  onDismiss: () => void;
  t: (key: string) => string;
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onDismiss);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("invitePopupTitle")} tabIndex={-1} className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4 outline-none backdrop-blur-sm" onClick={onDismiss}>
      <div
        className="w-full max-w-sm rounded-2xl border border-primary/20 bg-card p-6 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-violet-200/60 text-2xl">
            🎉
          </div>
          <h3 className="font-serif text-xl font-bold">{t("invitePopupTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("invitePopupDesc")}</p>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          {referralCode ? (
            <button
              onClick={onCopy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {copied ? t("linkCopied") : t("invitePopupCta")}
            </button>
          ) : (
            <Link
              href="/referral"
              onClick={() => trackEvent("invite_earn_click", { source: "result_popup" })}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("invitePopupCta")}
            </Link>
          )}
          <button
            onClick={onDismiss}
            className="w-full rounded-full py-2.5 text-sm text-muted-foreground transition hover:bg-muted"
          >
            {t("invitePopupDismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 额度用完时的「三选一」：付费升级（主推）/ 邀请好友 +3 / 每日签到 +1。
 * 之前只有一个付费按钮加一个小号邀请链接，用户到这里只有「付费」或「离开」两条路。
 */
function NoQuotaCard({
  t,
  onViewPlans,
  checkinAvailable,
  checkinLoading,
  onCheckin,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
  onViewPlans: () => void;
  checkinAvailable: boolean;
  checkinLoading: boolean;
  onCheckin: () => void;
}) {
  useEffect(() => {
    trackEvent("quota_wall_shown", { checkin_available: checkinAvailable });
    // 只在卡片出现时上报一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
      <p className="text-lg font-semibold text-amber-900">{t("noQuotaTitle")}</p>
      <p className="mt-1 text-sm text-amber-700">{t("noQuotaDesc")}</p>
      <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2.5">
        <button
          onClick={() => {
            trackEvent("quota_wall_option_click", { option: "pay" });
            onViewPlans();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
        >
          {t("noQuotaPackCta", { credits: PACK_CREDITS, price: PACK_PRICE })}
        </button>
        <Link
          href="/referral"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-white/70 px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-white"
          onClick={() => {
            trackEvent("quota_wall_option_click", { option: "invite" });
            trackEvent("invite_earn_click", { source: "no_quota_card" });
          }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
          {t("inviteEarnFree")}
        </Link>
        {checkinAvailable && (
          <button
            onClick={() => {
              trackEvent("quota_wall_option_click", { option: "checkin" });
              onCheckin();
            }}
            disabled={checkinLoading}
            className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white/70 px-6 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-white disabled:opacity-60"
          >
            {checkinLoading ? "..." : t("checkinBtn")}
          </button>
        )}
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
                lockStart={entry.lock_start ?? DEFAULT_LOCK_START}
                cost={unlockCost}
                packCredits={packCredits}
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
            {packCredits >= unlockCost ? t("unlockWithCredits", { count: unlockCost }) : t("watermarkBanner")}
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
          <button
            onClick={() => onShare(currentUrl, entry.id)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/20"
          >
            <ShareIcon />
            {t("share")}
          </button>
          {entry.source_image_url && (
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
 * 锁定报告上的「解锁」覆盖层：图片下半部分已经由服务端打码（原图根本没下发），
 * 这里只是把引导文案和按钮摆在打码区域里，top 按服务端给出的 lock_start 比例定位。
 */
function LockOverlay({
  lockStart,
  cost,
  packCredits,
  busy,
  onUnlock,
  rounded,
  t,
}: {
  lockStart: number;
  cost: number;
  packCredits: number;
  busy: boolean;
  onUnlock: () => void;
  rounded?: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const canSpend = packCredits >= cost;
  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-2 px-4 text-center ${rounded ? "rounded-b-xl" : ""}`}
      style={{ top: `${Math.round(lockStart * 100)}%` }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow">
        <LockIcon className="h-4 w-4" />
      </span>
      <p className="max-w-[16rem] text-xs font-semibold leading-snug text-neutral-800">{t("lockedHint")}</p>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onUnlock(); }}
        disabled={busy}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
      >
        {busy ? <Spinner className="h-3.5 w-3.5" /> : null}
        {canSpend ? t("unlockWithCredits", { count: cost }) : t("unlockReport")}
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
    id: "line",
    name: "LINE",
    icon: <span className="text-xs font-bold text-green-500">LINE</span>,
    buildUrl: (url: string, text: string) => `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "vk",
    name: "VK",
    icon: <span className="text-xs font-bold text-blue-600">VK</span>,
    buildUrl: (url: string, text: string) => `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: "weibo",
    name: "Weibo",
    icon: <span className="text-xs font-bold text-red-500">微博</span>,
    buildUrl: (url: string, text: string) => `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
] as const;

type SharePlatform = typeof SHARE_PLATFORMS[number];

// 按语种挑选当地人真正在用的 4 个分享渠道（每行 4 列）
// 韩国（KakaoTalk）、中国大陆（微信）没有可用的网页分享链接，手机端靠系统分享面板，这里用 X / 微博 补位
const PLATFORM_IDS_BY_LOCALE: Record<string, string[]> = {
  en: ["x", "facebook", "whatsapp", "pinterest"],
  zh: ["weibo", "x", "telegram", "whatsapp"],
  ja: ["line", "x", "facebook", "pinterest"],
  ko: ["x", "facebook", "telegram", "pinterest"],
  es: ["whatsapp", "facebook", "x", "pinterest"],
  fr: ["whatsapp", "facebook", "x", "pinterest"],
  de: ["whatsapp", "telegram", "facebook", "x"],
  ru: ["vk", "telegram", "whatsapp", "x"],
  tr: ["whatsapp", "x", "telegram", "facebook"],
};

function getSharePlatforms(locale: string): SharePlatform[] {
  const ids = PLATFORM_IDS_BY_LOCALE[locale] ?? PLATFORM_IDS_BY_LOCALE.en;
  return ids
    .map((id) => SHARE_PLATFORMS.find((p) => p.id === id))
    .filter((p): p is SharePlatform => Boolean(p));
}

function SharePanel({
  url,
  shareLink,
  locale,
  onClose,
  onCopied,
  t,
  referralCode,
}: {
  url: string;
  shareLink: string;
  locale: string;
  onClose: () => void;
  onCopied: () => void;
  t: (key: string) => string;
  referralCode: string | null;
}) {
  const tReferral = useTranslations("referral");
  const [caption, setCaption] = useState(t("shareText"));
  const [tags, setTags] = useState("BelleAI,ColorAnalysis,Beauty");
  const platforms = getSharePlatforms(locale);

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
      ? (platform.buildUrl as (u: string, t: string, tg: string, m?: string) => string)(link, caption, tags, url)
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
          <img src={url} alt="" className="h-16 w-12 rounded-lg object-cover" />
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
        <p className="mt-3 text-center text-xs text-muted-foreground">{t("shareLinkNotice")}</p>

        {referralCode && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">{tReferral("subtitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tReferral("codeLabel")}: <span className="font-mono font-semibold text-primary">{referralCode}</span>
            </p>
            <Link
              href="/referral"
              onClick={() => trackEvent("share_invite_friends_click")}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              {tReferral("title")}
            </Link>
          </div>
        )}

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
