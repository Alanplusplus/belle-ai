"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import { handoffUpload } from "@/lib/api";
import {
  prepareImageForUpload,
  snapshotFile,
  IMAGE_TOO_LARGE,
  IMAGE_UNREADABLE,
  IMAGE_UNSUPPORTED,
} from "@/lib/imageUpload";

/** 手机原图常见 5–12MB，上传前会在浏览器里重新编码；和 /try 一致放宽到 25MB */
const MAX_PHOTO_BYTES = 25 * 1024 * 1024;

type Stage = "ready" | "uploading" | "done" | "expired";
type ErrorKey = "errorUploadTooLarge" | "errorUploadUnreadable" | "errorUploadFormat" | "handoffUploadFailed";

function errorKeyFor(message: string, httpCode?: number): ErrorKey {
  if (message === IMAGE_TOO_LARGE || message === "payload_too_large" || httpCode === 413) return "errorUploadTooLarge";
  if (message === IMAGE_UNREADABLE) return "errorUploadUnreadable";
  if (message === IMAGE_UNSUPPORTED || httpCode === 415) return "errorUploadFormat";
  return "handoffUploadFailed";
}

/**
 * 手机接力的上传页：电脑上的页面展示二维码，手机扫码到这里，只做一件事——拍照 / 选图并上传。
 * 照片归属电脑端的账号，分析、付费、看报告都回到电脑上完成；这个页面不登录、不建账号、不产生新的设备。
 */
export function HandoffClient({ token, kind = "selfie" }: { token: string; kind?: "selfie" | "item" }) {
  const t = useTranslations("tryPage");
  // item：从买前扫一扫发起，手机上拍的是一件单品（后置相机、不需要「这是你本人」的同意条款）；selfie：/try 的自拍
  const isItem = kind === "item";
  const [stage, setStage] = useState<Stage>("ready");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    trackEvent("handoff_phone_opened");
  }, []);

  // 换预览 / 卸载时释放上一个 blob 地址
  const setPreview = useCallback((url: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreviewUrl(url);
  }, []);
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const processFile = useCallback(
    async (file: File, source: "camera" | "library") => {
      setErrorKey(null);
      if (file.size > MAX_PHOTO_BYTES) {
        trackEvent("handoff_phone_rejected", { reason: "file_too_large" });
        setErrorKey("errorUploadTooLarge");
        return;
      }
      setStage("uploading");
      try {
        // 选中的当下就读进内存：File 只是磁盘文件的引用，等压缩 / 上传时可能已经失效
        const stable = await snapshotFile(file);
        setPreview(URL.createObjectURL(stable));
        const base64 = await prepareImageForUpload(stable);
        const res = await handoffUpload(token, base64);
        if (res.code === 200) {
          trackEvent("handoff_phone_uploaded", { source, size_kb: Math.round(base64.length / 1024) });
          setStage("done");
          return;
        }
        if (res.code === 404 || res.code === 410) {
          trackEvent("handoff_phone_expired");
          setStage("expired");
          return;
        }
        trackEvent("handoff_phone_failed", { http: res.code, error: res.message });
        setErrorKey(errorKeyFor(res.message, res.code));
      } catch (err) {
        const message = err instanceof Error ? err.message : "upload_failed";
        trackEvent("handoff_phone_failed", { http: 0, error: message });
        setErrorKey(errorKeyFor(message));
      }
      // 失败：回到可以重新选的状态，不留着一张没传成功的预览
      setPreview(null);
      setStage("ready");
    },
    [token, setPreview],
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const source = e.target === cameraRef.current ? "camera" : "library";
      // 先清空 input：之后再选同一张照片也会触发 change
      e.target.value = "";
      if (file) void processFile(file, source);
    },
    [processFile],
  );

  const uploading = stage === "uploading";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center px-4 py-10 text-center">
      {stage === "expired" ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-foreground">{t("handoffExpiredTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("handoffExpiredSub")}</p>
        </>
      ) : stage === "done" ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-foreground">{t("handoffDoneTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("handoffDoneSub")}</p>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="mt-5 h-40 w-32 rounded-2xl border border-border object-cover shadow-sm" />
          )}
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setStage("ready");
            }}
            className="mt-5 min-h-11 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition hover:border-primary/40"
          >
            {t("handoffRetake")}
          </button>
        </>
      ) : (
        <>
          <h1 className="font-serif text-2xl font-bold text-foreground">{isItem ? t("handoffItemPageTitle") : t("handoffPageTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("handoffPageSub")}</p>

          <div className="mt-6 flex h-52 w-40 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className={`h-full w-full object-cover ${uploading ? "opacity-60" : ""}`} />
            ) : (
              <svg className="h-10 w-10 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
                {isItem ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.68 0-5.22-.58-7.5-1.65z" />
                )}
              </svg>
            )}
          </div>

          <p className="mt-3 max-w-xs text-xs leading-snug text-muted-foreground">{isItem ? t("handoffItemTip") : t("req_color_analysis")}</p>

          {errorKey && (
            <p className="mt-4 rounded-xl border border-red-200/60 bg-red-50/30 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-950/10 dark:text-red-400" role="alert">
              {t(errorKey)}
            </p>
          )}

          <div className="mt-5 flex w-full max-w-xs flex-col gap-2.5">
            <button
              type="button"
              disabled={uploading}
              onClick={() => cameraRef.current?.click()}
              className="min-h-12 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:opacity-90 disabled:opacity-60"
            >
              {uploading ? t("handoffUploading") : isItem ? t("handoffItemTake") : t("takeSelfie")}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => galleryRef.current?.click()}
              className="min-h-12 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition hover:border-primary/40 disabled:opacity-60"
            >
              {t("chooseFromGallery")}
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture={isItem ? "environment" : "user"} className="hidden" onChange={handleSelect} />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />

          <p className="mt-6 max-w-xs text-xs leading-relaxed text-muted-foreground">
            {isItem ? t("handoffItemTrust") : t("uploadTrust")}{" "}
            <Link href="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
              {t("privacyLink")}
            </Link>
            {!isItem && <span className="mt-1 block text-[11px] text-muted-foreground/80">{t("uploadConsent")}</span>}
          </p>
        </>
      )}
    </div>
  );
}
