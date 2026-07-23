"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_NAMES } from "@/lib/constants";
import { useState } from "react";
import Image from "next/image";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const features = [
    { href: "/makeup-analysis", label: t("makeupAnalysis") },
    { href: "/personal-color-analysis", label: t("colorAnalysis") },
    { href: "/face-shape-analysis", label: t("faceAnalysis") },
  ];

  const tools = [
    { href: "/tools/color-quiz", label: t("colorQuiz") },
    { href: "/tools/face-shape-quiz", label: t("faceQuiz") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon-192.png"
            alt="Belle AI"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">Belle</span>
          <span className="rounded bg-gradient-to-r from-primary to-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">AI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavDropdown label={t("features")} items={features} />
          <NavDropdown label={t("tools")} items={tools} />
          <NavLink href="/blog">{t("blog")}</NavLink>
          <NavLink href="/pricing">{t("pricing")}</NavLink>

          {/* Language switcher */}
          <div className="relative ml-2">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {LOCALE_NAMES[locale]}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 min-w-[120px] rounded-lg border border-border bg-card p-1 shadow-lg">
                {routing.locales.map((l) => (
                  <a
                    key={l}
                    href={`/${l}${pathname}`}
                    className={`block rounded-md px-3 py-1.5 text-sm hover:bg-muted ${
                      l === locale
                        ? "font-medium text-primary"
                        : "text-card-foreground"
                    }`}
                    onClick={() => setLangOpen(false)}
                  >
                    {LOCALE_NAMES[l]}
                  </a>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/try"
            className="ml-3 rounded-full bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary/20 transition hover:shadow-lg hover:shadow-primary/30"
          >
            {t("tryNow")}
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <div className="space-y-1 py-2">
            <p className="px-3 pt-2 text-xs font-semibold uppercase text-muted-foreground">
              {t("features")}
            </p>
            {features.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                {f.label}
              </Link>
            ))}
            <p className="px-3 pt-3 text-xs font-semibold uppercase text-muted-foreground">
              {t("tools")}
            </p>
            {tools.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                {f.label}
              </Link>
            ))}
            <NavLink href="/blog" onClick={() => setMobileOpen(false)}>
              {t("blog")}
            </NavLink>
            <NavLink href="/pricing" onClick={() => setMobileOpen(false)}>
              {t("pricing")}
            </NavLink>
          </div>
          <div className="flex items-center gap-2 border-t border-border pt-3">
            {routing.locales.map((l) => (
              <a
                key={l}
                href={`/${l}${pathname}`}
                className={`rounded-md px-2 py-1 text-xs ${
                  l === locale
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {LOCALE_NAMES[l]}
              </a>
            ))}
          </div>
          <Link
            href="/try"
            className="mt-3 block w-full rounded-full bg-gradient-to-r from-primary to-primary-dark py-2.5 text-center text-sm font-medium text-white shadow-md shadow-primary/20"
            onClick={() => setMobileOpen(false)}
          >
            {t("tryNow")}
          </Link>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-sm text-foreground/80 transition hover:bg-muted hover:text-foreground"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-foreground/80 transition hover:bg-muted hover:text-foreground">
        {label}
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-0 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-lg">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-card-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
