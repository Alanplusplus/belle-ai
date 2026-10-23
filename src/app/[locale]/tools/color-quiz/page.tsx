import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import type { Metadata } from "next";
import { ColorQuizClient, type ParentCardTexts } from "./ColorQuizClient";
import { ToolFaq, ToolIntro, ToolRelated } from "@/components/ToolPageSections";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/tools/color-quiz");
  return {
    title: messages.meta.colorQuizTitle,
    description: messages.meta.colorQuizDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.colorQuizTitle,
      description: messages.meta.colorQuizDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.colorQuizTitle,
      description: messages.meta.colorQuizDescription,
    },
  };
}

export default async function ColorQuizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "colorQuiz" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const quiz = await getTranslations({ locale, namespace: "quiz" });
  const embed = await getTranslations({ locale, namespace: "embed" });
  const ph = await getTranslations({ locale, namespace: "paletteHub" });
  const cg = await getTranslations({ locale, namespace: "colorGuide" });
  // 结果页的色板卡片文案：这两个命名空间不在客户端语言包里，由这里取好传下去
  const parentCards: ParentCardTexts = Object.fromEntries(
    (["spring", "summer", "autumn", "winter"] as const).map((season) => {
      const name = cg(`${season}Name`);
      return [season, { alt: ph("cardAltParent", { season: name }), link: ph("viewParent", { season: name }) }];
    }),
  );
  const related = [
    { href: "/color-analysis", label: nav("colorAnalysisGuide") },
    { href: "/personal-color-analysis", label: nav("colorAnalysis") },
    { href: "/tools/undertone-test", label: nav("undertoneTest") },
    { href: "/lookbook", label: nav("lookbook") },
    { href: "/tools/embed", label: embed("linkLabel") },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
  ];

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
    { name: "Color Quiz", path: "/tools/color-quiz" },
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

      <ColorQuizClient parentCards={parentCards} />

      <ToolIntro text={t("seoIntro")} />
      <ToolFaq title={quiz("faqTitle")} faqs={faqs} />
      <ToolRelated title={t("relatedTitle")} links={related} />
    </>
  );
}
