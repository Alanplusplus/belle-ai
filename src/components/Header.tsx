"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_NAMES, APP_STORE_URL } from "@/lib/constants";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { webSignIn, type WebSignInData } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ credits: number; subPlan: string | null; subRemaining: number } | null>(null);

  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const openCustomerPortal = async () => {
    setUserMenuOpen(false);
    setPortalLoading(true);
    try {
      const res = await fetch("/api/creem/portal");
      const data = await res.json();
      if (res.ok && data.portalUrl) {
        window.open(data.portalUrl, "_blank", "noopener,noreferrer");
      } else {
        window.open("https://app.creem.io/portal", "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open("https://app.creem.io/portal", "_blank", "noopener,noreferrer");
    } finally {
      setPortalLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || fetchedRef.current) return;
    fetchedRef.current = true;
    webSignIn(
      session?.user?.email ?? undefined,
      session?.user?.name ?? undefined,
      session?.user?.image ?? undefined
    ).then((res) => {
      if (res.code === 200 && res.data) {
        setUserInfo({
          credits: res.data.paid_credits ?? 0,
          subPlan: res.data.subscription?.plan ?? null,
          subRemaining: res.data.subscription?.remaining ?? 0,
        });
      }
    });
  }, [status, session]);

  const features = [
    { href: "/personal-color-analysis", label: t("colorAnalysis") },
    { href: "/makeup-analysis", label: t("makeupAnalysis") },
    { href: "/face-shape-analysis", label: t("faceAnalysis") },
    { href: "/hair-color-analysis", label: t("hairPreview") },
    { href: "/outfit-color-analysis", label: t("outfitColor") },
    { href: "/glasses-analysis", label: t("glassesMatch") },
    { href: "/occasion-makeup", label: t("occasionMakeup") },
    { href: "/jewelry-analysis", label: t("jewelryGuide") },
    { href: "/glow-up-report", label: t("glowUpReport") },
    { href: "/style-personality", label: t("stylePersonality") },
    { href: "/celebrity-match", label: t("celebrityMatch") },
  ];

  const tools = [
    { href: "/color-analysis", label: t("colorAnalysisGuide") },
    { href: "/tools/color-quiz", label: t("colorQuiz") },
    { href: "/tools/face-shape-quiz", label: t("faceQuiz") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-baseline gap-1">
          <span className="font-serif text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-gold bg-clip-text text-transparent">
            Belle
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            AI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavDropdown label={t("features")} items={features} />
          <NavDropdown label={t("tools")} items={tools} />
          <NavLink href="/blog">{t("blog")}</NavLink>
          <NavLink href="/pricing">{t("pricing")}</NavLink>

          {/* Language switcher */}
          <div className="relative ml-2" ref={langRef}>
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
            <div className="relative ml-2" ref={userMenuRef}>
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
                <div className="absolute right-0 top-full mt-1 min-w-[240px] rounded-xl border border-border bg-card p-2 shadow-xl">
                  <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </div>

                  {/* Quota display */}
                  <div className="mx-1 my-1.5 overflow-hidden rounded-lg border border-border">
                    {userInfo?.subPlan ? (
                      <div className="flex items-center gap-2.5 bg-gradient-to-r from-primary/5 to-transparent px-3 py-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                          <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-semibold text-primary uppercase">{userInfo.subPlan}</span>
                            <span className="text-[10px] text-muted-foreground">· {t("activeUntil")}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{userInfo.subRemaining} analyses left this month</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 px-3 py-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                          <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-muted-foreground">{t("noPlan")}</span>
                        </div>
                      </div>
                    )}
                    {(userInfo?.credits ?? 0) > 0 && (
                      <div className="flex items-center gap-2.5 border-t border-border px-3 py-1.5">
                        <div className="flex h-5 w-5 items-center justify-center">
                          <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H11.5v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.65c.1 1.7 1.36 2.66 2.85 2.97V19h1.73v-1.67c1.52-.29 2.72-1.16 2.72-2.74 0-2.08-1.87-2.93-3.64-3.45z" /></svg>
                        </div>
                        <span className="text-xs font-medium">{userInfo!.credits} {t("credits")}</span>
                      </div>
                    )}
                  </div>

                  {/* Menu items */}
                  <Link
                    href="/try"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                    {t("tryNow")}
                  </Link>
                  <Link
                    href="/try#history"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t("myHistory")}
                  </Link>
                  {userInfo?.subPlan ? (
                    <button
                      type="button"
                      disabled={portalLoading}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-primary hover:bg-muted disabled:opacity-50"
                      onClick={openCustomerPortal}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                      {portalLoading ? "..." : t("manage")}
                    </button>
                  ) : (
                    <Link
                      href="/pricing"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary hover:bg-muted"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                      {t("manage")}
                    </Link>
                  )}
                  <div className="mx-1 my-1 border-t border-border" />
                  <button
                    onClick={() => { setUserMenuOpen(false); trackEvent("sign_out"); signOut(); }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-muted"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
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
                onClick={() => { setMobileOpen(false); trackEvent("sign_out"); signOut(); }}
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
  const isWide = items.length > 5;

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
        <div className={`absolute left-0 top-full mt-0 rounded-lg border border-border bg-card p-1 shadow-lg ${isWide ? "grid min-w-[340px] grid-cols-2 gap-x-1" : "min-w-[180px]"}`}>
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
