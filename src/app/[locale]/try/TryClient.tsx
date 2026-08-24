"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { openCheckout } from "@creem_io/embed";
import {
  webInit,
  uploadImage,
  createTask,
  pollUntilDone,
  fetchHistory,
  fetchProcessingTask,
  getCachedUserId,
  type HistoryEntry,
  type AnalysisType as ApiAnalysisType,
} from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { PricingModal } from "@/components/PricingModal";
import { WelcomeOfferSheet } from "@/components/WelcomeOfferSheet";

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

const TYPE_LABELS: Record<AnalysisType, string> = {
  makeup: "Makeup",
  color_analysis: "Color",
  face_shape: "Face & Hair",
  hair_preview: "Hair Preview",
  outfit_color: "Outfit Colors",
  glasses_match: "Glasses",
  occasion_makeup: "Occasion",
  jewelry_guide: "Jewelry",
  glow_up_report: "Glow-Up Report",
  style_personality: "Style DNA",
  palette_scan: "Palette Scan",
  celebrity_match: "Celebrity Match",
};

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

type Resolution = "2K" | "4K";

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
  if (typeof window === "undefined") return { resolution: "2K", reportLang: null };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { resolution: "2K", reportLang: null };
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

interface BackgroundTask {
  id: string;
  type: AnalysisType;
  phase: "uploading" | "generating" | "done" | "error";
  resultUrls: string[];
  errorMsg?: string;
}

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
  const [userCredits, setUserCredits] = useState<{ paid: number; subRemaining: number; subPlan: string | null; totalRemaining: number } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [correctionModal, setCorrectionModal] = useState<HistoryEntry | null>(null);
  const [shareModal, setShareModal] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
  const [lastUploadedPhotoUrl, setLastUploadedPhotoUrl] = useState<string | null>(null);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showWelcomeOffer, setShowWelcomeOffer] = useState(false);
  const [examplePreview, setExamplePreview] = useState<string | null>(null);

  const [resolution, setResolution] = useState<Resolution>("2K");
  const [reportLang, setReportLang] = useState(LOCALE_TO_REPORT_LANG[locale] || "en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [generateElapsed, setGenerateElapsed] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);

  const [isReady, setIsReady] = useState(false);
  const resumedRef = useRef(false);

  useEffect(() => {
    setLastUploadedPhotoUrl(loadLastPhotoUrl());
    const prefs = loadPrefs();
    if (prefs.reportLang) setReportLang(prefs.reportLang);
    if (prefs.resolution) setResolution(prefs.resolution);
  }, []);

  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;

    webInit().then((initRes) => {
      if (initRes.code === 200 && initRes.data) {
        const data = initRes.data;
        setQuota(data.web_quota);
        setUserCredits({
          paid: data.paid_credits ?? 0,
          subRemaining: data.subscription?.remaining ?? 0,
          subPlan: data.subscription?.plan ?? null,
          totalRemaining: data.total_remaining ?? data.web_quota.remaining,
        });
        setIsReady(true);

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
                .then((images) => {
                  setResultUrls(images);
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
    if (!isReady) return;
    try {
      if (localStorage.getItem("belle_welcome_offer_seen")) return;
    } catch { return; }
    const timer = setTimeout(() => setShowWelcomeOffer(true), 1500);
    return () => clearTimeout(timer);
  }, [isReady]);

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
    setAnalysisType(type);

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

      const images = await pollUntilDone(taskRes.data.task_id);
      setResultUrls(images);
      setPhase("done");
      reloadHistory();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Correction failed");
      setPhase("error");
    }
  }, [reportLang, resolution, reloadHistory]);

  const handleDownload = useCallback(async (url: string) => {
    trackEvent("result_download", { type: analysisType });
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `belle-ai-report-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch { /* fallback: open in new tab */ window.open(url, "_blank"); }
  }, [analysisType]);

  const handleShare = useCallback(async (url: string) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
    const shareData = { title: t("shareTitle"), text: t("shareText"), url };
    if (isMobile && navigator.share && navigator.canShare?.(shareData)) {
      trackEvent("result_share", { method: "native", type: analysisType });
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      trackEvent("result_share", { method: "panel", type: analysisType });
      setShareModal(url);
    }
  }, [t, analysisType]);

  const handleUploadClick = useCallback(() => {
    trackEvent("upload_area_clicked");
    fileRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        trackEvent("photo_rejected", { reason: "file_too_large", size_mb: Math.round(file.size / 1024 / 1024) });
        setErrorMsg(t("fileTooLarge"));
        setPhase("error");
        return;
      }
      trackEvent("photo_selected", { size_kb: Math.round(file.size / 1024), type: file.type });
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPhase("idle");
      setResultUrls([]);
      setErrorMsg("");
    },
    [t]
  );

  const handleGenerate = useCallback(async () => {
    if (!previewUrl) return;

    const generateStart = Date.now();
    setPhase("preparing");
    setErrorMsg("");
    setGenerateElapsed(0);
    trackEvent("generate_started", { type: analysisType, resolution, language: reportLang });

    try {
      const signInRes = await webInit();
      if (signInRes.code !== 200 || !signInRes.data) {
        throw new Error(signInRes.message);
      }
      const data = signInRes.data;
      const webQuota = data.web_quota;
      setQuota(webQuota);
      setUserCredits({
        paid: data.paid_credits ?? 0,
        subRemaining: data.subscription?.remaining ?? 0,
        subPlan: data.subscription?.plan ?? null,
        totalRemaining: data.total_remaining ?? webQuota.remaining,
      });

      if ((data.total_remaining ?? webQuota.remaining) <= 0) {
        trackEvent("quota_exhausted", { type: analysisType });
        setPhase("no_quota");
        return;
      }

      let imageUrl = sourceImageUrl;

      if (!imageUrl) {
        setPhase("uploading");
        const file = fileRef.current?.files?.[0];
        if (!file) throw new Error("No file selected");

        const base64 = await fileToBase64(file);
        const uploadRes = await uploadImage(base64);
        if (uploadRes.code !== 200 || !uploadRes.data?.url) {
          throw new Error(uploadRes.message);
        }
        imageUrl = uploadRes.data.url;
        setSourceImageUrl(imageUrl);
        setLastUploadedPhotoUrl(imageUrl);
        saveLastPhotoUrl(imageUrl);
      }

      setPhase("generating");
      savePrefs(resolution, reportLang);
      const taskRes = await createTask(imageUrl, analysisType, reportLang, {
        resolution,
        ...(analysisType === "occasion_makeup" ? { occasion } : {}),
      });
      if (taskRes.code === 429) {
        trackEvent("quota_exhausted", { type: analysisType });
        setQuota(taskRes.data?.quota ?? { total: 1, used: 1, remaining: 0 });
        setPhase("no_quota");
        return;
      }
      if (taskRes.code !== 200 || !taskRes.data?.task_id) {
        throw new Error(taskRes.message);
      }

      if (taskRes.data.quota) {
        setQuota(taskRes.data.quota);
      }

      const images = await pollUntilDone(taskRes.data.task_id);
      setResultUrls(images);
      setPhase("done");
      trackEvent("generate_completed", {
        type: analysisType,
        resolution,
        image_count: images.length,
        duration_sec: Math.round((Date.now() - generateStart) / 1000),
      });
      reloadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(message);
      setPhase("error");
      trackEvent("generate_failed", { type: analysisType, error: message });
    }
  }, [previewUrl, sourceImageUrl, analysisType, reportLang, resolution, occasion, reloadHistory]);

  const startRecommendedAnalysis = useCallback(async (type: AnalysisType) => {
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
        setShowPricingModal(true);
        return;
      }

      const taskRes = await createTask(photoUrl, type, reportLang, { resolution });
      if (taskRes.code === 429) {
        setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: "error", errorMsg: "No credits" } : t));
        setShowPricingModal(true);
        return;
      }
      if (taskRes.code !== 200 || !taskRes.data?.task_id) throw new Error(taskRes.message);

      const images = await pollUntilDone(taskRes.data.task_id);
      setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: "done", resultUrls: images } : t));
      trackEvent("recommended_analysis_completed", { type, image_count: images.length });
      reloadHistory();
    } catch (err) {
      setBackgroundTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: "error", errorMsg: err instanceof Error ? err.message : "Failed" } : t));
    }
  }, [sourceImageUrl, lastUploadedPhotoUrl, reportLang, resolution, reloadHistory]);

  const handleUseLastPhoto = useCallback(async () => {
    if (!lastUploadedPhotoUrl) return;
    trackEvent("last_photo_reused");
    setSourceImageUrl(lastUploadedPhotoUrl);
    setPreviewUrl(lastUploadedPhotoUrl);
    setPhase("idle");
    setResultUrls([]);
    setErrorMsg("");
  }, [lastUploadedPhotoUrl]);

  const recommendedTypes = (RECOMMENDED_TYPES[analysisType] || []).filter(
    (t) => !backgroundTasks.some((bt) => bt.type === t)
  );

  const activeTaskCount = backgroundTasks.filter((t) => t.phase === "generating" || t.phase === "uploading").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Analysis Type Selector — Category Tabs + Type Grid */}
      <div className="mt-8">
        {/* Category Tabs */}
        <div className="flex justify-center border-b border-border">
          {ANALYSIS_TYPE_GROUPS.map((group) => (
            <button
              key={group.category}
              onClick={() => {
                const firstItem = group.items[0];
                if (firstItem && !group.items.some((i) => i.value === analysisType)) {
                  setAnalysisType(firstItem.value);
                  trackEvent("analysis_type_selected", { type: firstItem.value, source: "category_tab" });
                }
              }}
              className={`relative px-4 py-2.5 text-sm font-medium transition ${
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
                onClick={() => { setAnalysisType(at.value); trackEvent("analysis_type_selected", { type: at.value, source: "type_pill" }); }}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                  analysisType === at.value
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "border border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <span className="shrink-0">{at.icon}</span>
                {t(`type_${at.value}`)}
                {at.creditCost && at.creditCost > 1 && (
                  <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {at.creditCost}x
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}

        {/* Type Info Panel: Photo Requirement + Output */}
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
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
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("output")}</p>
                <p className="mt-0.5 text-sm">{t(`out_${analysisType}`)}</p>
              </div>
            </div>
          </div>
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

      {/* Settings: Resolution + Report Language */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {/* Resolution */}
        <div className="flex items-center rounded-full border border-border bg-card p-0.5">
          {(["2K", "4K"] as Resolution[]).map((r) => (
            <button
              key={r}
              onClick={() => { setResolution(r); savePrefs(r, reportLang); trackEvent("resolution_changed", { resolution: r }); }}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                resolution === r
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
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

      {/* Example Showcase */}
      {EXAMPLE_IMAGES[analysisType] && (
        <div className="mt-8">
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground">{t("exampleTitle")}</p>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4">
            <div className="space-y-1.5">
              <span className="block text-center text-xs font-medium text-muted-foreground">{t("exampleBefore")}</span>
              <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
                <img
                  src="/images/examples/before.webp"
                  alt="Example photo"
                  className="h-auto w-full object-cover"
                  style={{ aspectRatio: "3/4" }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="block text-center text-xs font-medium text-muted-foreground">{t("exampleAfter")}</span>
              <div
                className="cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-background transition hover:shadow-md"
                onClick={() => {
                  trackEvent("example_viewed", { type: analysisType });
                  setExamplePreview(EXAMPLE_IMAGES[analysisType]!);
                }}
              >
                <img
                  src={EXAMPLE_IMAGES[analysisType]!}
                  alt="Example AI report"
                  className="h-auto w-full object-cover"
                  style={{ aspectRatio: "3/4" }}
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">{t("exampleCta")}</p>
        </div>
      )}

      {/* Example Preview Modal */}
      {examplePreview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setExamplePreview(null)}
        >
          <div className="relative max-h-[90vh] max-w-lg overflow-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExamplePreview(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={examplePreview} alt="Example report full view" className="h-auto w-full rounded-2xl" />
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="mt-8">
        <div
          onClick={handleUploadClick}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
            previewUrl
              ? "border-primary/40 bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          } ${previewUrl ? "max-h-[480px]" : "py-16"}`}
        >
          {previewUrl ? (
            <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl" style={{ maxHeight: 480 }}>
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[480px] max-w-full rounded-2xl object-contain"
              />
              {(phase === "preparing" || phase === "uploading" || phase === "generating") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/50 backdrop-blur-[2px]">
                  <Spinner className="h-8 w-8 text-white" />
                  <p className="mt-3 text-sm font-medium text-white">
                    {phase === "preparing"
                      ? t("preparing")
                      : phase === "uploading"
                        ? t("uploading")
                        : t("generating")}
                  </p>
                  {phase === "generating" && generateElapsed > 60 && (
                    <p className="mt-1.5 text-xs text-white/80">
                      {t("almostDone")}
                    </p>
                  )}
                  {phase === "generating" && generateElapsed > 0 && (
                    <p className="mt-1 text-[11px] text-white/60">
                      {Math.floor(generateElapsed / 60)}:{String(generateElapsed % 60).padStart(2, "0")}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <svg
                className="mb-3 h-12 w-12 text-muted-foreground/50"
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
              {lastUploadedPhotoUrl && !previewUrl && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUseLastPhoto(); }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {t("useLastPhoto")}
                </button>
              )}
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {previewUrl && (
          <div className="mt-2 text-center">
            <button
              onClick={() => {
                setPreviewUrl(null);
                setResultUrls([]);
                setPhase("idle");
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("changePhoto")}
            </button>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="mt-6 text-center">
        {phase === "no_quota" ? (
          <NoQuotaCard t={t} onViewPlans={() => { trackEvent("pricing_modal_opened", { source: "no_quota_generate" }); setShowPricingModal(true); }} />
        ) : (
          <>
            <button
              onClick={() => {
                handleGenerate();
              }}
              disabled={
                !previewUrl ||
                phase === "uploading" ||
                phase === "generating" ||
                phase === "preparing"
              }
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(phase === "uploading" ||
                phase === "generating" ||
                phase === "preparing") && <Spinner />}
              {(phase === "preparing" || phase === "uploading" || phase === "generating")
                ? t("generating")
                : t("generate")}
            </button>

            {userCredits && phase !== "done" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {userCredits.subPlan ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">Pro</span>
                    {t("quotaInfo", { remaining: userCredits.totalRemaining, total: userCredits.subRemaining + userCredits.paid + (quota?.remaining ?? 0) })}
                  </span>
                ) : (
                  t("quotaInfo", { remaining: userCredits.totalRemaining, total: quota?.total ?? 1 })
                )}
              </p>
            )}
            {!userCredits && quota && phase !== "done" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("quotaInfo", { remaining: quota.remaining, total: quota.total })}
              </p>
            )}
          </>
        )}
      </div>

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
                    alt={TYPE_LABELS[type]}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold truncate">{t(`type_${type}`)}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-primary">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="text-[11px] font-medium">{t("startNow")}</span>
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
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
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
                    onClick={() => setLightbox({ entry: { id: task.id, status: "success", type: task.type, image_urls: task.resultUrls, source_image_url: sourceImageUrl ?? lastUploadedPhotoUrl ?? undefined, created_at: Date.now() / 1000 }, imageIndex: 0 })}
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

      {/* Error */}
      {phase === "error" && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Result */}
      {phase === "done" && resultUrls.length > 0 && (
        <div className="mt-8">
          <h2 className="text-center text-xl font-bold">{t("resultTitle")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {resultUrls.map((url, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-border transition hover:border-primary/40 hover:shadow-lg">
                <img
                  src={url}
                  alt={`Result ${i + 1}`}
                  className="w-full cursor-pointer transition duration-300 group-hover:scale-[1.02]"
                  onClick={() => setLightbox({ entry: { id: "current", status: "success", type: analysisType, image_urls: resultUrls, source_image_url: sourceImageUrl ?? undefined, created_at: Date.now() / 1000 }, imageIndex: i })}
                />
                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => handleDownload(url)} className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80" title={t("download")}>
                    <DownloadIcon />
                  </button>
                  <button onClick={() => handleShare(url)} className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80" title={t("share")}>
                    <ShareIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={() => handleCorrectionOpen({ id: "current", status: "success", type: analysisType, image_urls: resultUrls, source_image_url: sourceImageUrl ?? undefined, created_at: Date.now() / 1000 })}
              disabled={!sourceImageUrl}
              className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:opacity-50"
            >
              <CorrectionIcon />
              {t("correction")}
            </button>
          </div>

          {/* Post-result recommendations */}
          {recommendedTypes.length > 0 && (sourceImageUrl || lastUploadedPhotoUrl) && (
            <div className="mt-8 rounded-2xl border border-border bg-gradient-to-br from-muted/30 to-muted/10 p-5">
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
                        alt={TYPE_LABELS[type]}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5 text-center">
                      <p className="text-xs font-semibold truncate">{t(`type_${type}`)}</p>
                      <div className="mt-1 flex items-center justify-center gap-1 text-primary">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        <span className="text-[11px] font-medium">{t("startNow")}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {quota && quota.remaining <= 0 && (
            <div className="mt-6">
              <NoQuotaCard t={t} onViewPlans={() => { trackEvent("pricing_modal_opened", { source: "no_quota_result" }); setShowPricingModal(true); }} />
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
                    <img
                      src={entry.image_urls[0]}
                      alt="Analysis"
                      className="aspect-[3/4] w-full object-cover"
                    />
                  )}
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {TYPE_LABELS[entry.type as AnalysisType] || entry.type}
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
          t={t}
        />
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
          url={shareModal}
          onClose={() => setShareModal(null)}
          onCopied={() => { setShareToast(true); setTimeout(() => setShareToast(false), 2000); }}
          t={t}
        />
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {t("shareCopied")}
        </div>
      )}

      {/* Floating task indicator */}
      {activeTaskCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              const el = document.querySelector('[data-task-panel]');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            <Spinner />
            {t("tasksRunning", { count: activeTaskCount })}
          </button>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal open={showPricingModal} onClose={() => setShowPricingModal(false)} />

      {/* Welcome Offer */}
      <WelcomeOfferSheet open={showWelcomeOffer} onClose={() => setShowWelcomeOffer(false)} />
    </div>
  );
}

function NoQuotaCard({ t, onViewPlans }: { t: (key: string) => string; onViewPlans: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (product: string) => {
    trackEvent("checkout_started", { product, source: "no_quota_card" });
    setLoading(product);
    try {
      const userId = getCachedUserId();
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, userId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        openCheckout({
          checkoutUrl: data.checkoutUrl,
          theme: "light",
          onComplete: () => {
            trackEvent("checkout_completed", { product, source: "no_quota_card" });
            window.location.reload();
          },
        });
      }
    } catch { /* ignore */ } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
      <p className="text-lg font-semibold text-amber-900">{t("noQuotaTitle")}</p>
      <p className="mt-1 text-sm text-amber-700">{t("noQuotaDesc")}</p>
      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => handleBuy("credits5")}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl disabled:opacity-50"
        >
          {loading === "credits5" ? t("processing") : t("buy5Credits")}
        </button>
        <button
          onClick={() => handleBuy("credits12")}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
        >
          {loading === "credits12" ? t("processing") : t("buy12Credits")}
        </button>
      </div>
      <button
        onClick={onViewPlans}
        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
      >
        {t("viewAllPlans")}
      </button>
      <p className="mt-2 text-xs text-amber-600">{t("noQuotaHint")}</p>
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageLightbox({
  entry,
  initialIndex,
  onClose,
  onCorrection,
  onDownload,
  onShare,
  t,
}: {
  entry: HistoryEntry;
  initialIndex: number;
  onClose: () => void;
  onCorrection: (entry: HistoryEntry) => void;
  onDownload: (url: string) => void;
  onShare: (url: string) => void;
  t: (key: string) => string;
}) {
  const [index, setIndex] = useState(initialIndex);
  const urls = entry.image_urls;
  const currentUrl = urls[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1);
      if (e.key === "ArrowRight" && index < urls.length - 1) setIndex(index + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, urls.length, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Image */}
        <div className="relative flex items-center justify-center">
          {index > 0 && (
            <button onClick={() => setIndex(index - 1)} className="absolute left-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <img
            src={currentUrl}
            alt={`Report ${index + 1}`}
            className="max-h-[75vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
          />
          {index < urls.length - 1 && (
            <button onClick={() => setIndex(index + 1)} className="absolute right-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>

        {/* Page indicator */}
        {urls.length > 1 && (
          <div className="mt-3 flex gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => onDownload(currentUrl)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/20"
          >
            <DownloadIcon />
            {t("download")}
          </button>
          <button
            onClick={() => onShare(currentUrl)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/20"
          >
            <ShareIcon />
            {t("share")}
          </button>
          {entry.source_image_url && (
            <button
              onClick={() => onCorrection(entry)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/80 px-4 py-2 text-sm text-white hover:bg-primary"
            >
              <CorrectionIcon />
              {t("correction")}
            </button>
          )}
        </div>
      </div>
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

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("correction")}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{t("correctionDesc")}</p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("correctionPlaceholder")}
          className="w-full h-32 resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />

        <button
          onClick={() => { if (text.trim()) onSubmit(entry, text.trim()); }}
          disabled={!text.trim()}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-primary to-primary-dark py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
    buildUrl: (url: string, text: string) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
  },
] as const;

function SharePanel({
  url,
  onClose,
  onCopied,
  t,
}: {
  url: string;
  onClose: () => void;
  onCopied: () => void;
  t: (key: string) => string;
}) {
  const [caption, setCaption] = useState(t("shareText"));
  const [tags, setTags] = useState("BelleAI,ColorAnalysis,Beauty");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handlePlatformClick = (platform: typeof SHARE_PLATFORMS[number]) => {
    trackEvent("share_platform_click", { platform: platform.id });
    const shareUrl = platform.buildUrl(url, caption, tags);
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleCopyLink = async () => {
    trackEvent("share_link_copied");
    await navigator.clipboard.writeText(url);
    onCopied();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("share")}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Preview */}
        <div className="mb-4 flex gap-3 rounded-xl border border-border p-3">
          <img src={url} alt="" className="h-16 w-12 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full resize-none rounded-lg border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
              rows={2}
              placeholder={t("shareText")}
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border-0 bg-transparent p-0 text-xs text-primary focus:outline-none focus:ring-0"
              placeholder="#BelleAI #Beauty"
            />
          </div>
        </div>

        {/* Platform buttons */}
        <div className="grid grid-cols-4 gap-3">
          {SHARE_PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handlePlatformClick(platform)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition hover:bg-muted"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {platform.icon}
              </div>
              <span className="text-[11px] text-muted-foreground">{platform.name}</span>
            </button>
          ))}
        </div>

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
