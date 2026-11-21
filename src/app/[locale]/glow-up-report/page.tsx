import { getTranslations } from "next-intl/server";
import { FeatureCta, FeatureHeroActions, getFeatureCtaCopy } from "@/components/FeatureCta";
import { FeatureHero } from "@/components/FeatureHero";
import { FeatureWhy } from "@/components/FeatureWhy";
import { ClampedIntro } from "@/components/ClampedIntro";
import { ToolFaq } from "@/components/ToolPageSections";
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
  const cta = await getFeatureCtaCopy(locale, "glow_up_report");
  const t = await getTranslations({ locale, namespace: "glowUpPage" });
  const tp = await getTranslations({ locale, namespace: "tryPage" });
  const w = await getTranslations({ locale, namespace: "featureWhy" });
  const bt = await getTranslations({ locale, namespace: "blog" });

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
        description={w("glow.hero")}
        image="/images/examples/report_glow_up_report.webp"
        sampleLabel={tp("demoBadge")}
        badge={
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            {t("creditBadge")}
          </span>
        }
        actions={<FeatureHeroActions tool="glow_up_report" copy={cta} />}
      />

      <FeatureWhy locale={locale} tool="glow" note="single" />

      <section className="bg-muted/30 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <FeatureCta tool="glow_up_report" copy={cta} from="feature_mid" />
        </div>
      </section>

      <ClampedIntro text={t("seoIntro")} moreLabel={bt("readMore")} />

      <ToolFaq title={t("faqTitle")} faqs={faqs} />

      <FeatureCta variant="end" tool="glow_up_report" copy={cta} from="feature_end" />
    </>
  );
}

