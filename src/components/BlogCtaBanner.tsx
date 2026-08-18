"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

export function InlineCta({
  after,
  inlineCtaTitle,
  inlineCtaDesc,
  tryItFree,
}: {
  after: string | null;
  inlineCtaTitle: string;
  inlineCtaDesc: string;
  tryItFree: string;
}) {
  if (!after) return null;

  return (
    <div className="my-10 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent p-6 sm:flex sm:items-center sm:gap-6 sm:text-left">
      <div className="flex-1">
        <p className="text-base font-bold">{inlineCtaTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{inlineCtaDesc}</p>
      </div>
      <Link
        href="/try"
        className="mt-4 inline-block whitespace-nowrap rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark sm:mt-0"
        onClick={() => trackEvent("blog_cta_click", { cta_location: "inline" })}
      >
        {tryItFree} →
      </Link>
    </div>
  );
}

export function StickyBottomCta() {
  const t = useTranslations("blog");
  const ft = useTranslations("features");
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      const scrollPercent = scrollY / (docHeight - viewHeight);
      setVisible(scrollPercent > 0.3 && scrollPercent < 0.9);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="border-t border-primary/20 bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {t("stickyCtaText")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/try"
              className="whitespace-nowrap rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark hover:shadow-lg"
              onClick={() => trackEvent("blog_cta_click", { cta_location: "sticky_bottom" })}
            >
              {ft("tryItFree")}
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
