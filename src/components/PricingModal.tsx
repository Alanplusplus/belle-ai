"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { emailUnlockReport, getCachedEmail } from "@/lib/api";
import { startCheckout } from "@/lib/checkout";
import { CREDIT_PACKS, SINGLE_UNLOCK_ENABLED, isPackProduct, type ProductKey } from "@/lib/constants";
import { usePrices } from "@/lib/usePrices";
import { usePlanShare, type PlanShareKey } from "@/lib/usePlanShare";
import { PaymentTrust } from "@/components/PaymentTrust";
import { InAppBrowserNotice, InAppCheckoutEmailStep } from "@/components/InAppBrowserNotice";
import { detectInAppBrowser } from "@/lib/inAppBrowser";
import { useDialogA11y } from "@/lib/useDialogA11y";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 触发付费墙的场景（锁定报告 / 额度用完 / 2K4K …），用于归因；report_lock 会显示「解锁完整报告」文案 */
  source?: string;
  /** 从锁定报告点进来时，展示这份报告的打码预览缩略图 */
  previewUrl?: string | null;
  /** 从哪份锁定报告进入：买完积分包回到页面后自动解锁它 */
  unlockTaskId?: string | null;
  /** 当前积分包余额：支付返回后据此判断积分是否到账 */
  packCredits?: number;
  /** 解锁这份报告要花几个积分（Glow-Up 报告是 3）。单份解锁只含 1 积分，所以只有 1 时才展示 */
  unlockCost?: number;
  /** 「留邮箱免费解锁一次」是否还可用（后端按账号判断，邮件没配好 / 已经领过都是 false）：true 才展示入口 */
  emailUnlockAvailable?: boolean;
  /** 邮件发送成功后回调：父组件据此刷新账号信息，下次打开就不再展示入口 */
  onEmailUnlocked?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailUnlockError =
  | "emailUnlockErrorInvalid"
  | "emailUnlockErrorUsed"
  | "emailUnlockErrorEmailUsed"
  | "emailUnlockErrorBusy"
  | "emailUnlockErrorGeneric";

export function PricingModal({
  open,
  onClose,
  source = "unknown",
  previewUrl,
  unlockTaskId,
  packCredits = 0,
  unlockCost = 1,
  emailUnlockAvailable = false,
  onEmailUnlocked,
}: Props) {
  const t = useTranslations("pricing");
  const tCommon = useTranslations("tryPage");
  const locale = useLocale();
  const { money } = usePrices();
  // 真实统计：近期新顾客里最多人选的方案及占比。后端样本量不够 / 占比不高时是 null，下面各处就什么都不显示
  const planShare = usePlanShare(open);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState(false);
  // 在 App 内置浏览器里点付费：先出「保存购买」步骤（填邮箱，可跳过），用户继续后才真正发起结算
  const [inAppWarnProduct, setInAppWarnProduct] = useState<ProductKey | null>(null);

  // 留邮箱免费解锁一次：折叠入口 → 填邮箱 → 发送中 → 已发送
  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<EmailUnlockError | null>(null);
  const emailSubmittingRef = useRef(false);

  // 弹层关闭时重置邮箱表单（在渲染期间根据 open 的变化调整状态，是 React 推荐的写法，避免在 effect 里同步 setState）
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setEmailFormOpen(false);
      setEmailSentTo(null);
      setEmailError(null);
    }
  }

  // 弹层打开时锁定背景滚动，避免手机上在弹层里滑动时底下的页面跟着滚
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 付费漏斗第一步：每次打开付费弹层记一次 view_pricing（/pricing 页在页面里单独记）
  useEffect(() => {
    if (!open) return;
    trackEvent("view_pricing", { source, surface: "modal" });
  }, [open, source]);

  // 弹层无障碍：焦点移入 / Tab 循环 / Esc 关闭 / 关闭后焦点归还
  const dialogRef = useDialogA11y<HTMLDivElement>(() => {
    trackEvent("pricing_modal_closed", { source, had_preview: !!previewUrl });
    setInAppWarnProduct(null);
    onClose();
  }, open);

  if (!open) return null;

  const isLockSource = source === "report_lock";
  // 单份解锁：只在「从某份锁定报告点进来、且这份报告 1 积分就能解锁」时出现
  const showSingle = SINGLE_UNLOCK_ENABLED && isLockSource && !!unlockTaskId && unlockCost <= 1;
  // 免费邮件解锁：只在「从某份锁定报告点进来」时出现；发送成功后即使父组件刷新成不可用，也要继续显示「已发送」
  const emailAlreadyUsed = emailError === "emailUnlockErrorUsed";
  const showEmailUnlock = isLockSource && !!unlockTaskId && (emailUnlockAvailable || !!emailSentTo || emailAlreadyUsed);

  const openEmailForm = () => {
    setEmailFormOpen(true);
    setEmailValue((current) => current || getCachedEmail() || "");
    trackEvent("email_unlock_opened", { source });
  };

  const handleEmailUnlock = async (event: FormEvent) => {
    event.preventDefault();
    if (!unlockTaskId || emailSubmittingRef.current) return;

    const email = emailValue.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setEmailError("emailUnlockErrorInvalid");
      return;
    }

    emailSubmittingRef.current = true;
    setEmailSending(true);
    setEmailError(null);
    trackEvent("email_unlock_submitted", { source });
    try {
      const res = await emailUnlockReport(unlockTaskId, email, locale);
      if (res.code === 200) {
        if (res.data?.already_unlocked) {
          // 这份报告其实已经是完整的（比如刚订阅）：让父组件刷新，直接关掉弹层
          onEmailUnlocked?.();
          onClose();
          return;
        }
        trackEvent("email_unlock_sent", { source });
        setEmailSentTo(email);
        onEmailUnlocked?.();
        return;
      }

      const reason = res.data?.reason;
      let key: EmailUnlockError = "emailUnlockErrorGeneric";
      // 只有后端明确说「邮箱不对」才提示邮箱有问题；报告没有可发的图、任务没完成这类 400 属于别的原因，给通用提示
      if (res.code === 400 && res.message === "invalid_email") key = "emailUnlockErrorInvalid";
      else if (res.code === 409 && reason === "account_used") key = "emailUnlockErrorUsed";
      else if (res.code === 409 && reason === "email_used") key = "emailUnlockErrorEmailUsed";
      else if (res.code === 429) key = "emailUnlockErrorBusy";
      trackEvent("email_unlock_failed", { source, code: res.code, reason: reason ?? res.message });
      setEmailError(key);
      // 这个账号已经领过：让父组件刷新，下次打开就不再展示入口
      if (reason === "account_used") onEmailUnlocked?.();
    } catch {
      trackEvent("email_unlock_failed", { source, code: 0, reason: "network" });
      setEmailError("emailUnlockErrorGeneric");
    } finally {
      emailSubmittingRef.current = false;
      setEmailSending(false);
    }
  };

  /** 这个方案正是「近期最多顾客选择」的那个时，返回那句真实的统计文案；否则 null */
  const shareNote = (plan: PlanShareKey) =>
    planShare?.plan === plan ? (
      <p className="mt-0.5 text-xs font-semibold text-primary">{t("planShare", { percent: planShare.percent })}</p>
    ) : null;

  const handleClose = () => {
    trackEvent("pricing_modal_closed", { source, had_preview: !!previewUrl });
    setInAppWarnProduct(null);
    onClose();
  };

  const handleCheckout = async (product: ProductKey, confirmedInApp = false, email?: string) => {
    // 「保存购买」步骤里点继续会再调一次本函数，这次不重复记点击
    if (!confirmedInApp) trackEvent("pricing_modal_cta_clicked", { product, source });
    const inApp = detectInAppBrowser();
    if (inApp && !confirmedInApp) {
      trackEvent("inapp_checkout_warned", { product, source, app: inApp });
      setInAppWarnProduct(product);
      return;
    }
    setInAppWarnProduct(null);
    setLoading(product);
    setError(false);
    try {
      await startCheckout({
        product,
        source: `pricing_modal:${source}`,
        locale,
        ...(email ? { email } : {}),
        ...(isPackProduct(product) ? { packBefore: packCredits, ...(unlockTaskId ? { unlockTaskId } : {}) } : {}),
        onRestore: () => setLoading(null),
      });
      // 成功后页面会整页跳转到支付页，保持 loading 状态
    } catch {
      setError(true);
      setLoading(null);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={isLockSource ? t("lockTitle") : t("title")}
      tabIndex={-1}
      className="fixed inset-0 z-[200] flex items-end justify-center outline-none sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* 手机上是贴底的抽屉（拇指够得到购买按钮），桌面保持居中弹窗；用 dvh 避开 iOS 地址栏伸缩造成的裁切 */}
      <div className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-2xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl sm:p-8">
        <button
          onClick={handleClose}
          aria-label={tCommon("close")}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground sm:right-4 sm:top-4"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLockSource && previewUrl ? (
          <div className="flex items-center gap-4 pr-8 text-left">
            {/* 预览图本身已经是服务端打码的，这里只是让用户确认「买的就是这份报告」 */}
            <img src={previewUrl} alt="" className="h-24 w-[72px] shrink-0 rounded-lg border border-border object-cover object-top shadow-sm" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold sm:text-2xl">{t("lockTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("lockSubtitle")}</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold">{isLockSource ? t("lockTitle") : t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{isLockSource ? t("lockSubtitle") : t("subtitle")}</p>
          </div>
        )}

        <InAppBrowserNotice className="mt-3" />

        {/* 订阅是主推：周订阅（首周优惠）最醒目。价格区与 /pricing 页一致：大号显示首周优惠价，原价放在说明里 */}
        <div className="relative mt-6 rounded-xl border-2 border-primary bg-card p-5 shadow-md">
          <span className="absolute -top-3 left-5 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
            {t("weeklyRecommendedBadge")}
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-lg font-bold">{t("weekly")}</h3>
            <p className="text-right">
              <span className="text-3xl font-bold text-primary">{money("weeklyIntro")}</span>
              <span className="text-sm text-muted-foreground"> / {t("weeklyIntroLabel")}</span>
            </p>
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">{t("weeklyThen", { price: money("weekly") })}</p>
          {/* 手机上也要看到订阅包含什么：只收起次要的两条 */}
          <ul className="mt-3 space-y-1.5">
            <ModalFeature text={t("weeklyFeature1")} />
            <ModalFeature text={t("weeklyFeature2")} className="max-sm:hidden" />
            <ModalFeature text={t("weeklyFeature3")} />
            <ModalFeature text={t("weeklyFeature4")} className="max-sm:hidden" />
          </ul>
          {planShare?.plan === "weekly" && <div className="mt-3 text-center">{shareNote("weekly")}</div>}
          <button
            onClick={() => handleCheckout("weekly")}
            disabled={loading !== null}
            className="mt-4 min-h-12 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            {loading === "weekly" ? <LoadingDots /> : t("weeklyCta", { price: money("weeklyIntro") })}
          </button>
        </div>

        {/* 单份解锁：给「只想看眼前这份、不想订阅」的人。紧凑一行、紧贴周订阅卡片下方，手机首屏就能看到；
            强调「一次付费、不自动续费」，打消订阅顾虑 */}
        {showSingle && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-card p-4">
            <div className="min-w-0">
              <h3 className="text-base font-bold">{t("singleTitle")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("singleDesc")}</p>
            </div>
            <button
              onClick={() => handleCheckout("single")}
              disabled={loading !== null}
              className="min-h-11 shrink-0 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
            >
              {loading === "single" ? <LoadingDots /> : t("singleCta", { price: money("single") })}
            </button>
          </div>
        )}

        {/* 免费邮件解锁（每个账号 / 每个邮箱一次）：给「想看但不想现在付钱」的人一条不流失的出路——
            报告发到邮箱，我们留下一个能再次联系的人。视觉上比订阅卡片弱（虚线框、无填充按钮），不抢主推 */}
        {showEmailUnlock && (
          <div className="mt-3 rounded-xl border border-dashed border-primary/50 bg-card/60 p-4">
            {emailSentTo ? (
              <div role="status" className="text-center">
                <p className="text-sm font-bold">{t("emailUnlockSentTitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("emailUnlockSentDesc", { email: emailSentTo })}</p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-3 min-h-11 rounded-full border border-border px-6 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  {tCommon("close")}
                </button>
              </div>
            ) : emailAlreadyUsed ? (
              <p role="alert" className="text-xs text-muted-foreground">{t("emailUnlockErrorUsed")}</p>
            ) : !emailFormOpen ? (
              <button type="button" onClick={openEmailForm} className="flex w-full items-center justify-between gap-3 text-left">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">{t("emailUnlockTitle")}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{t("emailUnlockDesc")}</span>
                </span>
                <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <form onSubmit={handleEmailUnlock} noValidate>
                <label htmlFor="email-unlock-input" className="block text-sm font-bold text-foreground">
                  {t("emailUnlockTitle")}
                </label>
                <div className="mt-2 flex gap-2 max-sm:flex-col">
                  <input
                    id="email-unlock-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label={t("emailUnlockLabel")}
                    aria-invalid={emailError === "emailUnlockErrorInvalid"}
                    placeholder="name@example.com"
                    value={emailValue}
                    onChange={(e) => {
                      setEmailValue(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-base outline-none transition focus:border-primary sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={emailSending || loading !== null}
                    className="min-h-11 shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                  >
                    {emailSending ? <LoadingDots /> : t("emailUnlockCta")}
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t("emailUnlockNote")}</p>
                {emailError && (
                  <p role="alert" className="mt-2 text-xs text-red-500">
                    {t(emailError)}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {/* Yearly：权益和周订阅相同，所以只用紧凑的一行：折合每周的价格 + 省多少 */}
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-bold">{t("yearly")}</h3>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                {t("yearlyBadge")}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {money("yearly")} {t("yearlyPer")} · {t("yearlyPerWeek", { price: money("yearlyPerWeek") })}
            </p>
            {shareNote("yearly")}
          </div>
          <button
            onClick={() => handleCheckout("yearly")}
            disabled={loading !== null}
            className="min-h-11 shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {loading === "yearly" ? <LoadingDots /> : t("yearlyCta")}
          </button>
        </div>

        {/* 积分包：一次性付费、不绑订阅，给不想订阅的人；30 积分更划算 */}
        <p className="mt-6 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {showSingle ? t("orPackMore") : t("orPack")}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(["pack", "pack30"] as const).map((key) => {
            const { credits } = CREDIT_PACKS[key];
            const price = money(key);
            return (
              <div key={key} className="relative rounded-xl border border-border bg-card p-4">
                {key === "pack30" && (
                  <span className="absolute -top-2.5 right-3 whitespace-nowrap rounded-full bg-green-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {t("packSaveBadge", { percent: money("pack30:savePercent") })}
                  </span>
                )}
                <h3 className="text-sm font-bold">{t("packTitle", { credits })}</h3>
                <p className="mt-1 text-xl font-bold">{price}</p>
                <p className="text-xs text-muted-foreground">{t("packPerReport", { price: money(`${key}:perReport` as "pack:perReport" | "pack30:perReport") })}</p>
                {shareNote(key)}
                <button
                  onClick={() => handleCheckout(key)}
                  disabled={loading !== null}
                  className="mt-3 min-h-11 w-full rounded-full border border-primary px-2 py-2 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
                >
                  {loading === key ? <LoadingDots /> : t("packCta", { credits, price })}
                </button>
              </div>
            );
          })}
        </div>
        {/* 从锁定报告点进来：买积分包能顺手把这份报告解锁，这点要说清楚 */}
        {isLockSource && <p className="mt-2 text-center text-xs font-medium text-foreground">{t("packFeature2")}</p>}
        <p className="mt-2 text-center text-xs text-muted-foreground">{t("packNote")} {t("packCostNote")}</p>

        {/* 支付信任信息：离购买按钮最近的地方说清「怎么付、安不安全」 */}
        <PaymentTrust className="mt-4" />

        {inAppWarnProduct && (
          <InAppCheckoutEmailStep onContinue={(email) => handleCheckout(inAppWarnProduct, true, email)} />
        )}

        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-red-500">
            {t("checkoutError")}
          </p>
        )}

        {/* 保障条：手机上也常驻，付款前最后一眼看到的是「随时取消 / 隐私 / 不用注册」 */}
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          <ModalFeature text={t("guaranteeCancelTitle")} />
          <ModalFeature text={t("guaranteePrivacyTitle")} />
          <ModalFeature text={t("guaranteeNoAccountTitle")} />
        </ul>
        <p className="mt-3 text-center text-xs text-muted-foreground">{t("billingNote")}</p>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">{t("aiDisclosure")}</p>
      </div>
    </div>
  );
}

function ModalFeature({ text, className = "" }: { text: string; className?: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {text}
    </li>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}
