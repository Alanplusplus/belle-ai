"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_NAMES, APP_STORE_URL } from "@/lib/constants";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-384.webp"
            alt="Belle AI"
            width={54}
            height={36}
            className="object-contain"
            priority
          />
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

          {/* Download App button */}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-3.5 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            {t("getApp")}
          </a>

          {status === "authenticated" && session.user ? (
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-border px-2 py-1 transition hover:bg-muted"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {(session.user.name?.[0] || "U").toUpperCase()}
                  </div>
                )}
                <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[160px] rounded-lg border border-border bg-card p-1 shadow-lg">
                  <div className="px-3 py-2 text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </div>
                  <Link
                    href="/try"
                    className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {t("tryNow")}
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut(); }}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-muted"
                  >
                    {t("signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/try"
              className="ml-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary/20 transition hover:shadow-lg hover:shadow-primary/30"
            >
              {t("tryNow")}
            </Link>
          )}
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

          {/* Mobile: Download App */}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
            onClick={() => setMobileOpen(false)}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            {t("getApp")}
          </a>

          {status === "authenticated" && session?.user ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {(session.user.name?.[0] || "U").toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
              <button
                onClick={() => { setMobileOpen(false); signOut(); }}
                className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                {t("signOut")}
              </button>
            </div>
          ) : (
            <Link
              href="/try"
              className="mt-3 block w-full rounded-full bg-gradient-to-r from-primary to-primary-dark py-2.5 text-center text-sm font-medium text-white shadow-md shadow-primary/20"
              onClick={() => setMobileOpen(false)}
            >
              {t("tryNow")}
            </Link>
          )}
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
