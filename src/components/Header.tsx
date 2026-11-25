"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { type Locale } from "@/i18n/routing";
import { LOCALE_NAMES } from "@/lib/constants";
import { GlobeIcon, LanguageLinks } from "@/components/LanguageSwitcher";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { ACCOUNT_SYNCED_EVENT, webInit, webSignIn, type WebInitData, type WebSignInData } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { useSignIn } from "@/lib/useSignIn";
import { SignInSheet } from "@/components/SignInSheet";

/** free：免费预览额度；pack：套餐积分（含老的签到 / 邀请赠送积分，用来出完整结果）。两种分开显示，避免混淆 */
type UserInfo = { free: number; pack: number };

export function Header() {
  const t = useTranslations("nav");
  // 「获取积分」的文案已经在试用页翻译好了（9 种语言），这里直接复用
  const tTry = useTranslations("tryPage");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // 头像菜单底部的「语言」行：默认折叠，点开才列出语言
  const [userLangOpen, setUserLangOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const signIn = useSignIn();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);
  const syncingRef = useRef(false);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
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
          free: res.data.web_quota?.remaining ?? 0,
          pack: res.data.pack_credits ?? 0,
        });
      }
    });
  }, [status, session]);

  // 额度实时刷新：页面里任何地方（生成 / 解锁 / 试戴 / 购买）从后端取到最新账号数据时都会广播，这里直接用，头像菜单里的数字就不会停在登录那一刻
  useEffect(() => {
    if (status !== "authenticated") return;
    const onSynced = (event: Event) => {
      const data = (event as CustomEvent<WebInitData | undefined>).detail;
      if (!data) return;
      lastSyncRef.current = Date.now();
      setUserInfo({ free: data.web_quota?.remaining ?? 0, pack: data.pack_credits ?? 0 });
    };
    window.addEventListener(ACCOUNT_SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(ACCOUNT_SYNCED_EVENT, onSynced);
  }, [status]);

  // 打开头像菜单 / 手机菜单、切回这个标签页时主动取一次最新额度（别的标签页或后台任务也会扣额度）；3 秒内不重复请求
  const refreshCredits = useCallback(() => {
    if (status !== "authenticated" || syncingRef.current || Date.now() - lastSyncRef.current < 3000) return;
    syncingRef.current = true;
    webInit()
      .catch(() => {})
      .finally(() => {
        syncingRef.current = false;
      });
  }, [status]);

  useEffect(() => {
    if (userMenuOpen || mobileOpen) refreshCredits();
  }, [userMenuOpen, mobileOpen, refreshCredits]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshCredits();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshCredits]);

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
    { href: "/scan", label: t("scan") },
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

          {/* 我的历史：顶栏常驻、所有人可见（没有记录时历史页会列出各个功能卡片，直接从这里进去开始生成）。
              语言切换是低频操作，已经移到页脚和头像菜单底部 */}
          <NavLink href="/try?view=history" onClick={() => trackEvent("header_history_click", { device: "desktop" })}>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon />
              {t("myHistory")}
            </span>
          </NavLink>

          {/* User menu — shown for both authenticated and anonymous users */}
          <div className="relative ml-2" ref={userMenuRef}>
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setUserLangOpen(false); }}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
              aria-label={status === "authenticated" && session?.user?.email ? session.user.email : t("signIn")}
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
                  {(session.user.name?.[0] || session.user.email?.[0] || "U").toUpperCase()}
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
                {status === "authenticated" && (
                  <UserQuotaCard
                    userInfo={userInfo}
                    t={t}
                    buy={{
                      label: tTry("taskGetCredits"),
                      onClick: () => {
                        setUserMenuOpen(false);
                        trackEvent("header_buy_credits_click", { source: "user_menu" });
                      },
                    }}
                  />
                )}

                {/* 匿名用户的登录入口：登录后积分、历史记录可以跨浏览器、跨设备保留 */}
                {status === "unauthenticated" && (
                  <button
                    type="button"
                    onClick={() => { setUserMenuOpen(false); signIn.start("user_menu"); }}
                    className="mx-1 mb-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/15"
                  >
                    <UserGlyph />
                    <span className="flex-1">{t("signIn")}</span>
                  </button>
                )}

                {/* 账户菜单只放跟「账号」有关的东西：我的历史、价格在顶栏上已经有了，这里不再重复 */}
                <div className="mx-1 my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => setUserLangOpen((v) => !v)}
                  aria-expanded={userLangOpen}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GlobeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{t("language")}: {LOCALE_NAMES[locale]}</span>
                  </span>
                  <svg className={`h-3 w-3 shrink-0 text-muted-foreground transition ${userLangOpen ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <path d="M2 4l4 4 4-4" />
                  </svg>
                </button>
                {userLangOpen && (
                  <LanguageLinks
                    source="user_menu"
                    className="grid grid-cols-2 gap-1 px-1 pb-1 pt-0.5"
                    onNavigate={() => { setUserMenuOpen(false); setUserLangOpen(false); }}
                    itemClassName={(active) =>
                      `flex min-h-9 items-center justify-center rounded-md px-2 text-sm ${active ? "bg-primary/10 font-medium text-primary" : "text-card-foreground hover:bg-muted"}`
                    }
                  />
                )}
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
                      {(session.user.name?.[0] || session.user.email?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {session.user.name && <p className="truncate text-sm font-medium">{session.user.name}</p>}
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
                <UserGlyph />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{t("signIn")}</span>
                  <span className="block text-xs text-muted-foreground">{t("signInHint")}</span>
                </span>
              </button>
            ) : null}
          </div>

          <div className="space-y-1 border-t border-border pt-3">
            <Link
              href="/try?view=history"
              className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => { setMobileOpen(false); trackEvent("header_history_click", { device: "mobile" }); }}
            >
              <ClockIcon />
              {t("myHistory")}
            </Link>
            <Link
              href="/pricing"
              className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
              {t("pricing")}
            </Link>
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
                <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                {t("language")}: {LOCALE_NAMES[locale]}
              </span>
              <svg className={`h-3 w-3 text-muted-foreground transition ${mobileLangOpen ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>
            {mobileLangOpen && (
              <LanguageLinks
                source="mobile_menu"
                className="grid grid-cols-3 gap-1.5 px-1 pb-2 pt-1"
                onNavigate={() => setMobileOpen(false)}
                itemClassName={(active) =>
                  `flex min-h-10 items-center justify-center rounded-md px-2 text-sm ${active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`
                }
              />
            )}
          </div>
        </div>
      )}

      <SignInSheet open={signIn.open} onClose={signIn.close} />
    </header>
  );
}

function UserGlyph() {
  return (
    <svg className="h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/** buy：积分卡片底部的一行轻量「获取积分」入口（价格页不再单独占头像菜单的一项）；不传就不显示（手机菜单里价格页就在下面，不重复） */
function UserQuotaCard({
  userInfo,
  t,
  className = "mx-1 my-1.5",
  buy,
}: {
  userInfo: UserInfo | null;
  t: ReturnType<typeof useTranslations>;
  className?: string;
  buy?: { label: string; onClick: () => void };
}) {
  return (
    <div className={`${className} overflow-hidden rounded-lg border border-border`}>
      {userInfo && (
        <div className="flex items-center gap-2.5 px-3 py-1.5">
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
      {buy && (
        <Link
          href="/pricing"
          onClick={buy.onClick}
          className="flex items-center justify-between gap-2 border-t border-border bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
        >
          <span className="truncate">{buy.label}</span>
          <span aria-hidden="true">→</span>
        </Link>
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
