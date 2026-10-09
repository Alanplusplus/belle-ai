"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout";
import { WEEKLY_INTRO_PRICE, type ProductKey } from "@/lib/constants";
import { InAppBrowserNotice } from "@/components/InAppBrowserNotice";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 触发付费墙的场景（下载 / 水印条幅 / 2K4K / 额度用完 …），用于归因 */
  source?: string;
}

export function PricingModal({ open, onClose, source = "unknown" }: Props) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // 弹层打开时锁定背景滚动，避免手机上在弹层里滑动时底下的页面跟着滚
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleCheckout = async (product: ProductKey) => {
    trackEvent("pricing_modal_cta_clicked", { product, source });
    setLoading(product);
    setError(false);
    try {
      await startCheckout({
        product,
        source: `pricing_modal:${source}`,
        locale,
        onRestore: () => setLoading(null),
      });
      // 成功后页面会整页跳转到支付页，保持 loading 状态
    } catch {
      setError(true);
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 手机上是贴底的抽屉（拇指够得到购买按钮），桌面保持居中弹窗；用 dvh 避开 iOS 地址栏伸缩造成的裁切 */}
      <div className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-2xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl sm:p-8">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground sm:right-4 sm:top-4"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <InAppBrowserNotice className="mt-3" />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* Weekly */}
          <div className="rounded-xl border-2 border-primary bg-card p-5">
            <h3 className="text-lg font-bold">{t("weekly")}</h3>
            <div className="mt-2 flex justify-center">
              <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white">
                {t("weeklyIntroBadge", { price: WEEKLY_INTRO_PRICE })}
              </span>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">{t("weeklyIntroNote", { price: WEEKLY_INTRO_PRICE })}</p>
            <ul className="mt-3 space-y-1.5">
              <ModalFeature text={t("weeklyFeature1")} />
              <ModalFeature text={t("weeklyFeature2")} />
              <ModalFeature text={t("weeklyFeature3")} />
              <ModalFeature text={t("weeklyFeature4")} />
            </ul>
            <button
              onClick={() => handleCheckout("weekly")}
              disabled={loading !== null}
              className="mt-4 min-h-12 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {loading === "weekly" ? <LoadingDots /> : t("weeklyCta", { price: WEEKLY_INTRO_PRICE })}
            </button>
          </div>

          {/* Yearly */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-bold">{t("yearly")}</h3>
            <div className="mt-2 flex justify-center">
              <span className="rounded-full bg-muted px-4 py-1.5 text-sm font-bold text-muted-foreground">
                {t("yearlyBadge")}
              </span>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">{t("yearlyPrice")} {t("yearlyPer")}</p>
            <ul className="mt-3 hidden space-y-1.5 sm:block">
              <ModalFeature text={t("yearlyFeature1")} />
              <ModalFeature text={t("yearlyFeature2")} />
              <ModalFeature text={t("yearlyFeature3")} />
              <ModalFeature text={t("yearlyFeature4")} />
            </ul>
            <button
              onClick={() => handleCheckout("yearly")}
              disabled={loading !== null}
              className="mt-4 min-h-12 w-full rounded-full border border-primary py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
            >
              {loading === "yearly" ? <LoadingDots /> : t("yearlyCta")}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-red-500">
            {t("checkoutError")}
          </p>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">{t("billingNote")}</p>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">{t("aiDisclosure")}</p>
      </div>
    </div>
  );
}

function ModalFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
