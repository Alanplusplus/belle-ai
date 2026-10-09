"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { copyText } from "@/lib/device";
import { buildChromeIntentUrl, detectInAppBrowser, isAndroid } from "@/lib/inAppBrowser";

const DISMISS_KEY = "belle_inapp_notice_dismissed";

function HelpActions({ source }: { source: string }) {
  const t = useTranslations("inApp");
  const [copied, setCopied] = useState(false);
  // 这个组件只会在客户端挂载之后才渲染（外层靠 effect 判定是内置浏览器后才显示），所以可以直接读 navigator
  const android = typeof navigator !== "undefined" && isAndroid();

  const handleOpenChrome = () => {
    trackEvent("inapp_open_chrome", { source });
    const intent = buildChromeIntentUrl(window.location.href);
    if (intent) window.location.href = intent;
  };

  const handleCopy = async () => {
    trackEvent("inapp_copy_link", { source });
    const ok = await copyText(window.location.href);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {android && (
        <button
          type="button"
          onClick={handleOpenChrome}
          className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white"
        >
          {t("openChrome")}
        </button>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-10 items-center rounded-full border border-primary/40 bg-white/80 px-4 text-sm font-semibold text-primary"
      >
        {copied ? t("copied") : t("copyLink")}
      </button>
    </div>
  );
}

/**
 * 内置浏览器提示条：用户从 Instagram / TikTok / Pinterest / Facebook 等 App 点进来时，
 * 提示用系统浏览器打开，这样记录、订阅才会保存在系统浏览器里，Google 登录也才能用。
 * 非内置浏览器不渲染任何内容。
 */
export function InAppBrowserNotice({ className = "" }: { className?: string }) {
  const t = useTranslations("inApp");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const app = detectInAppBrowser();
    if (!app) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* 隐私模式读不到时照常显示 */
    }
    // 内置浏览器只能在客户端靠 UA 判断；放到挂载后再显示，避免服务端与客户端首屏不一致造成 hydration 报错
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    trackEvent("inapp_notice_shown", { app });
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`relative rounded-xl border border-primary/30 bg-primary/10 p-3 pr-11 text-sm ${className}`} role="note">
      <p className="font-semibold text-foreground">{t("title")}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("bannerText")}</p>
      <HelpActions source="banner" />
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t("dismiss")}
        className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

/** 在内置浏览器里点「Google 登录」时弹出：说明为什么不能登录，并给出打开系统浏览器的办法 */
export function InAppSignInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("inApp");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    trackEvent("inapp_signin_blocked_shown", { app: detectInAppBrowser() ?? "unknown" });
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[260] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold">{t("title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("signInBlocked")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t(isAndroid() ? "androidSteps" : "iosSteps")}</p>
        <HelpActions source="signin_sheet" />
        <button
          type="button"
          onClick={onClose}
          className="mt-3 min-h-10 w-full rounded-full py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}
