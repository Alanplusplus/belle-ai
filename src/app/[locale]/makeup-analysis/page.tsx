import { getTranslations } from "next-intl/server";
import { ClampedIntro } from "@/components/ClampedIntro";
import { ToolFaq } from "@/components/ToolPageSections";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { FeatureCta, FeatureHeroActions, getFeatureCtaCopy } from "@/components/FeatureCta";
import { FeatureHero } from "@/components/FeatureHero";
import { FeatureWhy } from "@/components/FeatureWhy";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/makeup-analysis");
  return {
    title: messages.meta.makeupTitle,
    description: messages.meta.makeupDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.makeupTitle,
      description: messages.meta.makeupDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.makeupTitle,
      description: messages.meta.makeupDescription,
    },
  };
}

export default async function MakeupAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cta = await getFeatureCtaCopy(locale, "makeup");
  const t = await getTranslations({ locale, namespace: "makeup" });
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
    { name: "Makeup Analysis", path: "/makeup-analysis" },
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
        description={w("makeup.hero")}
        image="/images/examples/report_makeup.webp"
        sampleLabel={tp("demoBadge")}
        actions={<FeatureHeroActions tool="makeup" copy={cta} />}
      />

      <FeatureWhy locale={locale} tool="makeup" />

      {/* 原来这里是「Why AI Color Analysis?」四条（60 秒 / 比色彩分析师便宜 / 杂志级报告）：是色彩分析的通用文案，
          放在美妆分析页主题不对；这页的卖点由上面的「包含什么」交代。features.whyAI 等键保留不动。
          页面中段的入口用一张成品示例卡（标题写清楚「点进去会得到什么」），不再是通用的 Start Free Analysis */}
      <section className="bg-muted/30 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <FeatureCta tool="makeup" copy={cta} from="feature_mid" />
        </div>
      </section>
      <ClampedIntro text={t("seoIntro")} moreLabel={bt("readMore")} />

      <ToolFaq title={t("faqTitle")} faqs={faqs} />

      <FeatureCta variant="end" tool="makeup" copy={cta} from="feature_end" />
    </>
  );
}


