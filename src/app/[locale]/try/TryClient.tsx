"use client";

import { useState, useRef, useCallback } from "react";
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
  | "signing_in"
  | "uploading"
  | "generating"
  | "done"
  | "error"
  | "no_quota";

const ANALYSIS_TYPES: { value: AnalysisType; icon: string }[] = [
  { value: "makeup", icon: "💄" },
  { value: "color_analysis", icon: "🎨" },
  { value: "face_shape", icon: "💇" },
];

export function TryClient({ locale }: { locale: string }) {
  const t = useTranslations("tryPage");
  const { data: session, status } = useSession();

  const [phase, setPhase] = useState<Phase>("idle");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("color_analysis");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [quota, setQuota] = useState<{ total: number; used: number; remaining: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!previewUrl) return;

    if (status !== "authenticated") {
      signIn("google");
      return;
    }

    setPhase("signing_in");
    setErrorMsg("");

    try {
      // 1. 后端登录 / 获取次数
      const signInRes = await webSignIn(
        session.user?.email ?? undefined,
        session.user?.name ?? undefined,
        session.user?.image ?? undefined
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

      // 2. 上传图片
      setPhase("uploading");
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("No file selected");

      const base64 = await fileToBase64(file);
      const uploadRes = await uploadImage(base64);
      if (uploadRes.code !== 200 || !uploadRes.data?.url) {
        throw new Error(uploadRes.message);
      }

      // 3. 创建生成任务
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

      // 4. 轮询结果
      const images = await pollUntilDone(taskRes.data.task_id);
      setResultUrls(images);
      setPhase("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setPhase("error");
    }
  }, [previewUrl, status, session, analysisType, locale]);

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
        <label
          htmlFor="photo-upload"
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
            previewUrl
              ? "border-primary/40 bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          } ${previewUrl ? "aspect-[3/4] max-h-[480px]" : "py-16"}`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full rounded-2xl object-contain"
            />
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
                {t("uploadTitle")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("uploadHint")}
              </p>
            </>
          )}
          <input
            ref={fileRef}
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>

        {previewUrl && (
          <button
            onClick={() => {
              setPreviewUrl(null);
              setResultUrls([]);
              setPhase("idle");
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("changePhoto")}
          </button>
        )}
      </div>

      {/* Generate Button */}
      <div className="mt-6 text-center">
        {phase === "no_quota" ? (
          <NoQuotaCard t={t} />
        ) : (
          <>
            <button
              onClick={handleGenerate}
              disabled={
                !previewUrl ||
                phase === "uploading" ||
                phase === "generating" ||
                phase === "signing_in"
              }
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(phase === "uploading" ||
                phase === "generating" ||
                phase === "signing_in") && <Spinner />}
              {phase === "signing_in"
                ? t("signingIn")
                : phase === "uploading"
                  ? t("uploading")
                  : phase === "generating"
                    ? t("generating")
                    : status !== "authenticated"
                      ? t("signInToGenerate")
                      : t("generate")}
            </button>

            {status !== "authenticated" && previewUrl && (
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
            <span className="mt-0.5 text-primary">✓</span>
            {t("tip1")}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">✓</span>
            {t("tip2")}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">✓</span>
            {t("tip3")}
          </li>
        </ul>
      </div>
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
