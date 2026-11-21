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
  /** 「先看示例」入口：落地 /try 就是该工具的完整示例（?sample=1） */
  sampleHref: string;
  postSlug: string;
  toolType: string;
}

/**
 * 文章顶部的 CTA：直接搜索 / Pinterest 进来的读者首屏就能看到入口，不用滚动。
 * 带上该工具的示例报告缩略图，让人一眼知道「点进去会得到什么」。
 * 它离开视口之后，由底部吸附条接力（StickyBottomCta），保证任何时候屏幕上都有且只有一个主入口。
 *
 * 文案只有两样：一句话标题（点进去做什么 → 得到什么）+ 一个贴着内容的按钮，按文章对应的工具各写一套
 * （messages 的 blog.cta.<toolType>）。读者不熟悉这个网站，所以不放类型标签，也不放副标题。
 */
export function TopCta({
  title,
  button,
  note,
  sampleLabel,
  image,
  target,
}: {
  title: string;
  button: string;
  note: string;
  sampleLabel: string;
  image: string;
  target: CtaTarget;
}) {
  const track = () =>
    trackEvent("blog_cta_click", { cta_location: "top", post: target.postSlug, tool: target.toolType });
  const trackSample = () =>
    trackEvent("blog_cta_click", { cta_location: "top_sample", post: target.postSlug, tool: target.toolType });

  return (
    // 手机：左边大图（示例报告要看得清）+ 右边一列「标题 / 按钮 / 示例链接 / 提示」；
    // 桌面：缩略图 | 标题 | 按钮一行排开。
    <div
      id={TOP_CTA_ID}
      className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 sm:items-center sm:gap-4 sm:p-4"
    >
      <Link href={target.href} onClick={track} tabIndex={-1} aria-hidden="true" className="shrink-0">
        <Image
          src={image}
          alt=""
          width={240}
          height={320}
          sizes="(min-width: 640px) 72px, 128px"
          className="h-[10.5rem] w-32 rounded-lg border border-border/60 object-cover object-top shadow-sm sm:h-24 sm:w-[72px]"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-[15px] font-bold leading-snug sm:flex-1 sm:text-lg">{title}</p>
        <div className="flex flex-col items-center gap-1.5 sm:shrink-0 sm:gap-1">
          <Link
            href={target.href}
            onClick={track}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold leading-tight text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark sm:w-auto sm:whitespace-nowrap sm:px-6 sm:py-2.5"
          >
            {button} →
          </Link>
          <Link
            href={target.sampleHref}
            onClick={trackSample}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            {sampleLabel}
          </Link>
          <span className="text-center text-[11px] text-muted-foreground">{note}</span>
        </div>
      </div>
    </div>
  );
}

/** 文章底部的 CTA：和顶部同一套文案（一句话标题 + 带结果的按钮），不再放类型标签和副标题。 */
export function BottomCta({
  title,
  button,
  note,
  sampleLabel,
  target,
}: {
  title: string;
  button: string;
  note: string;
  sampleLabel: string;
  target: CtaTarget;
}) {
  return (
    <div id={BOTTOM_CTA_ID} className="mt-16 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
      <h3 className="mx-auto max-w-xl text-lg font-bold leading-snug sm:text-xl">{title}</h3>
      <Link
        href={target.href}
        className="mt-5 inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark"
        onClick={() =>
          trackEvent("blog_cta_click", { cta_location: "bottom", post: target.postSlug, tool: target.toolType })
        }
      >
        {button} →
      </Link>
      <div className="mt-3">
        <Link
          href={target.sampleHref}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={() =>
            trackEvent("blog_cta_click", { cta_location: "bottom_sample", post: target.postSlug, tool: target.toolType })
          }
        >
          {sampleLabel}
        </Link>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

/**
 * 吸底条只放一个按钮：窄屏放不下「一句话标题 + 按钮」，而按钮文案本身已经写明结果（和顶部 / 底部 CTA 同一句）。
 */
export function StickyBottomCta({ target, button }: { target: CtaTarget; button: string }) {
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
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            href={target.href}
            className="inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark hover:shadow-lg sm:max-w-sm"
            onClick={() =>
              trackEvent("blog_cta_click", { cta_location: "sticky_bottom", post: target.postSlug, tool: target.toolType })
            }
          >
            {button} →
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
            aria-label={tt("close")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
