"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { copyText } from "@/lib/device";
import { handoffCreate, handoffStatus } from "@/lib/api";
import { routing } from "@/i18n/routing";

/**
 * 桌面端「电脑里没有合适的照片，用手机拍一张」：真正的接力，手机只负责上传。
 *
 * 展开时向后端创建一个 10 分钟的接力会话（令牌绑定当前电脑的账号），二维码指向手机上传页 /handoff/{token}。
 * 手机扫码后只做一件事：拍照 / 选图上传。照片归属这台电脑的账号，这里轮询到照片后交给页面，
 * 之后的分析、付费、看报告都在电脑上完成——手机端不会产生新的设备 / 用户，也不会把分析流程搬到手机上。
 *
 * 二维码在浏览器里生成（uqr，只在展开时才动态加载），链接不会发给任何第三方。
 */

type Phase = "idle" | "creating" | "waiting" | "expired" | "error";

/** 前 2 分钟每 2 秒查一次（用户通常在这段时间里完成拍照），之后放慢到 4 秒 */
const FAST_POLL_MS = 2000;
const SLOW_POLL_MS = 4000;
const FAST_POLL_WINDOW_MS = 2 * 60 * 1000;
/** 连续这么多次查询失败（断网等）就停下来，提示重试 */
const MAX_POLL_FAILURES = 8;
/** 剩余有效期不到这么久就不复用旧令牌（用户刚好要扫的时候过期很糟） */
const REUSE_MIN_REMAINING_MS = 30 * 1000;

/** 把布尔矩阵画成一条 SVG path：每个深色格子一个 1×1 的方块 */
function matrixToPath(matrix: boolean[][]): string {
  let d = "";
  for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}

/**
 * 手机上传页的完整地址：沿用当前语种前缀（/de/try → /de/handoff/{token}；默认语种没有前缀）。
 * 语种前缀取路径第一段（不再靠「去掉 /try」推断，/scan 等其他页面也能用）。
 * 拍单品时带 ?for=item：手机上传页据此显示「拍单品」的文案、打开后置相机。
 */
function buildHandoffUrl(token: string, kind: "selfie" | "item"): string {
  const first = window.location.pathname.split("/")[1] ?? "";
  const prefix = routing.locales.some((l) => l === first && l !== routing.defaultLocale) ? `/${first}` : "";
  const url = new URL(`${prefix}/handoff/${token}`, window.location.origin);
  if (kind === "item") url.searchParams.set("for", "item");
  return url.toString();
}

export function PhoneHandoff({
  analysisType,
  kind = "selfie",
  onPhotoReceived,
}: {
  analysisType: string;
  /** selfie：手机上自拍（/try）；item：手机上拍一件单品（/scan） */
  kind?: "selfie" | "item";
  /** 手机传完照片后调用，参数是服务器上的图片地址（和电脑上自己选的照片走同一条后续流程） */
  onPhotoReceived: (url: string) => void;
}) {
  const t = useTranslations("tryPage");
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<boolean[][] | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);
  // 令牌的过期时间戳（本地估算，真正的过期以服务端为准）；收起再展开时若还够用就复用同一个二维码
  const expiresAtRef = useRef(0);
  const startedAtRef = useRef(0);
  const receivedRef = useRef(false);
  // 最新的回调放进 ref：轮询循环不会因为父组件重渲染（回调身份变化）而被反复重建
  const onReceivedRef = useRef(onPhotoReceived);
  useEffect(() => {
    onReceivedRef.current = onPhotoReceived;
  }, [onPhotoReceived]);

  // token 只在点击展开后才有（要读 window.location）：服务端渲染和首次渲染时一定是 null，不会有 hydration 不一致
  const url = useMemo(() => (token ? buildHandoffUrl(token, kind) : ""), [token, kind]);

  const startSession = useCallback(async () => {
    setPhase("creating");
    setMatrix(null);
    try {
      const res = await handoffCreate();
      if (res.code !== 200 || !res.data?.token) {
        trackEvent("handoff_create_failed", { type: analysisType, http: res.code });
        setPhase("error");
        return;
      }
      receivedRef.current = false;
      startedAtRef.current = Date.now();
      expiresAtRef.current = Date.now() + (res.data.expires_in || 600) * 1000;
      setToken(res.data.token);
      setPhase("waiting");
      trackEvent("handoff_created", { type: analysisType });
    } catch {
      trackEvent("handoff_create_failed", { type: analysisType, http: 0 });
      setPhase("error");
    }
  }, [analysisType]);

  // 生成二维码（令牌换了就重新生成）
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    import("uqr")
      .then(({ encode }) => {
        // ecc M：屏幕上显示、手机近距离扫描，不需要最高容错，M 的格子更大更好扫；border 3 = 留白（规范要求 4，容器再补一点）
        if (!cancelled) setMatrix(encode(url, { ecc: "M", border: 3 }).data);
      })
      .catch(() => {
        // 二维码库加载失败（网络等）：保留复制链接，二维码区域不显示
        if (!cancelled) setMatrix(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  // 等照片：展开且正在等待时轮询，收起 / 收到 / 过期 / 卸载都会停
  useEffect(() => {
    if (!open || phase !== "waiting" || !token) return;
    let cancelled = false;
    let timer: number | null = null;
    let failures = 0;

    const tick = async () => {
      if (cancelled) return;
      // 标签页在后台时不查（省请求，回到前台下一轮就会补上）
      if (!document.hidden) {
        try {
          const res = await handoffStatus(token);
          if (cancelled) return;
          const data = res.data;
          if (res.code === 200 && data?.status === "uploaded" && data.url) {
            if (!receivedRef.current) {
              receivedRef.current = true;
              trackEvent("handoff_photo_received", {
                type: analysisType,
                wait_s: Math.round((Date.now() - startedAtRef.current) / 1000),
              });
              onReceivedRef.current(data.url);
            }
            return;
          }
          if (res.code === 404 || (res.code === 200 && data?.status === "expired")) {
            trackEvent("handoff_expired", { type: analysisType });
            setPhase("expired");
            return;
          }
          // 其他情况（含后端暂时 5xx）算一次失败
          failures = res.code === 200 ? 0 : failures + 1;
        } catch {
          failures += 1;
        }
        if (cancelled) return;
        if (failures >= MAX_POLL_FAILURES) {
          setPhase("error");
          return;
        }
      }
      // 本地估算已经过期（服务端那边的状态查不到时的兜底）
      if (Date.now() > expiresAtRef.current + 10_000) {
        setPhase("expired");
        return;
      }
      const elapsed = Date.now() - startedAtRef.current;
      timer = window.setTimeout(tick, elapsed < FAST_POLL_WINDOW_MS ? FAST_POLL_MS : SLOW_POLL_MS);
    };

    timer = window.setTimeout(tick, FAST_POLL_MS);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [open, phase, token, analysisType]);

  useEffect(
    () => () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    },
    [],
  );

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    trackEvent("desktop_qr_opened", { type: analysisType });
    setOpen(true);
    // 收起前的令牌还够用就直接继续等，不用再向后端要一个
    const reusable = token && phase === "waiting" && expiresAtRef.current - Date.now() > REUSE_MIN_REMAINING_MS;
    if (!reusable) void startSession();
  };

  const handleCopy = async () => {
    if (!url) return;
    const ok = await copyText(url);
    if (!ok) return;
    trackEvent("desktop_qr_link_copied", { type: analysisType });
    setCopied(true);
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="inline-flex min-h-9 items-start gap-1.5 text-left text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
        <span>{t("handoffLink")}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-border bg-background p-3">
          {(phase === "expired" || phase === "error") && (
            <div className="text-center" role="status">
              <p className="text-xs leading-snug text-muted-foreground">
                {phase === "expired" ? t("handoffExpired") : t("handoffError")}
              </p>
              <button
                type="button"
                onClick={() => void startSession()}
                className="mx-auto mt-2 flex min-h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-white transition hover:opacity-90"
              >
                {t("handoffRefresh")}
              </button>
            </div>
          )}

          {(phase === "creating" || phase === "waiting") && (
            <>
              <div className="mx-auto w-36 rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-border">
                {matrix && phase === "waiting" ? (
                  <svg
                    viewBox={`0 0 ${matrix.length} ${matrix.length}`}
                    role="img"
                    aria-label={t("handoffQrAlt")}
                    shapeRendering="crispEdges"
                    className="block h-auto w-full"
                  >
                    <rect width={matrix.length} height={matrix.length} fill="#fff" />
                    <path d={matrixToPath(matrix)} fill="#111" />
                  </svg>
                ) : (
                  <div className="aspect-square w-full animate-pulse rounded bg-muted" aria-hidden="true" />
                )}
              </div>
              <p className="mt-2 text-center text-xs leading-snug text-muted-foreground">{kind === "item" ? t("handoffItemHint") : t("handoffHint")}</p>
              {phase === "waiting" && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-foreground" role="status" aria-live="polite">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {t("handoffWaiting")}
                </p>
              )}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!url}
                className="mx-auto mt-2 flex min-h-9 items-center justify-center rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground transition hover:border-primary/40 disabled:opacity-50"
              >
                {copied ? t("handoffCopied") : t("handoffCopy")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
