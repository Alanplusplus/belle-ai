"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_NAMES, SUBSCRIPTION_PORTAL_PATH } from "@/lib/constants";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { webSignIn, type WebSignInData } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { useSignIn } from "@/lib/useSignIn";
import { InAppSignInSheet } from "@/components/InAppBrowserNotice";

/** free：免费额度 + 签到/邀请积分（只出打码预览）；pack：积分包积分（出完整报告）。两种分开显示，避免混淆 */
type UserInfo = { free: number; pack: number; subPlan: string | null; subRemaining: number };

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const signIn = useSignIn();

  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

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

  // 路由切换（含浏览器返回）后收起移动菜单：在渲染期间对比路径（React 推荐的「由 props 派生 state」写法），不用 effect
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMobileOpen(false);
    setMobileLangOpen(false);
  }

  // 菜单展开时锁定背景滚动，避免在菜单里滑动时页面跟着滚
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

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
          free: (res.data.web_quota?.remaining ?? 0) + (res.data.paid_credits ?? 0),
          pack: res.data.pack_credits ?? 0,
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
    { href: "/tools/undertone-test", label: t("undertoneTest") },
    { href: "/lookbook", label: t("lookbook") },
    { href: "/transformations", label: t("transformations") },
    { href: "/guides", label: t("guides") },
    { href: "/vs", label: t("vsCompare") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <BrandLogo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {/* Try Now CTA */}
          <Link
            href="/try"
            className="mr-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-primary-dark px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:shadow-lg hover:shadow-primary/30 hover:brightness-110 active:scale-[0.97]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            {t("tryNow")}
          </Link>

          <NavDropdown label={t("features")} items={features} />
          <NavDropdown label={t("tools")} items={tools} />
          <NavLink href="/blog">{t("blog")}</NavLink>
          <NavLink href="/pricing">{t("pricing")}</NavLink>

          {/* Language switcher */}
          <div className="relative ml-2" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              aria-haspopup="true"
              aria-expanded={langOpen}
              aria-label={t("language")}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {LOCALE_NAMES[locale]}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 min-w-[120px] rounded-lg border border-border bg-card p-1 shadow-lg">
                {routing.locales.map((l) => (
                  <Link
                    key={l}
                    href={pathname || "/"}
                    locale={l}
                    className={`block rounded-md px-3 py-1.5 text-sm hover:bg-muted ${
                      l === locale
                        ? "font-medium text-primary"
                        : "text-card-foreground"
                    }`}
                    onClick={() => setLangOpen(false)}
                  >
                    {LOCALE_NAMES[l]}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* User menu — shown for both authenticated and anonymous users */}
          <div className="relative ml-2" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
              aria-label={status === "authenticated" && session?.user?.email ? session.user.email : t("signInGoogle")}
              className="flex items-center gap-2 rounded-full border border-border px-2 py-1 transition hover:bg-muted"
            >
              {status === "authenticated" && session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-7 w-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : status === "authenticated" && session?.user ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {(session.user.name?.[0] || "U").toUpperCase()}
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                </div>
              )}
              <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 min-w-[240px] rounded-xl border border-border bg-card p-2 shadow-xl">
                {status === "authenticated" && session?.user && (
                  <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </div>
                )}

                {/* 额度/积分（登录用户） */}
                {status === "authenticated" && <UserQuotaCard userInfo={userInfo} t={t} />}

                {/* 匿名用户的登录入口：登录后订阅、历史记录可以跨浏览器、跨设备保留 */}
                {status === "unauthenticated" && (
                  <button
                    type="button"
                    onClick={() => { setUserMenuOpen(false); signIn.start("user_menu"); }}
                    className="mx-1 mb-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/15"
                  >
                    <GoogleGlyph />
                    <span className="flex-1">{t("signInGoogle")}</span>
                  </button>
                )}

                {/* Menu items — shown for all users */}
                <Link
                  href="/try#history"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {t("myHistory")}
                </Link>
                <Link
                  href="/referral"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                  {t("inviteFriends")}
                </Link>
                {!(status === "authenticated" && userInfo?.subPlan) && (
                  <Link
                    href="/pricing"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary hover:bg-muted"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                    {t("pricing")}
                  </Link>
                )}
                {/* 所有人都能看到：匿名付款的用户在这里也识别不出订阅状态，但同样需要取消订阅的入口。
                    用普通 <a>（不是 next/link）：服务端点击时才生成 Waffo 门户链接，预取会白白生成 */}
                <a
                  href={SUBSCRIPTION_PORTAL_PATH}
                  rel="nofollow"
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted ${userInfo?.subPlan ? "text-primary" : ""}`}
                  onClick={() => trackEvent("manage_subscription_click", { source: "user_menu" })}
                >
                  <svg className={`h-4 w-4 ${userInfo?.subPlan ? "" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {t("manageSubscription")}
                </a>
                {status === "authenticated" && (
                  <>
                    <div className="mx-1 my-1 border-t border-border" />
                    <button
                      onClick={() => { setUserMenuOpen(false); trackEvent("sign_out"); signOut(); }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-muted"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                      {t("signOut")}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile: 常驻 Try 按钮 + 汉堡。以前手机顶栏只有 Logo 和汉堡，主 CTA 要点开菜单才能看到 */}
        <div className="flex items-center gap-1 lg:hidden">
          <Link
            href="/try"
            onClick={() => trackEvent("header_try_click", { device: "mobile" })}
            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary-dark px-3.5 text-xs font-semibold text-white shadow-md shadow-primary/20 transition active:scale-[0.97]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            {t("tryNow")}
          </Link>
          <button
            className="flex h-11 w-11 items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
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
      </div>

      {/* Mobile menu：限制在视口高度内并可滚动，否则菜单很长时底部的语言/登录/历史记录根本够不着 */}
      {mobileOpen && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          {/* 账号区：登录用户显示头像 + 额度；匿名用户显示登录入口 */}
          <div className="py-3">
            {status === "authenticated" && session?.user ? (
              <div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
                  {session.user.image ? (
                    <img src={session.user.image} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {(session.user.name?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{session.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <button
                    onClick={() => { setMobileOpen(false); trackEvent("sign_out"); signOut(); }}
                    className="min-h-10 rounded-md px-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    {t("signOut")}
                  </button>
                </div>
                <UserQuotaCard userInfo={userInfo} t={t} className="mx-0 mt-2" />
              </div>
            ) : status === "unauthenticated" ? (
              <button
                type="button"
                onClick={() => signIn.start("mobile_menu")}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 text-left"
              >
                <GoogleGlyph />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{t("signInGoogle")}</span>
                  <span className="block text-xs text-muted-foreground">{t("signInHint")}</span>
                </span>
              </button>
            ) : null}
          </div>

          <div className="space-y-1 border-t border-border pt-3">
            <Link
              href="/try#history"
              className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t("myHistory")}
            </Link>
            <Link
              href="/referral"
              className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
              {t("inviteFriends")}
            </Link>
            <Link
              href="/pricing"
              className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
              {t("pricing")}
            </Link>
            <a
              href={SUBSCRIPTION_PORTAL_PATH}
              rel="nofollow"
              className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => trackEvent("manage_subscription_click", { source: "mobile_menu" })}
            >
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {t("manageSubscription")}
            </a>
            <NavLink href="/blog" onClick={() => setMobileOpen(false)}>
              {t("blog")}
            </NavLink>
          </div>

          <div className="mt-2 space-y-1 border-t border-border pt-3">
            <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
              {t("features")}
            </p>
            {features.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="flex min-h-10 items-center rounded-md px-3 py-2 text-sm hover:bg-muted"
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
                className="flex min-h-10 items-center rounded-md px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {/* 语言：默认折叠成一行，展开后再列出 9 种语言（以前 9 个小标签直接平铺） */}
          <div className="mt-2 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => setMobileLangOpen((v) => !v)}
              aria-expanded={mobileLangOpen}
              className="flex min-h-11 w-full items-center justify-between rounded-md px-3 text-sm hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                {t("language")}: {LOCALE_NAMES[locale]}
              </span>
              <svg className={`h-3 w-3 text-muted-foreground transition ${mobileLangOpen ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>
            {mobileLangOpen && (
              <div className="grid grid-cols-3 gap-1.5 px-1 pb-2 pt-1">
                {routing.locales.map((l) => (
                  <Link
                    key={l}
                    href={pathname || "/"}
                    locale={l}
                    onClick={() => setMobileOpen(false)}
                    className={`flex min-h-10 items-center justify-center rounded-md px-2 text-sm ${
                      l === locale
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {LOCALE_NAMES[l]}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <InAppSignInSheet open={signIn.blockedOpen} onClose={signIn.closeBlocked} />
    </header>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function UserQuotaCard({
  userInfo,
  t,
  className = "mx-1 my-1.5",
}: {
  userInfo: UserInfo | null;
  t: ReturnType<typeof useTranslations>;
  className?: string;
}) {
  return (
    <div className={`${className} overflow-hidden rounded-lg border border-border`}>
      {userInfo?.subPlan ? (
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-primary/5 to-transparent px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-primary uppercase">{userInfo.subPlan}</span>
              <span className="text-xs text-muted-foreground">· {t("activeUntil")}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("analysesLeft", { count: userInfo.subRemaining })}</p>
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
      {userInfo && (
        <div className="flex items-center gap-2.5 border-t border-border px-3 py-1.5">
          <div className="flex h-5 w-5 items-center justify-center">
            <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
          </div>
          <span className="text-xs text-muted-foreground">{t("freeCredits", { count: userInfo.free })}</span>
        </div>
      )}
      {(userInfo?.pack ?? 0) > 0 && (
        <div className="flex items-center gap-2.5 border-t border-border px-3 py-1.5">
          <div className="flex h-5 w-5 items-center justify-center">
            <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H11.5v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.65c.1 1.7 1.36 2.66 2.85 2.97V19h1.73v-1.67c1.52-.29 2.72-1.16 2.72-2.74 0-2.08-1.87-2.93-3.64-3.45z" /></svg>
          </div>
          <span className="text-xs font-medium">{t("packCredits", { count: userInfo!.pack })}</span>
        </div>
      )}
    </div>
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
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isWide = items.length > 5;

  // 触屏没有 mouseleave：点击菜单外面也要能收起
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      // 焦点移出整个下拉区域（Tab 走开）时收起
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        // 键盘 Enter / 空格触发的 click 的 detail 为 0：切换开合；鼠标 / 触屏的点击（hover 已经展开）保持展开，避免「悬停后点击反而关掉」
        onClick={(e) => setOpen((prev) => (e.detail === 0 ? !prev : true))}
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-foreground/80 transition hover:bg-muted hover:text-foreground"
      >
        {label}
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
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
