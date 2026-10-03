"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent, trackCheckoutEvent } from "@/lib/analytics";
import { getCachedUserId, webInit } from "@/lib/api";
import type { ProductKey } from "@/lib/constants";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PricingModal({ open, onClose }: Props) {
  const t = useTranslations("pricing");
  const [loading, setLoading] = useState<string | null>(null);

  if (!open) return null;

  const handleCheckout = async (product: ProductKey) => {
    trackEvent("pricing_modal_cta_clicked", { product });
    setLoading(product);
    trackCheckoutEvent("checkout_started", { product, source: "pricing_modal" });
    try {
      let userId = getCachedUserId();
      if (!userId) {
        const initRes = await webInit();
        if (initRes.code === 200 && initRes.data) {
          userId = initRes.data.user_id;
        }
      }
      if (!userId) {
        alert("Please try again.");
        return;
      }

      const res = await fetch("/api/waffo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, userId }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Checkout failed");
      }
      window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");

      trackCheckoutEvent("checkout_opened", { product, source: "pricing_modal" });
    } catch {
      /* ignore */
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* Weekly */}
          <div className="rounded-xl border-2 border-primary bg-card p-5">
            <h3 className="text-lg font-bold">{t("weekly")}</h3>
            <div className="mt-2 flex justify-center">
              <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white">
                {t("weeklyTrialBadge")}
              </span>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">{t("weeklyTrialNote")}</p>
            <ul className="mt-3 space-y-1.5">
              <ModalFeature text={t("weeklyFeature1")} />
              <ModalFeature text={t("weeklyFeature2")} />
              <ModalFeature text={t("weeklyFeature3")} />
              <ModalFeature text={t("weeklyFeature4")} />
            </ul>
            <button
              onClick={() => handleCheckout("weekly")}
              disabled={loading !== null}
              className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {loading === "weekly" ? <LoadingDots /> : t("weeklyCta")}
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
            <ul className="mt-3 space-y-1.5">
              <ModalFeature text={t("yearlyFeature1")} />
              <ModalFeature text={t("yearlyFeature2")} />
              <ModalFeature text={t("yearlyFeature3")} />
              <ModalFeature text={t("yearlyFeature4")} />
            </ul>
            <button
              onClick={() => handleCheckout("yearly")}
              disabled={loading !== null}
              className="mt-4 w-full rounded-full border border-primary py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
            >
              {loading === "yearly" ? <LoadingDots /> : t("yearlyCta")}
            </button>
          </div>
        </div>
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
