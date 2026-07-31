"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  webSignIn,
  uploadImage,
  createTask,
  pollUntilDone,
  fetchHistory,
  fetchProcessingTask,
  type WebSignInData,
  type HistoryEntry,
} from "@/lib/api";

interface LightboxState {
  entry: HistoryEntry;
  imageIndex: number;
}

type AnalysisType = "makeup" | "color_analysis" | "face_shape";
type Phase =
  | "idle"
  | "preparing"
  | "uploading"
  | "generating"
  | "done"
  | "error"
  | "no_quota";

function MakeupTypeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  );
}

function ColorTypeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}

function FaceTypeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  );
}

const ANALYSIS_TYPES: { value: AnalysisType; icon: React.ReactNode }[] = [
  { value: "makeup", icon: <MakeupTypeIcon /> },
  { value: "color_analysis", icon: <ColorTypeIcon /> },
  { value: "face_shape", icon: <FaceTypeIcon /> },
];

const TYPE_LABELS: Record<AnalysisType, string> = {
  makeup: "Makeup",
  color_analysis: "Color",
  face_shape: "Face & Hair",
};

export function TryClient({ locale }: { locale: string }) {
  const t = useTranslations("tryPage");
  const { data: session, status } = useSession();

  const [phase, setPhase] = useState<Phase>("idle");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("color_analysis");
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
  const fileRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = status === "authenticated";
  const resumedRef = useRef(false);

  // 从服务端加载历史 + 恢复 processing 任务
  useEffect(() => {
    if (!isLoggedIn || resumedRef.current) return;
    resumedRef.current = true;

    setHistoryLoading(true);
    // 并行加载历史和进行中的任务
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
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadHistory = useCallback(() => {
    fetchHistory().then((res) => {
      if (res.code === 200 && res.data?.list) {
        setHistory(res.data.list);
      }
    });
  }, []);

  const handleCorrection = useCallback(async (entry: HistoryEntry) => {
    if (!entry.source_image_url) return;
    setLightbox(null);
    setPhase("generating");
    setErrorMsg("");
    setResultUrls([]);
    const type = (entry.type || "color_analysis") as AnalysisType;
    setAnalysisType(type);

    try {
      const signInRes = await webSignIn(
        session?.user?.email ?? undefined,
        session?.user?.name ?? undefined,
        session?.user?.image ?? undefined
      );
      if (signInRes.code !== 200 || !signInRes.data) throw new Error(signInRes.message);
      const data = signInRes.data;
      if ((data.total_remaining ?? data.web_quota.remaining) <= 0) {
        setPhase("no_quota");
        return;
      }

      const taskRes = await createTask(entry.source_image_url, type, locale);
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
  }, [session, locale, reloadHistory]);

  const handleDownload = useCallback(async (url: string) => {
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
  }, []);

  const handleShare = useCallback(async (url: string) => {
    const shareData = {
      title: t("shareTitle"),
      text: t("shareText"),
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  }, [t]);

  const handleUploadClick = useCallback(() => {
    if (!isLoggedIn) {
      signIn("google");
      return;
    }
    fileRef.current?.click();
  }, [isLoggedIn]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(t("fileTooLarge"));
        setPhase("error");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPhase("idle");
      setResultUrls([]);
      setErrorMsg("");
    },
    [t]
  );

  const handleGenerate = useCallback(async () => {
    if (!previewUrl || !isLoggedIn) return;

    setPhase("preparing");
    setErrorMsg("");

    try {
      const signInRes = await webSignIn(
        session?.user?.email ?? undefined,
        session?.user?.name ?? undefined,
        session?.user?.image ?? undefined
      );
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
        setPhase("no_quota");
        return;
      }

      setPhase("uploading");
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("No file selected");

      const base64 = await fileToBase64(file);
      const uploadRes = await uploadImage(base64);
      if (uploadRes.code !== 200 || !uploadRes.data?.url) {
        throw new Error(uploadRes.message);
      }
      setSourceImageUrl(uploadRes.data.url);

      setPhase("generating");
      const taskRes = await createTask(uploadRes.data.url, analysisType, locale);
      if (taskRes.code === 429) {
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
      reloadHistory();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setPhase("error");
    }
  }, [previewUrl, isLoggedIn, session, analysisType, locale, reloadHistory]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Analysis Type Selector */}
      <div className="mt-8 flex justify-center gap-3">
        {ANALYSIS_TYPES.map((at) => (
          <button
            key={at.value}
            onClick={() => setAnalysisType(at.value)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
              analysisType === at.value
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "border border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            <span>{at.icon}</span>
            {t(`type_${at.value}`)}
          </button>
        ))}
      </div>

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
            <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl" style={{ maxHeight: 480 }}>
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[480px] max-w-full rounded-2xl object-contain"
              />
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
              <p className="text-sm font-medium text-foreground">
                {isLoggedIn ? t("uploadTitle") : t("loginRequired")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isLoggedIn ? t("uploadHint") : t("signInNote")}
              </p>
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
          <NoQuotaCard t={t} />
        ) : (
          <>
            <button
              onClick={isLoggedIn ? handleGenerate : () => signIn("google")}
              disabled={
                isLoggedIn && (
                  !previewUrl ||
                  phase === "uploading" ||
                  phase === "generating" ||
                  phase === "preparing"
                )
              }
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(phase === "uploading" ||
                phase === "generating" ||
                phase === "preparing") && <Spinner />}
              {phase === "preparing"
                ? t("preparing")
                : phase === "uploading"
                  ? t("uploading")
                  : phase === "generating"
                    ? t("generating")
                    : !isLoggedIn
                      ? t("signInToGenerate")
                      : t("generate")}
            </button>

            {!isLoggedIn && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("signInNote")}
              </p>
            )}

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
              onClick={() => handleCorrection({ id: "current", status: "success", type: analysisType, image_urls: resultUrls, source_image_url: sourceImageUrl ?? undefined, created_at: Date.now() / 1000 })}
              disabled={!sourceImageUrl}
              className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:opacity-50"
            >
              <CorrectionIcon />
              {t("correction")}
            </button>
          </div>

          {quota && quota.remaining <= 0 && (
            <div className="mt-6">
              <NoQuotaCard t={t} />
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
                  onClick={() => setLightbox({ entry, imageIndex: 0 })}
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
          onCorrection={handleCorrection}
          onDownload={handleDownload}
          onShare={handleShare}
          t={t}
        />
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {t("shareCopied")}
        </div>
      )}
    </div>
  );
}

function NoQuotaCard({ t }: { t: (key: string) => string }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (product: string) => {
    setLoading(product);
    try {
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
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
      <Link
        href="/pricing"
        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
      >
        {t("viewAllPlans")}
      </Link>
      <p className="mt-2 text-xs text-amber-600">{t("noQuotaHint")}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
