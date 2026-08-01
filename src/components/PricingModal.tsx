"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { triggerGoogleSignIn } from "@/lib/google-signin";
import { openCheckout } from "@creem_io/embed";
import { trackEvent } from "@/lib/analytics";
import type { CreemProductKey } from "@/lib/constants";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PricingModal({ open, onClose }: Props) {
  const t = useTranslations("pricing");
  const { status } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  if (!open) return null;

  const handleCheckout = async (product: CreemProductKey) => {
    trackEvent("pricing_modal_cta_clicked", { product });
    if (status !== "authenticated") {
      trackEvent("sign_in_prompted", { trigger: "pricing_modal" });
      triggerGoogleSignIn();
      return;
    }

    setLoading(product);
    trackEvent("checkout_started", { product, source: "pricing_modal" });
    try {
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        openCheckout({
          checkoutUrl: data.checkoutUrl,
          theme: "light",
          onComplete: () => {
            trackEvent("checkout_completed", { product, source: "pricing_modal" });
            window.location.reload();
          },
        });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl sm:p-8">
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Yearly */}
          <div className="relative rounded-xl border-2 border-primary bg-card p-5">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-white">
              {t("yearlyBadge")}
            </span>
            <h3 className="text-lg font-bold">{t("yearly")}</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">{t("yearlyPrice")}</span>
              <span className="text-sm text-muted-foreground">{t("yearlyPer")}</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              <ModalFeature text={t("yearlyFeature1")} />
              <ModalFeature text={t("yearlyFeature2")} />
              <ModalFeature text={t("yearlyFeature3")} />
            </ul>
            <button
              onClick={() => handleCheckout("yearly")}
              disabled={loading !== null}
              className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {loading === "yearly" ? <LoadingDots /> : t("yearlyCta")}
            </button>
          </div>

          {/* Monthly */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-bold">{t("monthly")}</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">{t("monthlyPrice")}</span>
              <span className="text-sm text-muted-foreground">{t("monthlyPer")}</span>
            </div>
            <p className="mt-1 text-xs font-medium text-green-600">{t("monthlyFirstMonth")}</p>
            <ul className="mt-3 space-y-1.5">
              <ModalFeature text={t("monthlyFeature1")} />
              <ModalFeature text={t("monthlyFeature2")} />
              <ModalFeature text={t("monthlyFeature3")} />
            </ul>
            <button
              onClick={() => handleCheckout("monthly")}
              disabled={loading !== null}
              className="mt-4 w-full rounded-full border border-primary py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
            >
              {loading === "monthly" ? <LoadingDots /> : t("monthlyCta")}
            </button>
          </div>
        </div>

        {/* Credit Packs */}
        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">{t("credits")}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{t("smallPack")}</p>
                <p className="text-lg font-bold text-primary">{t("smallPrice")}</p>
              </div>
              <button
                onClick={() => handleCheckout("credits5")}
                disabled={loading !== null}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {loading === "credits5" ? <LoadingDots /> : t("creditsCta")}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{t("largePack")}</p>
                <p className="text-lg font-bold text-primary">{t("largePrice")}</p>
              </div>
              <button
                onClick={() => handleCheckout("credits12")}
                disabled={loading !== null}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {loading === "credits12" ? <LoadingDots /> : t("creditsCta")}
              </button>
            </div>
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
