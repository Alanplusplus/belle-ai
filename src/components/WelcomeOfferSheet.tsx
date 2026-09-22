"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { trackEvent, trackCheckoutEvent } from "@/lib/analytics";
import { getCachedUserId, webInit } from "@/lib/api";

const STORAGE_KEY = "belle_welcome_offer_seen";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WelcomeOfferSheet({ open, onClose }: Props) {
  const t = useTranslations("welcomeOffer");
  const [loading, setLoading] = useState(false);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (open && !trackedRef.current) {
      trackedRef.current = true;
      trackEvent("welcome_offer_shown");
    }
  }, [open]);

  if (!open) return null;

  const handleDismiss = () => {
    trackEvent("welcome_offer_dismissed");
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    onClose();
  };

  const handleClaim = async () => {
    trackEvent("welcome_offer_cta_clicked");

    setLoading(true);
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
        body: JSON.stringify({ product: "weekly", userId }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Checkout failed");
      }
      window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
      trackCheckoutEvent("checkout_opened", { product: "weekly", source: "welcome_offer" });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleDismiss}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-background border border-border shadow-2xl animate-in slide-in-from-bottom duration-500 ease-out">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pb-8 pt-8 sm:px-8">
          {/* Crown icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c78fad]/20 to-[#c7a87d]/20">
            <svg className="h-7 w-7 text-[#c78fad]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 18l3-12 6 6 6-6 3 12H3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="mt-5 text-center text-2xl font-bold bg-gradient-to-r from-[#c78fad] to-[#c7a87d] bg-clip-text text-transparent">
            {t("title")}
          </h2>
          <p className="mt-1.5 text-center text-sm text-muted-foreground">
            {t("subtitle")}
          </p>

          {/* Offer card */}
          <div className="mt-6 rounded-xl border-2 border-transparent bg-gradient-to-br from-[#c78fad]/5 to-[#c7a87d]/5 p-5 ring-1 ring-[#c78fad]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">{t("planName")}</p>
                <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-[#c78fad] to-[#c7a87d] bg-clip-text text-transparent">
                  {t("planPrice")}
                </p>
              </div>
              <span className="rounded-full bg-gradient-to-r from-[#c78fad] to-[#c7a87d] px-3 py-1 text-xs font-bold text-white">
                {t("trialBadge")}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t("planDesc")}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t("trialNote")}</p>
          </div>

          {/* Free reminder */}
          <p className="mt-5 text-center text-xs text-muted-foreground">
            {t("freeReminder")}
          </p>

          {/* CTA */}
          <button
            onClick={handleClaim}
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#c78fad] to-[#c7a87d] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#c78fad]/25 transition hover:shadow-xl hover:shadow-[#c78fad]/30 disabled:opacity-50"
          >
            {loading ? (
              <LoadingDots />
            ) : (
              <>
                {t("cta")}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>

          {/* Skip */}
          <button
            onClick={handleDismiss}
            className="mt-3 w-full text-center text-sm text-muted-foreground transition hover:text-foreground"
          >
            {t("skip")}
          </button>
        </div>
      </div>
    </div>
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
