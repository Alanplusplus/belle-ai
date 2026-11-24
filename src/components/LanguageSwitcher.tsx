"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_NAMES } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

/**
 * 所有语言的链接（点击后切换到当前页面的这个语言版本）。
 * 语言切换对普通用户是很低频的操作（线上约 1% 的用户用过），所以不再占顶栏位置：
 * 放在页脚、头像菜单底部、手机菜单底部，三处共用这一个组件，只是排版不同（容器 / 按钮样式由调用方给）。
 * source 记在 language_switched 事件里，之后能直接看哪个入口在被用。
 */
export function LanguageLinks({
  source,
  className,
  itemClassName,
  onNavigate,
}: {
  source: string;
  className?: string;
  itemClassName: (active: boolean) => string;
  onNavigate?: () => void;
}) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  return (
    <div className={className}>
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname || "/"}
          locale={l}
          aria-current={l === locale ? "true" : undefined}
          className={itemClassName(l === locale)}
          onClick={() => {
            trackEvent("language_switched", { from: locale, to: l, source });
            onNavigate?.();
          }}
        >
          {LOCALE_NAMES[l]}
        </Link>
      ))}
    </div>
  );
}

export function GlobeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

/**
 * 页脚的语言菜单：一个按钮，点开才列出语言（向上展开）。
 * 刻意不把 9 个语言链接直接写进页脚：博客里有的文章只有部分语种，每个页面的页脚都带一排静态的语言链接，
 * 会给搜索引擎暴露一堆并不存在的地址（routing.ts 里为了精确控制 hreflang 也特意关掉了自动的 alternate 链接）。
 * 点开才渲染链接，和以前顶栏的做法一致，对抓取没有任何变化。
 */
export function FooterLanguage() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("language")}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        <GlobeIcon className="h-3.5 w-3.5" />
        {LOCALE_NAMES[locale]}
        <svg className={`h-2.5 w-2.5 transition ${open ? "" : "rotate-180"}`} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-10 mb-2 w-[18rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-border bg-card p-2 shadow-lg sm:left-auto sm:right-0 sm:translate-x-0">
          <LanguageLinks
            source="footer"
            className="grid grid-cols-3 gap-1"
            onNavigate={() => setOpen(false)}
            itemClassName={(active) =>
              `flex min-h-10 items-center justify-center rounded-md px-2 text-sm ${active ? "bg-primary/10 font-medium text-primary" : "text-card-foreground hover:bg-muted"}`
            }
          />
        </div>
      )}
    </div>
  );
}
