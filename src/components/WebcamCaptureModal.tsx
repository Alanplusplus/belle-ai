"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDialogA11y } from "@/lib/useDialogA11y";
import { trackEvent } from "@/lib/analytics";

type Status = "starting" | "ready" | "error";
type ErrorKind = "denied" | "missing" | "other";

/** getUserMedia 的失败原因归成三类：被拒绝（用户能自己改）/ 没有摄像头（换手机）/ 其他（被占用等） */
function errorKindOf(err: unknown): ErrorKind {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "missing";
  return "other";
}

/**
 * 桌面端的网页摄像头自拍。
 * 桌面浏览器会忽略 input 的 capture 属性，所以桌面上传卡里原本没有「拍一张」的入口，想用自拍的人得先把照片传到电脑上。
 * 打开时才请求摄像头权限（由用户点击触发）；关闭 / 卸载时一定释放摄像头，否则指示灯会一直亮着。
 * 拍到的照片按普通选图的流程处理：onCapture 收到的就是一个 JPEG File。
 */
export function WebcamCaptureModal({
  onCapture,
  onClose,
  onChooseFile,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  /** 摄像头用不了时改选文件：调用方负责关闭弹窗并弹出文件选择器 */
  onChooseFile: () => void;
}) {
  const t = useTranslations("tryPage");
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("starting");
  const [errorKind, setErrorKind] = useState<ErrorKind>("other");
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const stop = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // 这些都是 ideal 而不是 exact：没有前置 / 没有这个分辨率的摄像头也能打开，不会因为约束过严直接失败
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setStatus("ready");
        trackEvent("webcam_opened");
      } catch (err) {
        if (cancelled) return;
        const kind = errorKindOf(err);
        setErrorKind(kind);
        setStatus("error");
        trackEvent("webcam_failed", { reason: kind });
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || capturing) return;
    setCapturing(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCapturing(false);
      return;
    }
    // 预览是镜像的（和照镜子一样自然），但存下来的照片不镜像：和手机前置相机的成品一致，也不会让左右反过来
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCapturing(false);
          return;
        }
        trackEvent("webcam_captured", { width: canvas.width, height: canvas.height });
        const now = Date.now();
        onCapture(new File([blob], `webcam-selfie-${now}.jpg`, { type: "image/jpeg", lastModified: now }));
      },
      "image/jpeg",
      0.92,
    );
  }, [capturing, onCapture]);

  const errorText =
    errorKind === "denied" ? t("webcamErrorDenied") : errorKind === "missing" ? t("webcamErrorMissing") : t("webcamErrorOther");

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("webcamTitle")}
      tabIndex={-1}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4 outline-none backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t("webcamTitle")}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {status === "error" ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <p role="alert" className="text-sm text-muted-foreground">{errorText}</p>
            <button
              type="button"
              onClick={onChooseFile}
              className="mt-4 min-h-11 rounded-full bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {t("webcamChooseFile")}
            </button>
          </div>
        ) : (
          <>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
              {/* playsInline + muted：Safari 不加这两个不会自动播放；-scale-x-100 让预览镜像 */}
              <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
              {status === "starting" && (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">{t("webcamStarting")}</p>
              )}
              {/* 脸部取景参考：椭圆内放脸，别太近 / 太远 */}
              {status === "ready" && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-[78%] w-[46%] rounded-[50%] border-2 border-dashed border-white/60" />
                </div>
              )}
            </div>
            <p className="mt-3 text-xs leading-snug text-muted-foreground">{t("webcamHint")}</p>
            <div className="mt-4 flex flex-col-reverse items-center gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={onChooseFile}
                className="min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("webcamChooseFile")}
              </button>
              <button
                type="button"
                onClick={handleCapture}
                disabled={status !== "ready" || capturing}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {t("webcamCapture")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
