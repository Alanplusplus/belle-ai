import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildAlternates, buildBreadcrumbJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import { PricingButtons } from "./PricingButtons";
import { PricingTabs } from "./PricingTabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.pricingTitle,
    description: messages.meta.pricingDescription,
    alternates: buildAlternates(locale, "/pricing"),
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold">{t("title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Free tier - always visible */}
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{t("free")}</h3>
              <p className="text-sm text-muted-foreground">{t("freeDesc")}</p>
            </div>
            <span className="text-3xl font-bold">$0</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckIcon />
              {t("freeFeature1")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon />
              {t("freeFeature2")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon />
              {t("freeFeature3")}
            </span>
          </div>
          <Link
            href="/try"
            className="mt-4 block w-full rounded-full border border-primary py-2 text-center text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            {t("freeCta")}
          </Link>
        </div>

        {/* Tab switcher */}
        <PricingTabs labels={[t("tabSubscription"), t("tabCredits")]}>
          {/* Tab 1: Subscriptions */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly - highlighted */}
            <div className="relative rounded-2xl border-2 border-primary bg-card p-6 shadow-lg">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-xs font-semibold text-white">
                {t("monthlyOfferBadge")}
              </span>
              <h3 className="text-xl font-bold">{t("monthly")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("monthlyDesc")}
              </p>
              <div className="mt-4">
                <span className="text-base text-muted-foreground line-through mr-2">{t("monthlyPrice")}</span>
                <span className="text-4xl font-bold text-primary">{t("monthlyOfferPrice")}</span>
                <span className="text-muted-foreground">{t("monthlyPer")}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t("monthlyFirstMonth")}</p>
              <ul className="mt-4 space-y-3">
                <PricingFeature text={t("monthlyFeature1")} />
                <PricingFeature text={t("monthlyFeature2")} />
                <PricingFeature text={t("monthlyFeature3")} />
              </ul>
              <PricingButtons product="monthly" variant="primary" label={t("monthlyCta")} />
            </div>

            {/* Yearly */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground mb-2">
                {t("yearlyBadge")}
              </span>
              <h3 className="text-xl font-bold">{t("yearly")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("yearlyDesc")}
              </p>
              <div className="mt-4">
                <span className="text-4xl font-bold">{t("yearlyPrice")}</span>
                <span className="text-muted-foreground">{t("yearlyPer")}</span>
              </div>
              <ul className="mt-6 space-y-3">
                <PricingFeature text={t("yearlyFeature1")} />
                <PricingFeature text={t("yearlyFeature2")} />
                <PricingFeature text={t("yearlyFeature3")} />
              </ul>
              <PricingButtons product="yearly" variant="outline" label={t("yearlyCta")} />
            </div>
          </div>

          {/* Tab 2: Credit Packs */}
          <div>
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("creditsDesc")}
                <span className="mx-1.5 text-border">·</span>
                <span className="font-medium text-primary">{t("creditsNeverExpire")}</span>
              </p>
            </div>
            <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-2">
              {/* 5 Credits - with first-buy discount */}
              <div className="relative rounded-2xl border-2 border-primary bg-card p-6 shadow-lg">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-xs font-semibold text-white">
                  {t("smallFirstBuyNote")}
                </span>
                <h3 className="text-xl font-bold">{t("smallPack")}</h3>
                <div className="mt-4">
                  <span className="text-base text-muted-foreground line-through mr-2">{t("smallPrice")}</span>
                  <span className="text-4xl font-bold text-primary">{t("smallFirstBuyPrice")}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("smallPrice")} {t("creditsNeverExpire")}
                </p>
                <PricingButtons product="credits5" variant="primary" label={t("creditsCta")} />
              </div>

              {/* 12 Credits */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-xl font-bold">{t("largePack")}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{t("largePrice")}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("creditsNeverExpire")}
                </p>
                <PricingButtons product="credits12" variant="outline" label={t("creditsCta")} />
              </div>
            </div>
          </div>
        </PricingTabs>

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

        {/* Payment badge */}
        <div className="mt-10 flex justify-center">
          <a
            href="https://www.creem.io/"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-[10px] border-2 border-[#151617] bg-[#F5F2F0] px-3.5 py-2 shadow-[0_2px_0_0_#151617] transition hover:shadow-[0_1px_0_0_#151617] hover:translate-y-[1px] no-underline"
          >
            <span className="text-[13px] font-semibold leading-none text-[#5b5c5e]">Payments secured by</span>
            <CreemLogo />
            <span className="text-[13px] font-bold leading-none text-[#151617]">Creem</span>
          </a>
        </div>

      </div>
    </section>
    </>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
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

function CreemLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 121 121" fill="none" aria-hidden="true" className="block flex-shrink-0">
      <path d="M22.1102 11C24.1187 11 25.9669 12.0982 26.9281 13.8619L51.2059 58.4106C52.5699 60.9134 55.7048 61.8368 58.2077 60.473C60.7108 59.109 61.6342 55.9742 60.2701 53.4712L41.5466 19.113C39.554 15.4566 42.2004 11 46.3645 11H103.806C107.885 11 110.539 15.2933 108.715 18.9416L65.0579 106.254C63.0356 110.298 57.2654 110.298 55.2431 106.254L11.5863 18.9416C9.76212 15.2933 12.4156 11 16.4946 11H22.1102Z" fill="#B09CFB" />
    </svg>
  );
}
