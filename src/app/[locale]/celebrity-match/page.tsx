import { getTranslations } from "next-intl/server";
import { FeatureCta, FeatureHeroActions, getFeatureCtaCopy } from "@/components/FeatureCta";
import { FeatureHero } from "@/components/FeatureHero";
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
import { FeatureWhy } from "@/components/FeatureWhy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/celebrity-match");
  return {
    title: messages.meta.celebrityTitle,
    description: messages.meta.celebrityDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.celebrityTitle,
      description: messages.meta.celebrityDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.celebrityTitle,
      description: messages.meta.celebrityDescription,
    },
  };
}

export default async function CelebrityMatchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cta = await getFeatureCtaCopy(locale, "celebrity_match");
  const t = await getTranslations({ locale, namespace: "celebrityPage" });
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
    { name: "Celebrity Match", path: "/celebrity-match" },
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
        description={w("celebrity.hero")}
        image="/images/examples/report_celebrity_season.webp"
        sampleLabel={tp("demoBadge")}
        actions={<FeatureHeroActions tool="celebrity_match" copy={cta} />}
      />

      <FeatureWhy locale={locale} tool="celebrity" note={null} />

      <section className="bg-muted/30 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <FeatureCta tool="celebrity_match" copy={cta} from="feature_mid" />
        </div>
      </section>

      <ClampedIntro text={t("seoIntro")} moreLabel={bt("readMore")} />

      <ToolFaq title={t("faqTitle")} faqs={faqs} />

      <FeatureCta variant="end" tool="celebrity_match" copy={cta} from="feature_end" />
    </>
  );
}
