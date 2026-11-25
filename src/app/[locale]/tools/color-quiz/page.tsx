import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import type { Metadata } from "next";
import { ColorQuizClient, type ParentCardTexts } from "./ColorQuizClient";
import { ClampedIntro } from "@/components/ClampedIntro";
import { ToolFaq, ToolGuide, ToolRelated, type GuideBlock } from "@/components/ToolPageSections";
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
  const bt = await getTranslations({ locale, namespace: "blog" });
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

  // 前 4 条所有语种都有；第 5 条起是按搜索问句补的问答，哪个语种写了就显示哪条
  const faqs = [1, 2, 3, 4, 5, 6, 7, 8]
    .filter((n) => t.has(`faq${n}Q`))
    .map((n) => ({ q: t(`faq${n}Q`), a: t(`faq${n}A`) }));

  // 答案块（怎么判断 / 4 种色型一览 / 测验还是照片）：哪个语种写了就显示；色型名称和推荐色直接读结果页已有文案
  const guideSections: { title: string; blocks: GuideBlock[] }[] = [];
  if (t.has("guideStepsTitle")) {
    const seasons = [
      { key: "spring", under: "guideSpringUndertone", look: "guideSpringLook" },
      { key: "summer", under: "guideSummerUndertone", look: "guideSummerLook" },
      { key: "autumn", under: "guideAutumnUndertone", look: "guideAutumnLook" },
      { key: "winter", under: "guideWinterUndertone", look: "guideWinterLook" },
    ] as const;
    guideSections.push(
      { title: t("guideStepsTitle"), blocks: [{ type: "steps", items: [1, 2, 3, 4].map((n) => t(`guideStep${n}`)) }] },
      {
        title: t("guideTableTitle"),
        blocks: [
          {
            type: "table",
            head: [t("guideColType"), t("guideColUndertone"), t("guideColLook"), t("guideColColors")],
            rows: seasons.map((s) => ({
              cells: [t(`result_${s.key}_title`), t(s.under), t(s.look), t(`result_${s.key}_best`)],
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

      <ClampedIntro text={t("seoIntro")} moreLabel={bt("readMore")} />
      <ToolGuide sections={guideSections} />
      <ToolFaq title={quiz("faqTitle")} faqs={faqs} />
      <ToolRelated title={t("relatedTitle")} links={related} />
    </>
  );
}
