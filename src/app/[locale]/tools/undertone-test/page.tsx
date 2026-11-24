import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  canonicalUrl,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import type { Metadata } from "next";
import { UndertoneTestClient } from "./UndertoneTestClient";
import { ClampedIntro } from "@/components/ClampedIntro";
import { ToolFaq, ToolGuide, ToolRelated, type GuideBlock } from "@/components/ToolPageSections";
import { VideoSection } from "@/components/VideoEmbed";
import { getVideoForTool } from "@/lib/videos";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/tools/undertone-test");
  return {
    title: messages.meta.undertoneTitle,
    description: messages.meta.undertoneDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.undertoneTitle,
      description: messages.meta.undertoneDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.undertoneTitle,
      description: messages.meta.undertoneDescription,
    },
  };
}

export default async function UndertoneTestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "undertoneTest" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const cq = await getTranslations({ locale, namespace: "colorQuiz" });
  const quiz = await getTranslations({ locale, namespace: "quiz" });
  const bt = await getTranslations({ locale, namespace: "blog" });
  const embed = await getTranslations({ locale, namespace: "embed" });

  // 前 3 条所有语种都有；第 4 条起是按搜索问句补的问答，哪个语种写了就显示哪条
  const faqs = [1, 2, 3, 4, 5, 6]
    .filter((n) => t.has(`faq${n}Q`))
    .map((n) => ({ q: t(`faq${n}Q`), a: t(`faq${n}A`) }));

  // 答案块（3 个自查对照表 / 肤色 vs 底色 / 橄榄色）：哪个语种写了就显示
  const guideSections: { title: string; blocks: GuideBlock[] }[] = [];
  if (t.has("guideChecksTitle")) {
    guideSections.push(
      {
        title: t("guideChecksTitle"),
        blocks: [
          {
            type: "table",
            head: [t("guideChecksColCheck"), t("guideChecksColCool"), t("guideChecksColWarm"), t("guideChecksColNeutral")],
            rows: [1, 2, 3].map((n) => ({
              cells: [
                t(`guideRow${n}Label`),
                t(`guideRow${n}Cool`),
                t(`guideRow${n}Warm`),
                t(`guideRow${n}Neutral`),
              ],
            })),
            note: t("guideChecksNote"),
          },
        ],
      },
      { title: t("guideToneTitle"), blocks: [{ type: "text", paragraphs: [t("guideToneText")] }] },
      {
        title: t("guideOliveTitle"),
        blocks: [
          {
            type: "text",
            paragraphs: [t("guideOliveText")],
            link: { href: "/blog/olive-undertone-guide", label: t("guideOliveLink") },
          },
        ],
      },
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
    { name: nav("undertoneTest"), path: "/tools/undertone-test" },
  ]);

  // 免费网页工具：用 WebApplication 描述，不带任何评分（没有真实评价数据，不能编造）
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t("title"),
    description: t("description"),
    url: canonicalUrl(locale, "/tools/undertone-test"),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any (web browser)",
    inLanguage: locale,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  // 配套的英文教程视频（已发布才有值）
  const video = getVideoForTool("/tools/undertone-test");

  const related = [
    { href: "/tools/color-quiz", label: nav("colorQuiz") },
    { href: "/color-analysis", label: nav("colorAnalysisGuide") },
    { href: "/personal-color-analysis", label: nav("colorAnalysis") },
    { href: "/try?type=color_analysis", label: bt("cta.color_analysis.button") },
    { href: "/tools/embed", label: embed("linkLabel") },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />

      <UndertoneTestClient />

      <ClampedIntro text={t("seoIntro")} moreLabel={bt("readMore")} />
      {video && <VideoSection video={video} page="tool:undertone-test" contained />}
      <ToolGuide sections={guideSections} />
      <ToolFaq title={quiz("faqTitle")} faqs={faqs} />
      <ToolRelated title={cq("relatedTitle")} links={related} />
    </>
  );
}
