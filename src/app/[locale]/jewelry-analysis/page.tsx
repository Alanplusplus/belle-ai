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
  const alternates = buildAlternates(locale, "/jewelry-analysis");
  return {
    title: messages.meta.jewelryTitle,
    description: messages.meta.jewelryDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.jewelryTitle,
      description: messages.meta.jewelryDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.jewelryTitle,
      description: messages.meta.jewelryDescription,
    },
  };
}

export default async function JewelryAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cta = await getFeatureCtaCopy(locale, "jewelry_guide");
  const t = await getTranslations({ locale, namespace: "jewelryPage" });
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
    { name: "Jewelry Analysis", path: "/jewelry-analysis" },
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
        description={w("jewelry.hero")}
        image="/images/examples/report_jewelry_guide.webp"
        sampleLabel={tp("demoBadge")}
        actions={<FeatureHeroActions tool="jewelry_guide" copy={cta} />}
      />

      <FeatureWhy locale={locale} tool="jewelry" kitLink />

      <section className="bg-muted/30 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <FeatureCta tool="jewelry_guide" copy={cta} from="feature_mid" />
        </div>
      </section>

      <ClampedIntro text={t("seoIntro")} moreLabel={bt("readMore")} />

      <ToolFaq title={t("faqTitle")} faqs={faqs} />

      <FeatureCta variant="end" tool="jewelry_guide" copy={cta} from="feature_end" />
    </>
  );
}


