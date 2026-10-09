"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getStoredReferralCode, storeReferralCode } from "@/lib/referral";

export function ReferralBanner() {
  const t = useTranslations("referral");
  const [refCode, setRefCode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      storeReferralCode(ref);
    }
    const code = getStoredReferralCode();
    const wasDismissed = sessionStorage.getItem("ref_banner_dismissed");
    if (code && !wasDismissed) {
      setRefCode(code);
    }
  }, []);

  if (!refCode || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("ref_banner_dismissed", "1");
  };

  return (
    <div className="relative bg-gradient-to-r from-primary to-primary-dark py-2.5 pl-4 pr-12 text-center text-[13px] leading-snug text-white sm:text-sm">
      <p>
        🎁 {t("bannerText")}
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/20"
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
