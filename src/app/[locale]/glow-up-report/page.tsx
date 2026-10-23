import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeatureHero } from "@/components/FeatureHero";
import Image from "next/image";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/glow-up-report");
  return {
    title: messages.meta.glowUpTitle,
    description: messages.meta.glowUpDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.glowUpTitle,
      description: messages.meta.glowUpDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.glowUpTitle,
      description: messages.meta.glowUpDescription,
    },
  };
}

export default async function GlowUpReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "glowUpPage" });
  const ft = await getTranslations({ locale, namespace: "features" });
  const tp = await getTranslations({ locale, namespace: "tryPage" });

  const faqCount = 5;
  const faqs = Array.from({ length: faqCount }, (_, i) => ({
    q: t(`faq${i + 1}Q`),
    a: t(`faq${i + 1}A`),
  }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Glow Up Report", path: "/glow-up-report" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FeatureHero
        title={t("title")}
        subtitle={t("subtitle")}
        description={t("description")}
        image="/images/examples/report_glow_up_report.webp"
        sampleLabel={tp("demoBadge")}
        badge={
          <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800">
            {t("premiumBadge")}
          </span>
        }
        actions={
          <Link
            href="/try?type=glow_up_report"
            className="inline-block rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        }
      />

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold">{t("includes")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECTIONS.map((s) => (
              <div key={s.image} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-amber-400/40 hover:shadow-lg">
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={s.image}
                    alt={t(s.labelKey)}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                  />
                </div>
                <p className="p-3 text-center text-sm font-medium">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold">{t("comparison")}</h2>
          <p className="mt-2 text-muted-foreground">{t("comparisonDesc")}</p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-3 text-left"></th>
                  <th className="px-4 py-3">{t("standard")}</th>
                  <th className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20">{t("glowUp")}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border"><td className="px-4 py-2.5">{t("row1")}</td><td className="px-4 py-2.5 text-center">1</td><td className="px-4 py-2.5 text-center bg-amber-50/50 dark:bg-amber-950/10 font-medium">8</td></tr>
                <tr className="border-b border-border"><td className="px-4 py-2.5">{t("row2")}</td><td className="px-4 py-2.5 text-center">1</td><td className="px-4 py-2.5 text-center bg-amber-50/50 dark:bg-amber-950/10 font-medium">3</td></tr>
                <tr><td className="px-4 py-2.5">{t("row3")}</td><td className="px-4 py-2.5 text-center">—</td><td className="px-4 py-2.5 text-center bg-amber-50/50 dark:bg-amber-950/10 font-medium">✓</td></tr>
              </tbody>
            </table>
          </div>
          <Link
            href="/try?type=glow_up_report"
            className="mt-10 inline-block rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-gray-700 leading-relaxed text-base">{t("seoIntro")}</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-semibold mb-6">{t("faqTitle")}</h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details key={i} className="group border-b border-gray-200 pb-4">
              <summary className="cursor-pointer font-medium text-gray-900 group-open:text-amber-600 transition-colors">
                {faq.q}
              </summary>
              <p className="mt-3 text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

const SECTIONS = [
  { image: "/images/dim_glow_color.webp", labelKey: "sec1" },
  { image: "/images/dim_glow_face.webp", labelKey: "sec2" },
  { image: "/images/dim_glow_hair.webp", labelKey: "sec3" },
  { image: "/images/dim_glow_makeup.webp", labelKey: "sec4" },
  { image: "/images/dim_glow_glasses.webp", labelKey: "sec5" },
  { image: "/images/dim_glow_jewelry.webp", labelKey: "sec6" },
  { image: "/images/dim_glow_wardrobe.webp", labelKey: "sec7" },
  { image: "/images/dim_glow_premium.webp", labelKey: "sec8" },
];
