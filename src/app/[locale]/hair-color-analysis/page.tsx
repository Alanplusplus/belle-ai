import { getTranslations } from "next-intl/server";
import { FeatureCta, FeatureHeroActions, getFeatureCtaCopy } from "@/components/FeatureCta";
import { FeatureHero } from "@/components/FeatureHero";
import { FeatureWhy } from "@/components/FeatureWhy";
import { QuickAnswerSection } from "@/components/QuickAnswer";
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
  const alternates = buildAlternates(locale, "/hair-color-analysis");
  return {
    title: messages.meta.hairTitle,
    description: messages.meta.hairDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.hairTitle,
      description: messages.meta.hairDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.hairTitle,
      description: messages.meta.hairDescription,
    },
  };
}

export default async function HairColorAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cta = await getFeatureCtaCopy(locale, "hair_preview");
  const t = await getTranslations({ locale, namespace: "hairPage" });
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
    { name: "Hair Color Analysis", path: "/hair-color-analysis" },
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
        description={w("hair.hero")}
        image="/images/examples/report_hair_preview.webp"
        sampleLabel={tp("demoBadge")}
        actions={<FeatureHeroActions tool="hair_preview" copy={cta} />}
      />

      <FeatureWhy locale={locale} tool="hair" kitLink />

      {/* 关键事实（费用 / 限制 / 方法 / 照片去向）折叠成一行；一句话答案已经在首屏，不再单独占一块 */}
      <QuickAnswerSection locale={locale} variant="tool" collapsed />

      <section className="bg-muted/30 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <FeatureCta tool="hair_preview" copy={cta} from="feature_mid" />
        </div>
      </section>

      <ClampedIntro text={t("seoIntro")} moreLabel={bt("readMore")} />

      <ToolFaq title={t("faqTitle")} faqs={faqs} />

      <FeatureCta variant="end" tool="hair_preview" copy={cta} from="feature_end" />
    </>
  );
}


