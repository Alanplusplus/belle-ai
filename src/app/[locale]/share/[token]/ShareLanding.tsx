"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import { storeReferralCode } from "@/lib/referral";

/**
 * 访客打开分享页时：
 * 1. 把分享人的邀请码写进本地（即使访客没点按钮、稍后直接去 /try，也能归因给分享人）
 * 2. 记录一次分享页曝光
 */
export function ShareLandingTracker({
  referralCode,
  type,
}: {
  referralCode: string | null;
  type: string;
}) {
  useEffect(() => {
    if (referralCode) storeReferralCode(referralCode);
    trackEvent("share_page_view", { type, has_ref: Boolean(referralCode) });
  }, [referralCode, type]);

  return null;
}

export function ShareCtaButton({
  referralCode,
  type,
  children,
}: {
  referralCode: string | null;
  type: string;
  children: React.ReactNode;
}) {
  const query = new URLSearchParams({
    ...(referralCode ? { ref: referralCode } : {}),
    utm_source: "share",
    utm_medium: "result_page",
    utm_campaign: "viral",
  });

  return (
    <Link
      href={`/try?${query.toString()}`}
      onClick={() => trackEvent("share_page_cta_click", { type })}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
    >
      {children}
    </Link>
  );
}
