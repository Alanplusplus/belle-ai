"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";

/** 访客打开分享页时记录一次分享页曝光 */
export function ShareLandingTracker({ type }: { type: string }) {
  useEffect(() => {
    trackEvent("share_page_view", { type });
  }, [type]);

  return null;
}

export function ShareCtaButton({
  type,
  children,
}: {
  type: string;
  children: React.ReactNode;
}) {
  const query = new URLSearchParams({
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
