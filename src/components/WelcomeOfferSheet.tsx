"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { triggerGoogleSignIn } from "@/lib/google-signin";
import { openCheckout } from "@creem_io/embed";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "belle_welcome_offer_seen";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WelcomeOfferSheet({ open, onClose }: Props) {
  const t = useTranslations("welcomeOffer");
  const { status } = useSession();
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
    if (status !== "authenticated") {
      triggerGoogleSignIn();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "credits5" }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        openCheckout({
          checkoutUrl: data.checkoutUrl,
          theme: "light",
          onComplete: () => {
            trackEvent("welcome_offer_completed");
            handleDismiss();
            window.location.reload();
          },
        });
      }
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
          {/* Sparkle icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c78fad]/20 to-[#c7a87d]/20">
            <svg className="h-7 w-7 text-[#c78fad]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
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
                <p className="text-sm font-medium text-foreground">{t("packDesc")}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground line-through">{t("originalPrice")}</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-[#c78fad] to-[#c7a87d] bg-clip-text text-transparent">
                    {t("offerPrice")}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-gradient-to-r from-[#c78fad] to-[#c7a87d] px-3 py-1 text-xs font-bold text-white">
                {t("discountBadge")}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("firstPurchase")}</p>
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
