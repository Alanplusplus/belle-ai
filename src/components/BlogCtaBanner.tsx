"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

/**
 * 博客里的 CTA 统一带上「文章 slug + 目标工具」：
 * href 已经按文章主题预选了对应的分析类型（/try?type=...），事件里记录来源文章，
 * 之后可以在 GA 里直接看「哪篇文章带来了多少点击 / 付费」。
 */
interface CtaTarget {
  href: string;
  postSlug: string;
  toolType: string;
}

export function InlineCta({
  after,
  inlineCtaTitle,
  inlineCtaDesc,
  tryItFree,
  toolLabel,
  target,
}: {
  after: string | null;
  inlineCtaTitle: string;
  inlineCtaDesc: string;
  tryItFree: string;
  toolLabel: string;
  target: CtaTarget;
}) {
  if (!after) return null;

  return (
    <div className="my-10 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent p-6 sm:flex sm:items-center sm:gap-6 sm:text-left">
      <div className="flex-1">
        <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {toolLabel}
        </span>
        <p className="mt-2 text-base font-bold">{inlineCtaTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{inlineCtaDesc}</p>
      </div>
      <Link
        href={target.href}
        className="mt-4 inline-block whitespace-nowrap rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark sm:mt-0"
        onClick={() =>
          trackEvent("blog_cta_click", { cta_location: "inline", post: target.postSlug, tool: target.toolType })
        }
      >
        {tryItFree} →
      </Link>
    </div>
  );
}

export function BottomCta({
  title,
  description,
  tryItFree,
  toolLabel,
  target,
}: {
  title: string;
  description: string;
  tryItFree: string;
  toolLabel: string;
  target: CtaTarget;
}) {
  return (
    <div className="mt-16 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {toolLabel}
      </span>
      <h3 className="mt-2 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Link
        href={target.href}
        className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        onClick={() =>
          trackEvent("blog_cta_click", { cta_location: "bottom", post: target.postSlug, tool: target.toolType })
        }
      >
        {tryItFree}
      </Link>
    </div>
  );
}

export function StickyBottomCta({ target }: { target: CtaTarget }) {
  const t = useTranslations("blog");
  const ft = useTranslations("features");
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      const scrollPercent = scrollY / Math.max(1, docHeight - viewHeight);
      // 手机上多数人读到 30% 之前就离开了，所以把出现时机提前到约 12%
      setVisible(scrollPercent > 0.12 && scrollPercent < 0.92);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="border-t border-primary/20 bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium leading-tight">
              {t("stickyCtaText")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={target.href}
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark hover:shadow-lg"
              onClick={() =>
                trackEvent("blog_cta_click", { cta_location: "sticky_bottom", post: target.postSlug, tool: target.toolType })
              }
            >
              {ft("tryItFree")}
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
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
