import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import type { Metadata } from "next";
import { FaceShapeQuizClient } from "./FaceShapeQuizClient";
import { ToolFaq, ToolIntro, ToolRelated } from "@/components/ToolPageSections";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/tools/face-shape-quiz");
  return {
    title: messages.meta.faceQuizTitle,
    description: messages.meta.faceQuizDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.faceQuizTitle,
      description: messages.meta.faceQuizDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.faceQuizTitle,
      description: messages.meta.faceQuizDescription,
    },
  };
}

export default async function FaceShapeQuizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faceQuiz" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const quiz = await getTranslations({ locale, namespace: "quiz" });
  const embed = await getTranslations({ locale, namespace: "embed" });
  const related = [
    { href: "/face-shape-analysis", label: nav("faceAnalysis") },
    { href: "/glasses-analysis", label: nav("glassesMatch") },
    { href: "/hair-color-analysis", label: nav("hairPreview") },
    { href: "/blog", label: nav("blog") },
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
    { name: "Face Shape Quiz", path: "/tools/face-shape-quiz" },
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

      <FaceShapeQuizClient />

      <ToolIntro text={t("seoIntro")} />
      <ToolFaq title={quiz("faqTitle")} faqs={faqs} />
      <ToolRelated title={t("relatedTitle")} links={related} />
    </>
  );
}
