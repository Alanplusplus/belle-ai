import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import { WEEKLY_INTRO_PRICE } from "@/lib/constants";
import type { Metadata } from "next";
import { PricingButtons } from "./PricingButtons";
import { PricingStickyBar } from "./PricingStickyBar";
import { InAppBrowserNotice } from "@/components/InAppBrowserNotice";
import { RestoreSubscriptionHint } from "@/components/RestoreSubscriptionHint";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/pricing");
  return {
    title: messages.meta.pricingTitle,
    description: messages.meta.pricingDescription,
    alternates,
    openGraph: {
      title: messages.meta.pricingTitle,
      description: messages.meta.pricingDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.pricingTitle,
      description: messages.meta.pricingDescription,
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Pricing", path: "/pricing" },
  ]);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Belle AI - Color Analysis",
    description: "AI-powered personal color analysis with makeup, hair, outfit, and accessory recommendations.",
    brand: { "@type": "Brand", name: "Belle AI" },
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "3 free AI analyses",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Weekly",
        price: "3.99",
        priceCurrency: "USD",
        description: `50 analyses per week, 4K resolution. New subscribers: first week $${WEEKLY_INTRO_PRICE}, then $3.99/week`,
        availability: "https://schema.org/InStock",
        priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split("T")[0],
      },
      {
        "@type": "Offer",
        name: "Yearly",
        price: "29.99",
        priceCurrency: "USD",
        description: "50 analyses per week, 4K resolution, billed yearly",
        availability: "https://schema.org/InStock",
        priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split("T")[0],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    <section className="py-10 pb-24 sm:py-20 lg:pb-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
        </div>

        {/* 内置浏览器里订阅与记录不会跟随到系统浏览器：提前提示用系统浏览器打开再付款 */}
        <InAppBrowserNotice className="mx-auto mt-6 max-w-xl" />

        {/* All plans in one row */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-3">
          {/* Free（手机上排最后：主推的 Weekly 放最前，Free 不抢首屏） */}
          <div className="rounded-2xl border border-border bg-card p-6 max-lg:order-3">
            <h3 className="text-xl font-bold">{t("free")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("freeDesc")}</p>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
            </div>
            <ul className="mt-6 space-y-3">
              <PricingFeature text={t("freeFeature1")} />
              <PricingFeature text={t("freeFeature2")} />
              <PricingFeature text={t("freeFeature3")} />
            </ul>
            <Link
              href="/try"
              className="mt-6 block w-full rounded-full border border-primary py-2.5 text-center text-sm font-semibold text-primary transition hover:bg-primary/5"
            >
              {t("freeCta")}
            </Link>
          </div>

          {/* Weekly - highlighted */}
          <div id="pricing-weekly-card" className="relative scroll-mt-24 rounded-2xl border-2 border-primary bg-card p-6 shadow-lg max-lg:order-1">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-xs font-semibold text-white">
              {t("weeklyIntroBadge", { price: WEEKLY_INTRO_PRICE })}
            </span>
            <h3 className="text-xl font-bold">{t("weekly")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("weeklyDesc")}
            </p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-primary">{t("weeklyPrice")}</span>
              <span className="text-muted-foreground">{t("weeklyPer")}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t("weeklyIntroNote", { price: WEEKLY_INTRO_PRICE })}</p>
            <ul className="mt-4 space-y-3">
              <PricingFeature text={t("weeklyFeature1")} />
              <PricingFeature text={t("weeklyFeature2")} />
              <PricingFeature text={t("weeklyFeature3")} />
              <PricingFeature text={t("weeklyFeature4")} />
            </ul>
            <PricingButtons product="weekly" variant="primary" label={t("weeklyCta", { price: WEEKLY_INTRO_PRICE })} />
          </div>

          {/* Yearly */}
          <div className="rounded-2xl border border-border bg-card p-6 max-lg:order-2">
            <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground mb-2">
              {t("yearlyBadge")}
            </span>
            <h3 className="text-xl font-bold">{t("yearly")}</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold">{t("yearlyPrice")}</span>
              <span className="text-muted-foreground">{t("yearlyPer")}</span>
            </div>
            <ul className="mt-6 space-y-3">
              <PricingFeature text={t("yearlyFeature1")} />
              <PricingFeature text={t("yearlyFeature2")} />
              <PricingFeature text={t("yearlyFeature3")} />
              <PricingFeature text={t("yearlyFeature4")} />
            </ul>
            <PricingButtons product="yearly" variant="outline" label={t("yearlyCta")} />
          </div>
        </div>

        <RestoreSubscriptionHint className="mx-auto mt-6 max-w-2xl" />

        <p className="mt-4 text-center text-xs text-muted-foreground">{t("billingNote")}</p>
        {/* 底层模型披露 + AI 生成内容标注（支付服务商的 AIGC 合规要求） */}
        <p className="mt-2 text-center text-xs text-muted-foreground">{t("aiDisclosure")}</p>

        {/* Analysis Types & Credit Cost */}
        <div className="mt-12 rounded-2xl border border-border bg-card p-6">
          <h3 className="text-xl font-bold">{t("analysisTypes")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("analysisTypesDesc")}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ANALYSIS_OPTIONS.map((a) => (
              <div key={a.type} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">{a.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t(`at_${a.type}`)}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.credits > 1 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>
                  {a.credits}x
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Guarantees */}
        <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
          <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("guaranteeTitle")}</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold">{t("guaranteeFreeTitle")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("guaranteeFreeDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold">{t("guaranteeNoAccountTitle")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("guaranteeNoAccountDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold">{t("guaranteePrivacyTitle")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("guaranteePrivacyDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold">{t("guaranteeCancelTitle")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("guaranteeCancelDesc")}</p>
              </div>
            </div>
          </div>
        </div>

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
    <PricingStickyBar targetId="pricing-weekly-card" />
    </>
  );
}

function PricingSvg({ d }: { d: string }) {
  return <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}

const ANALYSIS_OPTIONS: { type: string; icon: React.ReactNode; credits: number }[] = [
  { type: "color_analysis", icon: <PricingSvg d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />, credits: 1 },
  { type: "makeup", icon: <PricingSvg d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />, credits: 1 },
  { type: "face_shape", icon: <PricingSvg d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, credits: 1 },
  { type: "hair_preview", icon: <PricingSvg d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm9.304 0l-1.536.887M17.152 8.25a3 3 0 105.196-3 3 3 0 00-5.196 3zM12 18.75l-3.537-5.29m3.537 5.29l3.537-5.29M12 18.75l-7.5-10.5h15l-7.5 10.5z" />, credits: 1 },
  { type: "outfit_color", icon: <PricingSvg d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />, credits: 1 },
  { type: "glasses_match", icon: <PricingSvg d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />, credits: 1 },
  { type: "occasion_makeup", icon: <PricingSvg d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />, credits: 1 },
  { type: "jewelry_guide", icon: <PricingSvg d="M12 3l8 5v8l-8 5-8-5V8l8-5z" />, credits: 1 },
  { type: "style_personality", icon: <PricingSvg d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />, credits: 1 },
  { type: "celebrity_match", icon: <PricingSvg d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />, credits: 1 },
  { type: "glow_up_report", icon: <PricingSvg d="M3 18l3-12 6 6 6-6 3 12H3z" />, credits: 3 },
];

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <svg
        className="h-4 w-4 shrink-0 text-primary"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
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

