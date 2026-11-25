"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { trackEvent } from "@/lib/analytics";
import { getCachedEmail } from "@/lib/api";
import { getSavedCheckoutEmail, isValidEmail } from "@/lib/checkout";
import { triggerGoogleSignIn } from "@/lib/google-signin";
import { isInAppBrowser } from "@/lib/inAppBrowser";
import { useDialogA11y } from "@/lib/useDialogA11y";

/** 和后端 email_login.CODE_TTL_MINUTES / RESEND_COOLDOWN_SECONDS 保持一致（只用于文案和倒计时，真正的限制在后端） */
const CODE_MINUTES = 10;
const RESEND_SECONDS = 45;

type ErrorKey = "invalidEmail" | "invalidCode" | "sendFailed" | "tooMany";

function GoogleLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

/**
 * 登录弹层：Google + 邮箱验证码两种方式。
 *
 * 为什么要有邮箱登录：只有 Google 的时候，账号体系里 83% 的付费用户从没登录过（积分挂在浏览器指纹上，换浏览器就找不回），
 * Instagram / TikTok 等内置浏览器里 Google 又直接被拦。邮箱验证码不依赖第三方，输对验证码就证明了「这个邮箱是我的」，
 * 后端据此把「用这个邮箱付过款」的匿名账号认领过来，所以也是找回购买最直接的入口（见 lib/auth.ts 的 email-code provider）。
 *
 * 弹层关着时什么都不渲染；每次打开都是一个全新的实例（状态、预填邮箱都重新取）。
 */
export function SignInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  // 渲染到 body 上：顶栏有 backdrop-blur，会成为 position: fixed 子元素的定位基准，弹层放在顶栏里会被裁成一条细带
  return createPortal(<SignInSheetBody onClose={onClose} />, document.body);
}

function SignInSheetBody({ onClose }: { onClose: () => void }) {
  const t = useTranslations("signIn");
  const locale = useLocale();
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);

  // 挂载即显示且只在客户端点击后才会挂载，所以初始值可以直接读浏览器环境和本地缓存，不会造成 hydration 不一致
  const [inApp] = useState(() => isInAppBrowser());
  const [email, setEmail] = useState(() => getCachedEmail() ?? getSavedCheckoutEmail());
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    trackEvent("sign_in_sheet_shown", { in_app: inApp });
    return () => {
      document.body.style.overflow = prev;
    };
  }, [inApp]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    const value = email.trim();
    if (!isValidEmail(value)) {
      setError("invalidEmail");
      return;
    }
    setBusy("send");
    setError(null);
    try {
      const res = await fetch("/api/email-login/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; retryAfter?: number | null };
      if (res.ok && data.ok) {
        trackEvent("email_code_sent", { step });
        setStep("code");
        setCode("");
        setCooldown(RESEND_SECONDS);
      } else if (res.status === 429 && typeof data.retryAfter === "number" && data.retryAfter > 0) {
        // 刚刚发过：验证码已经在路上，直接去输入，倒计时用后端告诉的剩余秒数
        setStep("code");
        setCooldown(data.retryAfter);
      } else if (res.status === 429) {
        setError("tooMany");
      } else if (res.status === 400) {
        setError("invalidEmail");
      } else {
        setError("sendFailed");
      }
    } catch {
      setError("sendFailed");
    } finally {
      setBusy(null);
    }
  };

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    trackEvent("email_code_requested", { in_app: inApp });
    void sendCode();
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!/^\d{6}$/.test(code)) {
      setError("invalidCode");
      return;
    }
    setBusy("verify");
    setError(null);
    try {
      const res = await signIn("email-code", { email: email.trim(), code, redirect: false });
      if (!res || res.error) {
        trackEvent("email_code_failed", { in_app: inApp });
        setError("invalidCode");
        setBusy(null);
        return;
      }
      trackEvent("sign_in_success", { method: "email_code", in_app: inApp });
      // 和 Google One Tap 登录后一样整页刷新：账号初始化、积分、历史都按新身份重新取
      window.location.reload();
    } catch {
      setError("invalidCode");
      setBusy(null);
    }
  };

  const handleGoogle = () => {
    trackEvent("sign_in_method", { method: "google_sheet" });
    onClose();
    void triggerGoogleSignIn();
  };

  const inputClass =
    // 字号 16px：iOS Safari 对小于 16px 的输入框会在聚焦时自动放大页面
    "mt-1 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-primary";
  const primaryButton =
    "mt-3 flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      tabIndex={-1}
      className="fixed inset-0 z-[260] flex items-end justify-center bg-black/50 outline-none backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-2xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="pr-10 text-lg font-bold">{t("title")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

        {step === "email" && (
          <>
            {inApp ? (
              <p className="mt-4 rounded-lg bg-primary/10 p-3 text-xs text-foreground">{t("inAppHint")}</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  <GoogleLogo />
                  {t("google")}
                </button>
                <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
                  <span className="h-px flex-1 bg-border" />
                  {t("or")}
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <form onSubmit={handleEmailSubmit} noValidate className={inApp ? "mt-3" : ""}>
              <label className="block text-xs font-medium text-muted-foreground" htmlFor="signin-email">
                {t("emailLabel")}
              </label>
              <input
                id="signin-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder={t("emailPlaceholder")}
                aria-invalid={error === "invalidEmail"}
                className={inputClass}
              />
              {error && (
                <p role="alert" className="mt-1 text-xs text-red-500">
                  {t(error)}
                </p>
              )}
              <button type="submit" disabled={busy !== null} className={primaryButton}>
                {busy === "send" ? t("sending") : t("sendCode")}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">{t("emailHint")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("restoreHint")}</p>
            </form>
          </>
        )}

        {step === "code" && (
          <form onSubmit={handleCodeSubmit} noValidate className="mt-4">
            <p className="text-sm text-foreground">{t("codeSent", { email: email.trim(), minutes: CODE_MINUTES })}</p>
            <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="signin-code">
              {t("codeLabel")}
            </label>
            <input
              id="signin-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              aria-invalid={error === "invalidCode"}
              className={`${inputClass} text-center text-2xl font-semibold tracking-[0.5em]`}
            />
            {error && (
              <p role="alert" className="mt-1 text-xs text-red-500">
                {t(error)}
              </p>
            )}
            <button type="submit" disabled={busy !== null || code.length !== 6} className={primaryButton}>
              {busy === "verify" ? t("verifying") : t("verify")}
            </button>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
                className="min-h-10 rounded-full px-2 text-muted-foreground underline-offset-4 hover:underline"
              >
                {t("changeEmail")}
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || busy !== null}
                onClick={() => void sendCode()}
                className="min-h-10 rounded-full px-2 font-medium text-primary underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
