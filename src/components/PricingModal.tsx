"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout";
import { ADDON_CREDITS, SINGLE_UNLOCK_ENABLED, UPGRADE_TOPUP_ENABLED, type ProductKey } from "@/lib/constants";
import { KIT_PERKS, KIT_PERK_VALUES } from "@/lib/kit";
import {
  FREE_COLOR_COUNT,
  MY_SEASON_KEY,
  isSeasonSlug,
  proseFor,
  seasonPalette,
  type ColorReportData,
  type SeasonSlug,
} from "@/lib/color-report";
import { useReportMessages } from "@/lib/report-messages";
import { usePrices } from "@/lib/usePrices";
import { PaymentTrust } from "@/components/PaymentTrust";
import { PAYWALL_EXIT_EVENT, PAYWALL_OPEN_EVENT } from "@/components/PaywallExitSurvey";
import { InAppBrowserNotice, InAppCheckoutEmailStep } from "@/components/InAppBrowserNotice";
import { detectInAppBrowser } from "@/lib/inAppBrowser";
import { useDialogA11y } from "@/lib/useDialogA11y";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 触发付费墙的场景（锁定报告 / 额度用完 / 积分角标 …），用于归因；report_lock 会显示「解锁完整报告」文案 */
  source?: string;
  /** 从锁定报告点进来时，展示这份报告的打码预览缩略图 */
  previewUrl?: string | null;
  /** 从锁定的色彩报告点进来时，这份报告本身：弹窗里拿它的季型和免费露出的几个颜色做「你的结果就差一步」的预览 */
  unlockReport?: ColorReportData | null;
  /** 从哪份锁定的色彩报告进入：买完回到页面后自动解锁它 */
  unlockTaskId?: string | null;
  /** 从哪份「分析 + 试戴」结果进入：买完回到页面后重新打开它 */
  openTaskId?: string | null;
  /**
   * 买什么：report = 色彩报告（套装，单独购买，不占积分）；credits = 积分（试戴图每套 1 积分，没买过报告也能买）。
   * 不传时按是否买过决定（老顾客先看积分）。
   */
  intent?: "report" | "credits";
  /** 当前积分余额：支付返回后据此判断积分是否到账 */
  packCredits?: number;
  /** 当前报告额度：单份报告只发报告额度（没有积分），支付返回后据此判断是否到账 */
  reportCredits?: number;
  /** 买过套装 / 积分包：把「加购包」放在最前面，而不是再卖一次套装 */
  hasPurchased?: boolean;
  /** 只买过单份报告（没买过套装）：升级场景卖补差价升级包（套装 − 单份），而不是套装全价；后端 web-init 的 upgrade_topup */
  upgradeTopup?: boolean;
}

/** 浏览器里记着的季型：额度用完时，用「你上次的结果」把用户和那份还没打开的完整报告连起来 */
function readStoredSeason(): SeasonSlug | null {
  try {
    const stored = localStorage.getItem(MY_SEASON_KEY);
    return isSeasonSlug(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * 付费弹窗：主打商品 Color Kit，一次性付费、没有订阅；打开 NEXT_PUBLIC_SINGLE_UNLOCK 后，要买色彩报告的人
 * 还会先看到一个低价的「只解锁这一份报告」入口，套装作为升级项排在它下面。
 * 老顾客（买过套装 / 积分包）看到的是加购包，套装退到下面一行。
 * source = lookbook_upgrade：已经用单份报告解锁过，只卖套装（升级成完整 Lookbook），不再出现单份；
 * 只买过单份的人（upgradeTopup）看到的是补差价升级包——内容和套装一样，价格是套装减去已付的单份。
 *
 * 弹窗出现在转化的最后一步，按用户此刻的心情分三种说法：
 *  - lock：报告已经生成、就差打开——「你的结果在这儿，看一眼」，带上她的季型和已露出的颜色；
 *  - more：免费次数用完——「想看到更多的自己」，说清买了能多看到什么；
 *  - credits：要买积分——「在自己脸上看到这个造型」。
 */
export function PricingModal({
  open,
  onClose,
  source = "unknown",
  previewUrl,
  unlockReport,
  unlockTaskId,
  openTaskId,
  intent,
  packCredits = 0,
  reportCredits = 0,
  hasPurchased = false,
  upgradeTopup = false,
}: Props) {
  const t = useTranslations("kit");
  const tCommon = useTranslations("tryPage");
  const tPricing = useTranslations("pricing");
  const locale = useLocale();
  // 季型名称按页面语言取（报告语言代码：中文是 zh-Hans，其余和 locale 相同）；语言包和报告页共用同一份缓存
  const reportLang = locale === "zh" ? "zh-Hans" : locale;
  const reportMessages = useReportMessages(reportLang);
  const { money } = usePrices();
  const [loading, setLoading] = useState<ProductKey | null>(null);
  const [error, setError] = useState(false);
  // 在 App 内置浏览器里点付费：先出「保存购买」步骤（填邮箱，可跳过），用户继续后才真正发起结算
  const [inAppWarnProduct, setInAppWarnProduct] = useState<ProductKey | null>(null);

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
    const offer =
      source === "lookbook_upgrade"
        ? UPGRADE_TOPUP_ENABLED && upgradeTopup ? "upgrade" : "kit"
        : SINGLE_UNLOCK_ENABLED ? "single+kit" : "kit";
    trackEvent("view_pricing", { source, surface: "modal", offer });
    // 退出调查条还挂在屏幕上时，弹窗又被打开：让它先收起
    window.dispatchEvent(new Event(PAYWALL_OPEN_EVENT));
  }, [open, source, upgradeTopup]);

  const handleClose = () => {
    trackEvent("pricing_modal_closed", { source, had_preview: !!previewUrl });
    setInAppWarnProduct(null);
    // 没去付款就关掉：交给退出调查（只问没买过的人；升级场景的人已经付过费，不问「为什么没买」）
    if (!hasPurchased && source !== "lookbook_upgrade") {
      window.dispatchEvent(
        new CustomEvent(PAYWALL_EXIT_EVENT, { detail: { source, offer: SINGLE_UNLOCK_ENABLED ? "single+kit" : "kit" } }),
      );
    }
    onClose();
  };

  // 弹层无障碍：焦点移入 / Tab 循环 / Esc 关闭 / 关闭后焦点归还
  const dialogRef = useDialogA11y<HTMLDivElement>(handleClose, open);

  if (!open) return null;

  const isLockSource = source === "report_lock";
  // 积分排在最前面：明确要买积分（试戴），或没说要买什么的老顾客；要买色彩报告时永远先看套装
  // 升级场景的人刚买过单份报告（hasPurchased），但这里要卖的是套装，不能被当成老顾客先推加购包
  const upgradeScene = source === "lookbook_upgrade";
  const buyerFirst = !upgradeScene && (intent ? intent === "credits" : hasPurchased);
  const creditsScene = intent === "credits";
  const buyerScene = buyerFirst && !creditsScene;
  // 报告已经出来、就差解锁（卖套装）/ 免费次数用完想再看（卖套装）
  const lockScene = isLockSource && !buyerFirst;
  const moreScene = !buyerFirst && !isLockSource && source.startsWith("no_quota");
  // 低价单份只是「第一次付费」的入口：要买色彩报告、还没买过任何东西的人才看到；
  // 买过的人（单份 / 套装）再来买报告只卖套装——套装才有积分和完整 Lookbook，也避免套装买家再用 $2.99 反复换完整 Lookbook
  const singleOffer = SINGLE_UNLOCK_ENABLED && !upgradeScene && !buyerFirst && !hasPurchased;
  // 要买色彩报告的人（不是买积分的老顾客，也不是升级）：把锁在后面的东西逐项说清楚，再放价格锚点
  const showInside = !buyerFirst && !upgradeScene;
  const insideKeys = ["inside1", "inside2", "inside3", singleOffer ? "insideLookSingle" : "insideLook", "inside5"] as const;
  const title = upgradeScene
    ? t("upgradeTitle")
    : creditsScene
      ? t("creditsTitle")
      : buyerScene
        ? t("buyerTitle")
        : lockScene
          ? t("lockTitle")
          : moreScene
            ? t("moreTitle")
            : t("modalTitle");
  const subtitle = upgradeScene
    ? t("upgradeSubtitle")
    : creditsScene
      ? t("creditsSubtitle")
      : buyerScene
        ? t("buyerSubtitle")
        : lockScene
          ? t("lockSubtitle")
          : moreScene
            ? t("moreSubtitle", KIT_PERK_VALUES)
            : t("modalSubtitle");

  // 「你的季型 + 已经露出的颜色 + 还有几个在等你」：解锁时用这份报告，额度用完时用浏览器里记着的上次结果（买过的人不用再劝）
  const teaserSlug: SeasonSlug | null = lockScene
    ? unlockReport && isSeasonSlug(unlockReport.season)
      ? unlockReport.season
      : null
    : moreScene && !hasPurchased
      ? readStoredSeason()
      : null;
  const teaserPalette = teaserSlug ? seasonPalette(teaserSlug) : null;
  const teaserName = teaserSlug ? reportMessages?.seasons[teaserSlug]?.name : undefined;
  const teaser =
    teaserPalette && teaserName
      ? {
          name: teaserName,
          headline: lockScene && unlockReport ? proseFor(unlockReport, reportLang)?.headline : undefined,
          // 锁定的报告只免费露出前 3 个推荐色（和后端 LOCKED_FREE_COLORS 一致）；额度用完那一档展示的是上次结果，沿用同样的 3 个
          revealed: teaserPalette.bestColors.slice(0, FREE_COLOR_COUNT).map((c) => c.hex),
        }
      : null;
  // 三句「用上之后的感觉」：解锁页已经有季型预览，手机上空间紧，就不再放
  const emoKeys = creditsScene
    ? (["creditsEmo1", "creditsEmo2", "creditsEmo3"] as const)
    : buyerScene || upgradeScene
      ? null
      : (["kitEmo1", "kitEmo2", "kitEmo3"] as const);

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
        packBefore: packCredits,
        reportBefore: reportCredits,
        ...(unlockTaskId ? { unlockTaskId } : {}),
        ...(openTaskId ? { openTaskId } : {}),
        onRestore: () => setLoading(null),
      });
      // 成功后页面会整页跳转到支付页，保持 loading 状态
    } catch {
      setError(true);
      setLoading(null);
    }
  };

  const kitPrice = money("kit");
  const addonPrice = money("addon");
  const singlePrice = money("single");
  // 补差价：升级场景里只买过单份的人买升级包（内容和套装一样，价格是套装减去已付的单份），其余人仍买套装全价
  const topupOffer = upgradeScene && UPGRADE_TOPUP_ENABLED && upgradeTopup;
  const kitProduct: ProductKey = topupOffer ? "upgrade" : "kit";
  const kitCardPrice = topupOffer ? money("upgrade") : kitPrice;

  // 低价入口：只解锁这一份报告的文字内容和色彩试穿，完整 Lookbook 留给套装
  const singleCard = (
    <div className="rounded-xl border border-primary/40 bg-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-bold">{t("singleName")}</h3>
        <p className="text-2xl font-bold text-primary">{singlePrice}</p>
      </div>
      <ul className="mt-2 space-y-1">
        {(["singleItem1", "singleItem2", "singleItem3"] as const).map((key) => (
          <ModalFeature key={key} text={t(key)} />
        ))}
      </ul>
      <button
        onClick={() => handleCheckout("single")}
        disabled={loading !== null}
        className="mt-3 min-h-12 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-50"
      >
        {loading === "single" ? <LoadingDots /> : t("singleCta", { price: singlePrice })}
      </button>
    </div>
  );

  const kitCard = (
    <div className={`relative rounded-xl border-2 border-primary bg-card p-5 shadow-md ${singleOffer ? "mt-5" : ""}`}>
      <span className="absolute -top-3 left-5 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
        {singleOffer ? t("cardBadgeBest") : upgradeScene ? t("upgradeBadge") : t("cardBadge")}
      </span>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-bold">{t("cardName")}</h3>
        <p className="text-3xl font-bold text-primary">{kitCardPrice}</p>
      </div>
      {/* 价格锚点：线下一次专业色彩咨询的行情，让这个价格显得是「划算的那一档」；补差价时改成说清「已付的钱算进去了」 */}
      <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        {(topupOffer || !showInside) && (
          <p className={topupOffer ? "font-medium text-primary" : "italic"}>
            {topupOffer ? t("upgradeDiffNote", { paid: singlePrice, kit: kitPrice }) : t("priceAnchor")}
          </p>
        )}
        <p className="sm:shrink-0 sm:text-right">{t("cardNoSub")}</p>
      </div>
      <ul className="mt-3 space-y-1.5">
        {/* 免费重测（perk6）已经在按钮下面单独强调了，列表里不重复 */}
        {KIT_PERKS.filter((key) => key !== "perk6").map((key, index) => (
          // 手机上收起次要的几条，首屏就能看到价格和按钮
          <ModalFeature key={key} text={t(key, KIT_PERK_VALUES)} className={index >= 5 ? "max-sm:hidden" : ""} />
        ))}
      </ul>
      <button
        onClick={() => handleCheckout(kitProduct)}
        disabled={loading !== null}
        className="mt-4 min-h-12 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-50"
      >
        {loading === kitProduct ? (
          <LoadingDots />
        ) : upgradeScene ? (
          t("upgradeCta", { price: kitCardPrice })
        ) : lockScene ? (
          t("ctaLock", { price: kitPrice })
        ) : (
          t("cta", { price: kitPrice })
        )}
      </button>
      {/* 按钮正下方打消最后一点犹豫：不订阅，对结果没把握还能免费重测 */}
      <p className="mt-2 text-center text-xs leading-snug text-muted-foreground">{t("ctaAssure", KIT_PERK_VALUES)}</p>
    </div>
  );

  // 积分加购包：任何人都能买（试戴图每套 1 积分）；不能用来解锁色彩报告
  const addonCard = (
    <div className="relative rounded-xl border-2 border-primary bg-card p-5 shadow-md">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-bold">{t("addonTitle", { credits: ADDON_CREDITS })}</h3>
        <p className="text-3xl font-bold text-primary">{addonPrice}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("addonDesc")}</p>
      <button
        onClick={() => handleCheckout("addon")}
        disabled={loading !== null}
        className="mt-4 min-h-12 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
      >
        {loading === "addon" ? <LoadingDots /> : t("addonCta", { credits: ADDON_CREDITS, price: addonPrice })}
      </button>
    </div>
  );

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className="fixed inset-0 z-[200] flex items-end justify-center outline-none sm:items-center sm:p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
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
              <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        ) : (
          <div className="px-8 text-center">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        )}

        {teaser && (
          <UnlockTeaser
            lang={locale}
            label={t("lockSeasonLabel")}
            name={teaser.name}
            headline={teaser.headline}
            revealed={teaser.revealed}
            moreText={t("lockPaletteMore")}
          />
        )}

        {emoKeys && (
          <ul className={`mt-5 space-y-2 ${showInside || (teaser && lockScene) ? "max-sm:hidden" : ""}`}>
            {emoKeys.map((key) => (
              <li key={key} className="flex items-start gap-2.5 text-sm leading-snug text-foreground/85">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                </svg>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        )}

        {showInside && (
          <div className="mt-5 rounded-xl border border-border bg-card/60 px-3.5 py-3">
            <p className="text-xs font-semibold leading-snug text-foreground">{t("insideTitle")}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {insideKeys.map((key) => (
                <li key={key} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs leading-snug text-foreground/90">
                  <svg className="h-3 w-3 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path strokeLinecap="round" d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                  {t(key)}
                </li>
              ))}
            </ul>
            {/* 价格锚点：线下一次专业色彩咨询的行情，和首页的说法一致 */}
            <p className="mt-2 text-xs italic leading-snug text-muted-foreground">{t("priceAnchor")}</p>
          </div>
        )}

        <InAppBrowserNotice className="mt-3" />

        <div className="mt-6">
          {buyerFirst ? addonCard : singleOffer ? (
            <>
              {singleCard}
              {kitCard}
            </>
          ) : (
            kitCard
          )}
          {/* 老顾客：套装退到下面一行 */}
          {buyerFirst && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold">{t("cardName")}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(intent === "credits" ? "creditsKitDesc" : "buyerKitDesc")}</p>
              </div>
              <button
                onClick={() => handleCheckout("kit")}
                disabled={loading !== null}
                className="min-h-11 shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                {loading === "kit" ? <LoadingDots /> : kitPrice}
              </button>
            </div>
          )}
        </div>

        {/* 支付信任信息：离购买按钮最近的地方说清「怎么付、安不安全」 */}
        <PaymentTrust className="mt-4" />

        {inAppWarnProduct && (
          <InAppCheckoutEmailStep onContinue={(email) => handleCheckout(inAppWarnProduct, true, email)} />
        )}

        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-red-500">
            {tPricing("checkoutError")}
          </p>
        )}

        {/* 底部只留一行 AI 提示：「不订阅」已经在价格旁边说过，完整的模型来源说明在 /pricing 页 */}
        <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground/80">{tCommon("aiGeneratedNote")}</p>
      </div>
    </div>
  );
}

/**
 * 「你的结果就差一步」预览卡：她的季型名 + 她的推荐色（都是报告里免费显示的真实数据）+ 一句点明还没打开的内容。
 */
function UnlockTeaser({
  lang,
  label,
  name,
  headline,
  revealed,
  moreText,
}: {
  lang: string;
  label: string;
  name: string;
  headline?: string;
  revealed: string[];
  moreText: string;
}) {
  return (
    // report-root 只为让衬线字体的 CJK 回落按语言生效；不放标题标签，避免被报告的标题样式覆盖
    <div
      lang={lang}
      className="report-root mt-5 rounded-xl border border-gold/40 bg-gradient-to-br from-white via-white to-primary/10 px-4 py-4 text-center shadow-sm"
    >
      <p className="rp-label">{label}</p>
      <p className="report-serif mt-1 text-2xl font-semibold italic leading-tight sm:text-[1.7rem]">{name}</p>
      {headline && <p className="report-serif mx-auto mt-1.5 max-w-sm text-[13px] italic leading-snug text-muted-foreground">{headline}</p>}
      <div className="mt-3.5 flex items-center justify-center gap-1.5" aria-hidden>
        {revealed.map((hex, i) => (
          <span key={`${hex}-${i}`} className="h-6 w-6 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(0,0,0,0.07)]" style={{ background: hex }} />
        ))}
      </div>
      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <svg className="h-3.5 w-3.5 shrink-0 text-gold-deep" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        <span>{moreText}</span>
      </p>
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
