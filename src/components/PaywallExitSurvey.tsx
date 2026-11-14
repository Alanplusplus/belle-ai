"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitPaywallSurvey, trackEvent, type PaywallSurveyReason } from "@/lib/analytics";
import { getCachedUserId } from "@/lib/api";
import { EXIT_SURVEY_ENABLED } from "@/lib/constants";

/** 付费弹窗被用户关掉（没去付款）时由 PricingModal 派发：detail = { source, offer } */
export const PAYWALL_EXIT_EVENT = "belle:paywall-exit";
/** 付费弹窗又被打开：正在显示的调查条立刻收起，不和弹窗抢注意力 */
export const PAYWALL_OPEN_EVENT = "belle:paywall-open";

const SHOWN_KEY = "belle_paywall_survey_at";
/** 同一个浏览器 7 天内最多问一次：问过（不管答没答）都算 */
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
/** 关闭弹窗后稍等一下再出现，让用户先看清页面回到了哪 */
const SHOW_DELAY_MS = 700;
/** 没人理就自己收起，不一直挂在屏幕上 */
const IDLE_HIDE_MS = 25_000;
const THANKS_MS = 2400;

const OPTIONS: { reason: PaywallSurveyReason; key: string }[] = [
  { reason: "price", key: "exitSurveyPrice" },
  { reason: "enough", key: "exitSurveyEnough" },
  { reason: "accuracy", key: "exitSurveyAccuracy" },
  { reason: "looking", key: "exitSurveyLooking" },
];

function inCooldown(): boolean {
  try {
    const last = Number(localStorage.getItem(SHOWN_KEY) || 0);
    return Number.isFinite(last) && Date.now() - last < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markShown() {
  try {
    localStorage.setItem(SHOWN_KEY, String(Date.now()));
  } catch {
    /* localStorage 不可用时忽略：最多是多问几次 */
  }
}

/**
 * 关闭付费弹窗后的一问式调查「是什么让你犹豫了」：四个固定选项，点一下就结束，不弹第二个对话框。
 * 样本太小做不了 A/B，这个是用来区分「价格太高」和「免费内容已经够用」这两个假设的定性证据。
 * 只问还没买过的人；每个浏览器 7 天最多一次；NEXT_PUBLIC_EXIT_SURVEY=1 才启用。
 */
export function PaywallExitSurvey() {
  const t = useTranslations("kit");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [answered, setAnswered] = useState(false);
  const context = useRef<{ source: string; offer: string }>({ source: "unknown", offer: "kit" });
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimer.current != null) window.clearTimeout(showTimer.current);
    if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  }, []);

  const close = useCallback(() => {
    clearTimers();
    setOpen(false);
  }, [clearTimers]);

  useEffect(() => {
    if (!EXIT_SURVEY_ENABLED) return;

    const onExit = (event: Event) => {
      if (inCooldown()) return;
      const detail = (event as CustomEvent<{ source?: string; offer?: string }>).detail ?? {};
      context.current = { source: detail.source || "unknown", offer: detail.offer || "kit" };
      clearTimers();
      showTimer.current = window.setTimeout(() => {
        markShown();
        setAnswered(false);
        setOpen(true);
        trackEvent("paywall_exit_survey_shown", { source: context.current.source, offer: context.current.offer });
        hideTimer.current = window.setTimeout(() => setOpen(false), IDLE_HIDE_MS);
      }, SHOW_DELAY_MS);
    };
    const onPricingOpen = () => close();

    window.addEventListener(PAYWALL_EXIT_EVENT, onExit);
    window.addEventListener(PAYWALL_OPEN_EVENT, onPricingOpen);
    return () => {
      window.removeEventListener(PAYWALL_EXIT_EVENT, onExit);
      window.removeEventListener(PAYWALL_OPEN_EVENT, onPricingOpen);
      clearTimers();
    };
  }, [clearTimers, close]);

  const answer = (reason: PaywallSurveyReason) => {
    clearTimers();
    submitPaywallSurvey({ userId: getCachedUserId(), reason, source: context.current.source, offer: context.current.offer, locale });
    setAnswered(true);
    hideTimer.current = window.setTimeout(() => setOpen(false), THANKS_MS);
  };

  const dismiss = () => {
    trackEvent("paywall_exit_survey_dismissed", { source: context.current.source, offer: context.current.offer });
    close();
  };

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[220] flex justify-center px-3 max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div
        role="group"
        aria-label={t("exitSurveyTitle")}
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-background p-3.5 shadow-xl"
      >
        {answered ? (
          <p role="status" className="py-1 text-center text-sm text-foreground">
            {t("exitSurveyThanks")}
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{t("exitSurveyTitle")}</p>
              <button
                type="button"
                onClick={dismiss}
                aria-label={t("exitSurveyClose")}
                className="-mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OPTIONS.map(({ reason, key }) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => answer(reason)}
                  className="min-h-11 rounded-xl border border-border px-3 py-2 text-left text-sm leading-snug text-foreground transition hover:border-primary/60 hover:bg-primary/5"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
