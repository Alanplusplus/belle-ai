"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout";
import { CREDIT_PACKS, isPackProduct, type ProductKey } from "@/lib/constants";
import { usePrices } from "@/lib/usePrices";
import { PaymentTrust } from "@/components/PaymentTrust";
import { InAppBrowserNotice, InAppCheckoutEmailStep } from "@/components/InAppBrowserNotice";
import { detectInAppBrowser } from "@/lib/inAppBrowser";
import { useDialogA11y } from "@/lib/useDialogA11y";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 触发付费墙的场景（锁定报告 / 额度用完 / 2K4K …），用于归因；report_lock 会显示「解锁完整报告」文案 */
  source?: string;
  /** 从锁定报告点进来时，展示这份报告的打码预览缩略图 */
  previewUrl?: string | null;
  /** 从哪份锁定报告进入：买完积分包回到页面后自动解锁它 */
  unlockTaskId?: string | null;
  /** 当前积分包余额：支付返回后据此判断积分是否到账 */
  packCredits?: number;
}

export function PricingModal({ open, onClose, source = "unknown", previewUrl, unlockTaskId, packCredits = 0 }: Props) {
  const t = useTranslations("pricing");
  const tCommon = useTranslations("tryPage");
  const locale = useLocale();
  const { money } = usePrices();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState(false);
  // 在 App 内置浏览器里点付费：先出「保存购买」步骤（填邮箱，可跳过），用户继续后才真正发起结算
  const [inAppWarnProduct, setInAppWarnProduct] = useState<ProductKey | null>(null);

  // 弹层打开时锁定背景滚动，避免手机上在弹层里滑动时底下的页面跟着滚
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 付费漏斗第一步：每次打开付费弹层记一次 view_pricing（/pricing 页在页面里单独记）
  useEffect(() => {
    if (!open) return;
    trackEvent("view_pricing", { source, surface: "modal" });
  }, [open, source]);

  // 弹层无障碍：焦点移入 / Tab 循环 / Esc 关闭 / 关闭后焦点归还
  const dialogRef = useDialogA11y<HTMLDivElement>(() => {
    trackEvent("pricing_modal_closed", { source, had_preview: !!previewUrl });
    setInAppWarnProduct(null);
    onClose();
  }, open);

  if (!open) return null;

  const isLockSource = source === "report_lock";

  const handleClose = () => {
    trackEvent("pricing_modal_closed", { source, had_preview: !!previewUrl });
    setInAppWarnProduct(null);
    onClose();
  };

  const handleCheckout = async (product: ProductKey, confirmedInApp = false, email?: string) => {
    // 「保存购买」步骤里点继续会再调一次本函数，这次不重复记点击
    if (!confirmedInApp) trackEvent("pricing_modal_cta_clicked", { product, source });
    const inApp = detectInAppBrowser();
    if (inApp && !confirmedInApp) {
      trackEvent("inapp_checkout_warned", { product, source, app: inApp });
      setInAppWarnProduct(product);
      return;
    }
    setInAppWarnProduct(null);
    setLoading(product);
    setError(false);
    try {
      await startCheckout({
        product,
        source: `pricing_modal:${source}`,
        locale,
        ...(email ? { email } : {}),
        ...(isPackProduct(product) ? { packBefore: packCredits, ...(unlockTaskId ? { unlockTaskId } : {}) } : {}),
        onRestore: () => setLoading(null),
      });
      // 成功后页面会整页跳转到支付页，保持 loading 状态
    } catch {
      setError(true);
      setLoading(null);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={isLockSource ? t("lockTitle") : t("title")}
      tabIndex={-1}
      className="fixed inset-0 z-[200] flex items-end justify-center outline-none sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* 手机上是贴底的抽屉（拇指够得到购买按钮），桌面保持居中弹窗；用 dvh 避开 iOS 地址栏伸缩造成的裁切 */}
      <div className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-2xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl sm:p-8">
        <button
          onClick={handleClose}
          aria-label={tCommon("close")}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground sm:right-4 sm:top-4"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLockSource && previewUrl ? (
          <div className="flex items-center gap-4 pr-8 text-left">
            {/* 预览图本身已经是服务端打码的，这里只是让用户确认「买的就是这份报告」 */}
            <img src={previewUrl} alt="" className="h-24 w-[72px] shrink-0 rounded-lg border border-border object-cover object-top shadow-sm" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold sm:text-2xl">{t("lockTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("lockSubtitle")}</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold">{isLockSource ? t("lockTitle") : t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{isLockSource ? t("lockSubtitle") : t("subtitle")}</p>
          </div>
        )}

        <InAppBrowserNotice className="mt-3" />

        {/* 订阅是主推：周订阅（首周优惠）最醒目。价格区与 /pricing 页一致：大号显示首周优惠价，原价放在说明里 */}
        <div className="relative mt-6 rounded-xl border-2 border-primary bg-card p-5 shadow-md">
          <span className="absolute -top-3 left-5 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
            {t("weeklyRecommendedBadge")}
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-lg font-bold">{t("weekly")}</h3>
            <p className="text-right">
              <span className="text-3xl font-bold text-primary">{money("weeklyIntro")}</span>
              <span className="text-sm text-muted-foreground"> / {t("weeklyIntroLabel")}</span>
            </p>
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">{t("weeklyThen", { price: money("weekly") })}</p>
          {/* 手机上也要看到订阅包含什么：只收起次要的两条 */}
          <ul className="mt-3 space-y-1.5">
            <ModalFeature text={t("weeklyFeature1")} />
            <ModalFeature text={t("weeklyFeature2")} className="max-sm:hidden" />
            <ModalFeature text={t("weeklyFeature3")} />
            <ModalFeature text={t("weeklyFeature4")} className="max-sm:hidden" />
          </ul>
          <button
            onClick={() => handleCheckout("weekly")}
            disabled={loading !== null}
            className="mt-4 min-h-12 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            {loading === "weekly" ? <LoadingDots /> : t("weeklyCta", { price: money("weeklyIntro") })}
          </button>
        </div>

        {/* Yearly：权益和周订阅相同，所以只用紧凑的一行：折合每周的价格 + 省多少 */}
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-bold">{t("yearly")}</h3>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                {t("yearlyBadge")}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {money("yearly")} {t("yearlyPer")} · {t("yearlyPerWeek", { price: money("yearlyPerWeek") })}
            </p>
          </div>
          <button
            onClick={() => handleCheckout("yearly")}
            disabled={loading !== null}
            className="min-h-11 shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {loading === "yearly" ? <LoadingDots /> : t("yearlyCta")}
          </button>
        </div>

        {/* 积分包：一次性付费、不绑订阅，给不想订阅的人；30 积分更划算 */}
        <p className="mt-6 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("orPack")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(["pack", "pack30"] as const).map((key) => {
            const { credits } = CREDIT_PACKS[key];
            const price = money(key);
            return (
              <div key={key} className="relative rounded-xl border border-border bg-card p-4">
                {key === "pack30" && (
                  <span className="absolute -top-2.5 right-3 whitespace-nowrap rounded-full bg-green-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {t("packSaveBadge", { percent: money("pack30:savePercent") })}
                  </span>
                )}
                <h3 className="text-sm font-bold">{t("packTitle", { credits })}</h3>
                <p className="mt-1 text-xl font-bold">{price}</p>
                <p className="text-xs text-muted-foreground">{t("packPerReport", { price: money(`${key}:perReport` as "pack:perReport" | "pack30:perReport") })}</p>
                <button
                  onClick={() => handleCheckout(key)}
                  disabled={loading !== null}
                  className="mt-3 min-h-11 w-full rounded-full border border-primary px-2 py-2 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
                >
                  {loading === key ? <LoadingDots /> : t("packCta", { credits, price })}
                </button>
              </div>
            );
          })}
        </div>
        {/* 从锁定报告点进来：买积分包能顺手把这份报告解锁，这点要说清楚 */}
        {isLockSource && <p className="mt-2 text-center text-xs font-medium text-foreground">{t("packFeature2")}</p>}
        <p className="mt-2 text-center text-xs text-muted-foreground">{t("packNote")} {t("packCostNote")}</p>

        {/* 支付信任信息：离购买按钮最近的地方说清「怎么付、安不安全」 */}
        <PaymentTrust className="mt-4" />

        {inAppWarnProduct && (
          <InAppCheckoutEmailStep onContinue={(email) => handleCheckout(inAppWarnProduct, true, email)} />
        )}

        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-red-500">
            {t("checkoutError")}
          </p>
        )}

        {/* 保障条：手机上也常驻，付款前最后一眼看到的是「随时取消 / 隐私 / 不用注册」 */}
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          <ModalFeature text={t("guaranteeCancelTitle")} />
          <ModalFeature text={t("guaranteePrivacyTitle")} />
          <ModalFeature text={t("guaranteeNoAccountTitle")} />
        </ul>
        <p className="mt-3 text-center text-xs text-muted-foreground">{t("billingNote")}</p>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">{t("aiDisclosure")}</p>
      </div>
    </div>
  );
}

function ModalFeature({ text, className = "" }: { text: string; className?: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {text}
    </li>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}
