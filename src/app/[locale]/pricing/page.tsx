import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { ADDON_CREDITS, CREDIT_PACKS } from "@/lib/constants";
import { KIT_PERKS, KIT_PERK_VALUES } from "@/lib/kit";
import type { Metadata } from "next";
import { PricingButtons, PricingViewTracker } from "./PricingButtons";
import { ExtraMessages } from "@/components/ExtraMessages";
import { InAppBrowserNotice } from "@/components/InAppBrowserNotice";
import { RestorePurchaseHint } from "@/components/RestorePurchaseHint";
import { LocalPrice, PricedText } from "@/components/LocalPrice";
import { PaymentTrust } from "@/components/PaymentTrust";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/pricing");
  const title: string = messages.kit.metaTitle;
  const description: string = messages.kit.metaDescription;
  return {
    title,
    description,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title,
      description,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** 套装里的功能（色彩报告的各个部分）和用积分生成效果图的功能：价格页底部按这两组列出，每个都能点进对应的功能介绍页 */
const KIT_TOOLS = [
  { href: "/color-analysis", key: "colorAnalysis" },
  { href: "/celebrity-match", key: "celebrityMatch" },
] as const;
const CREDIT_TOOLS = [
  { href: "/makeup-analysis", key: "makeupAnalysis" },
  { href: "/face-shape-analysis", key: "faceAnalysis" },
  { href: "/hair-color-analysis", key: "hairPreview" },
  { href: "/outfit-color-analysis", key: "outfitColor" },
  { href: "/glasses-analysis", key: "glassesMatch" },
  { href: "/occasion-makeup", key: "occasionMakeup" },
  { href: "/jewelry-analysis", key: "jewelryGuide" },
  { href: "/glow-up-report", key: "glowUpReport" },
  { href: "/style-personality", key: "stylePersonality" },
] as const;
type ToolHref = (typeof KIT_TOOLS)[number]["href"] | (typeof CREDIT_TOOLS)[number]["href"];

/**
 * 定价页：免费 + 色彩套装（主推）+ 积分包三列，没有订阅。
 * 价格会随访客所在地换币种，所以带价格的文案都交给 LocalPrice / PricedText 这两个客户端组件渲染。
 * 积分包不能解锁色彩报告（只能给其他分析生成效果图），卡片上写明，免得买错。
 */
export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "kit" });
  const tPricing = await getTranslations({ locale, namespace: "pricing" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  // 页面里的客户端组件（PricedText、RestorePurchaseHint）要在客户端取 kit 文案，这里按页面注入
  const kitMessages = (await import(`@/messages/${locale}.json`)).default.kit;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [{ name: "Pricing", path: "/pricing" }]);

  const validUntil = new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split("T")[0];
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Belle AI - Color Kit",
    description:
      "AI personal color analysis: your season, undertone, best colors, makeup, hair and jewelry picks, PDF report, try-on board and a free re-test. One-time payment, no subscription.",
    brand: { "@type": "Brand", name: "Belle AI" },
    offers: [
      {
        "@type": "Offer",
        name: "Free preview",
        price: "0",
        priceCurrency: "USD",
        description: "Free color report preview, a written result from every tool and your first result photo",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: `Credit Pack (${ADDON_CREDITS} credits)`,
        price: CREDIT_PACKS.addon.price,
        priceCurrency: "USD",
        description: "Credits for result photos of any analysis: hair, makeup, glasses, jewelry and more. One-time purchase, credits never expire.",
        availability: "https://schema.org/InStock",
        priceValidUntil: validUntil,
      },
      {
        "@type": "Offer",
        name: "Color Kit",
        price: CREDIT_PACKS.kit.price,
        priceCurrency: "USD",
        description: "Full color report, PDF and poster, try-on board, free re-test for 14 days and extra credits. One-time purchase.",
        availability: "https://schema.org/InStock",
        priceValidUntil: validUntil,
      },
    ],
  };

  return (
    <ExtraMessages messages={{ kit: kitMessages }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <section className="py-10 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold sm:text-4xl">{t("pageTitle")}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">{t("pageSubtitle")}</p>
          </div>

          {/* 内置浏览器里购买记录不会跟随到系统浏览器：提前提示用系统浏览器打开再付款 */}
          <InAppBrowserNotice className="mx-auto mt-6 max-w-xl" />

          <div className="mx-auto mt-10 grid gap-6 pt-3 md:grid-cols-3">
            {/* 免费部分：手机上排在最后，不抢首屏；桌面在最左 */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 max-md:order-3 md:order-1">
              <h3 className="text-xl font-bold">{t("freeName")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("freeDesc")}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold"><LocalPrice spec="free" /></span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                <Feature text={t("freeItem1")} />
                <Feature text={t("freeItem2")} />
                <Feature text={t("freeItem3")} />
              </ul>
              <Link
                href="/try"
                className="mt-6 block w-full rounded-full border border-primary py-2.5 text-center text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                {t("freeCta")}
              </Link>
            </div>

            {/* 套装：整页主推，居中、描边加粗 */}
            <div id="pricing-kit-card" className="relative flex scroll-mt-24 flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-lg max-md:order-1 md:order-2">
              <span className="absolute -top-3 left-6 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                {t("cardBadge")}
              </span>
              <h3 className="text-xl font-bold">{t("cardName")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("cardNoSub")}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary"><LocalPrice spec="kit" /></span>
              </div>
              <ul className="mt-5 flex-1 space-y-3">
                {KIT_PERKS.map((key) => (
                  <Feature key={key} text={t(key, KIT_PERK_VALUES)} />
                ))}
              </ul>
              <PricingButtons product="kit" label={<PricedText k="cta" prices={{ price: "kit" }} />} />
              <Link href="/color-analysis" className="mt-3 block text-center text-xs font-medium text-primary hover:underline">
                {t("kitSeeExample")}
              </Link>
            </div>

            {/* 积分包：给想看其他分析效果图的人（不含色彩报告），次要，描边按钮 */}
            <div id="pricing-addon-card" className="flex scroll-mt-24 flex-col rounded-2xl border border-border bg-card p-6 max-md:order-2 md:order-3">
              <h3 className="text-xl font-bold">{t("addonCardName")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("addonCardSub")}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold"><LocalPrice spec="addon" /></span>
              </div>
              <ul className="mt-5 flex-1 space-y-3">
                <Feature text={t("addonItem1", { credits: ADDON_CREDITS })} />
                <Feature text={t("addonItem2")} />
                <Feature text={t("addonItem3")} />
              </ul>
              <p className="mt-5 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">{t("addonNote")}</p>
              <PricingButtons
                product="addon"
                variant="outline"
                label={<PricedText k="addonCta" prices={{ price: "addon" }} values={{ credits: ADDON_CREDITS }} />}
              />
              <a href="#pricing-tools" className="mt-3 block text-center text-xs font-medium text-primary hover:underline">
                {t("addonSeeTools")}
              </a>
            </div>
          </div>

          {/* 想先看看某个功能做什么：按「套装里的」和「用积分生成效果图的」分两组，点进对应的功能介绍页 */}
          <div id="pricing-tools" className="mt-14 scroll-mt-24">
            <h2 className="text-center font-serif text-2xl font-bold">{t("toolsTitle")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">{t("toolsSubtitle")}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ToolGroup title={t("toolsKitGroup")} hint={t("toolsKitHint")} items={KIT_TOOLS.map((tool) => ({ href: tool.href, label: tNav(tool.key) }))} />
              <ToolGroup
                className="md:col-span-2"
                columns
                title={t("toolsCreditGroup")}
                hint={t("toolsCreditHint")}
                items={CREDIT_TOOLS.map((tool) => ({ href: tool.href, label: tNav(tool.key) }))}
              />
            </div>
          </div>

          {/* 怎么用：三步，让第一次来的人知道「先免费看、满意再买」 */}
          <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("stepsTitle")}</h3>
            <ol className="mt-5 grid gap-4 sm:grid-cols-3">
              {(["step1", "step2", "step3"] as const).map((key, index) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                  <div>
                    <p className="text-sm font-semibold">{t(`${key}Title`)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(`${key}Desc`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* 支付信任信息：离购买按钮最近的地方说清「怎么付、安不安全」 */}
          <PaymentTrust className="mt-8" />

          <RestorePurchaseHint className="mx-auto mt-6 max-w-2xl" />

          <p className="mt-4 text-center text-xs text-muted-foreground">{t("billingNote")}</p>
          {/* 底层模型披露 + AI 生成内容标注（支付服务商的 AIGC 合规要求） */}
          <p className="mt-2 text-center text-xs text-muted-foreground">{tPricing("aiDisclosure")}</p>

          {/* Payment badge */}
          <div className="mt-10 flex justify-center">
            <a
              href="https://waffo.ai/"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-muted/50 px-3.5 py-2 transition hover:bg-muted no-underline"
            >
              <span className="text-[13px] font-semibold leading-none text-muted-foreground">Payments secured by</span>
              <span className="text-[13px] font-bold leading-none text-foreground">Waffo</span>
            </a>
          </div>
        </div>
      </section>
      <PricingViewTracker />
    </ExtraMessages>
  );
}

function ToolGroup({ title, hint, items, className = "", columns = false }: { title: string; hint: string; items: { href: ToolHref; label: string }[]; className?: string; columns?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <ul className={`mt-4 grid gap-2 ${columns ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:border-primary/50 hover:bg-primary/5"
            >
              <span>{item.label}</span>
              <span aria-hidden="true" className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      {text}
    </li>
  );
}
