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
} from "@/lib/api";

type AnalysisType = "makeup" | "color_analysis" | "face_shape";
type Phase =
  | "idle"
  | "preparing"
  | "uploading"
  | "generating"
  | "done"
  | "error"
  | "no_quota";

interface HistoryEntry {
  id: string;
  type: AnalysisType;
  imageUrls: string[];
  createdAt: number;
}

const HISTORY_KEY = "belle_analysis_history";

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 20)));
}

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
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [quota, setQuota] = useState<{ total: number; used: number; remaining: number } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = status === "authenticated";

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addToHistory = useCallback((type: AnalysisType, imageUrls: string[]) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      type,
      imageUrls,
      createdAt: Date.now(),
    };
    const updated = [entry, ...loadHistory()].slice(0, 20);
    saveHistory(updated);
    setHistory(updated);
  }, []);

  const clearHistory = useCallback(() => {
    saveHistory([]);
    setHistory([]);
  }, []);

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
      const webQuota = signInRes.data.web_quota;
      setQuota(webQuota);

      if (webQuota.remaining <= 0) {
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
      addToHistory(analysisType, images);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setPhase("error");
    }
  }, [previewUrl, isLoggedIn, session, analysisType, locale, addToHistory]);

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

            {quota && phase !== "done" && (
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
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-2xl border border-border transition hover:border-primary/40 hover:shadow-lg"
              >
                <img
                  src={url}
                  alt={`Result ${i + 1}`}
                  className="w-full transition duration-300 group-hover:scale-[1.02]"
                />
              </a>
            ))}
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
      {history.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{t("historyTitle")}</h2>
            <button
              onClick={clearHistory}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("historyClearAll")}
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
              >
                {entry.imageUrls[0] && (
                  <a
                    href={entry.imageUrls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={entry.imageUrls[0]}
                      alt="Analysis"
                      className="aspect-[3/4] w-full object-cover"
                    />
                  </a>
                )}
                <div className="flex items-center justify-between p-3">
                  <div>
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {TYPE_LABELS[entry.type]}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {entry.imageUrls.length > 1 && (
                    <div className="flex gap-1">
                      {entry.imageUrls.slice(1).map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-10 w-10 overflow-hidden rounded-lg border border-border"
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NoQuotaCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
      <p className="text-lg font-semibold text-amber-900">{t("noQuotaTitle")}</p>
      <p className="mt-1 text-sm text-amber-700">{t("noQuotaDesc")}</p>
      <Link
        href="/download"
        className="mt-4 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
      >
        {t("downloadApp")}
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
