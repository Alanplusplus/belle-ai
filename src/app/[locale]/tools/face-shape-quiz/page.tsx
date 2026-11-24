import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import type { Metadata } from "next";
import { FaceShapeQuizClient } from "./FaceShapeQuizClient";
import { ClampedIntro } from "@/components/ClampedIntro";
import { ToolFaq, ToolGuide, ToolRelated, type GuideBlock } from "@/components/ToolPageSections";
import { FACE_SHAPES, FACE_SHAPE_SLUGS } from "@/lib/face-shape-data";
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
  const bt = await getTranslations({ locale, namespace: "blog" });
  const embed = await getTranslations({ locale, namespace: "embed" });
  const related = [
    { href: "/face-shape-analysis", label: nav("faceAnalysis") },
    { href: "/glasses-analysis", label: nav("glassesMatch") },
    { href: "/hair-color-analysis", label: nav("hairPreview") },
    { href: "/blog", label: nav("blog") },
    { href: "/tools/embed", label: embed("linkLabel") },
  ];

  // 前 4 条所有语种都有；第 5 条起是按搜索问句补的问答，哪个语种写了就显示哪条
  const faqs = [1, 2, 3, 4, 5, 6, 7, 8]
    .filter((n) => t.has(`faq${n}Q`))
    .map((n) => ({ q: t(`faq${n}Q`), a: t(`faq${n}A`) }));

  // 答案块（怎么判断 / 7 种脸型一览 / 测验还是照片）：哪个语种写了就显示；脸型表直接读现有的 fs.<slug> 数据，和 /face-shape/* 页面一致
  const guideSections: { title: string; blocks: GuideBlock[] }[] = [];
  if (t.has("guideStepsTitle")) {
    const fc = await getTranslations({ locale, namespace: "face" });
    const fsAll = await getTranslations({ locale, namespace: "fs" });
    const shapeName = (slug: string) => {
      const key = `shape${FACE_SHAPES[slug].name}`;
      return fc.has(key) ? fc(key) : FACE_SHAPES[slug].name;
    };
    const proportions = (slug: string) =>
      fsAll.has(`${slug}.proportions`) ? fsAll(`${slug}.proportions`) : FACE_SHAPES[slug].characteristics.proportions;
    guideSections.push(
      { title: t("guideStepsTitle"), blocks: [{ type: "steps", items: [1, 2, 3, 4].map((n) => t(`guideStep${n}`)) }] },
      {
        title: t("guideShapesTitle"),
        blocks: [
          {
            type: "table",
            head: [t("guideShapesColShape"), t("guideShapesColLook")],
            rows: FACE_SHAPE_SLUGS.map((slug) => ({
              cells: [shapeName(slug), proportions(slug)],
              href: `/face-shape/${slug}`,
            })),
          },
        ],
      },
      { title: t("guideCompareTitle"), blocks: [{ type: "text", paragraphs: [t("guideCompareText")] }] },
    );
  }

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

      <ClampedIntro text={t("seoIntro")} moreLabel={bt("readMore")} />
      <ToolGuide sections={guideSections} />
      <ToolFaq title={quiz("faqTitle")} faqs={faqs} />
      <ToolRelated title={t("relatedTitle")} links={related} />
    </>
  );
}
