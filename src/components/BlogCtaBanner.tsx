"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

/**
 * 博客里的 CTA 统一带上「文章 slug + 目标工具」：
 * href 已经按文章主题预选了对应的分析类型（/try?type=...），事件里记录来源文章，
 * 之后可以在 GA 里直接看「哪篇文章带来了多少点击 / 付费」。
 */
const TOP_CTA_ID = "blog-cta-top";
const BOTTOM_CTA_ID = "blog-cta-bottom";

interface CtaTarget {
  href: string;
  postSlug: string;
  toolType: string;
}

/**
 * 文章顶部的 CTA：直接搜索 / Pinterest 进来的读者首屏就能看到入口，不用滚动。
 * 带上该工具的示例报告缩略图，让人一眼知道「点进去会得到什么」。
 * 它离开视口之后，由底部吸附条接力（StickyBottomCta），保证任何时候屏幕上都有且只有一个主入口。
 */
export function TopCta({
  title,
  description,
  note,
  tryItFree,
  toolLabel,
  image,
  target,
}: {
  title: string;
  description: string;
  note: string;
  tryItFree: string;
  toolLabel: string;
  image: string;
  target: CtaTarget;
}) {
  const track = () =>
    trackEvent("blog_cta_click", { cta_location: "top", post: target.postSlug, tool: target.toolType });

  return (
    <div
      id={TOP_CTA_ID}
      className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 sm:flex-nowrap sm:gap-4 sm:p-4"
    >
      <Link href={target.href} onClick={track} tabIndex={-1} aria-hidden="true" className="shrink-0">
        <Image
          src={image}
          alt=""
          width={60}
          height={80}
          className="h-20 w-[60px] rounded-lg border border-border/60 object-cover object-top shadow-sm sm:h-24 sm:w-[72px]"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {toolLabel}
        </span>
        <p className="mt-1 text-sm font-bold leading-snug sm:text-base">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{description}</p>
      </div>
      <div className="flex w-full flex-col items-center gap-1 sm:w-auto">
        <Link
          href={target.href}
          onClick={track}
          className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark sm:w-auto"
        >
          {tryItFree} →
        </Link>
        <span className="text-[11px] text-muted-foreground">{note}</span>
      </div>
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
    <div id={BOTTOM_CTA_ID} className="mt-16 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
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
  const tt = useTranslations("tryPage");
  // 顶部 CTA 还在视口里时不显示，避免首屏同时出现两个一样的按钮；顶部 CTA 一滚出视口就接力
  const [topInView, setTopInView] = useState(true);
  // 滚到（或已经滚过）文章底部的 CTA 卡片后收起，不遮挡相关文章 / 页脚
  const [bottomReached, setBottomReached] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target.id === TOP_CTA_ID) {
          setTopInView(entry.isIntersecting);
        } else if (entry.target.id === BOTTOM_CTA_ID) {
          setBottomReached(entry.isIntersecting || entry.boundingClientRect.top < 0);
        }
      }
    });
    for (const id of [TOP_CTA_ID, BOTTOM_CTA_ID]) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const visible = !topInView && !bottomReached;

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
              aria-label={tt("close")}
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
