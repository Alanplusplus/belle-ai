import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeatureCta, FeatureHeroActions, getFeatureCtaCopy } from "@/components/FeatureCta";
import { FeatureHero } from "@/components/FeatureHero";
import { FeatureWhy } from "@/components/FeatureWhy";
import { QuickAnswerSection } from "@/components/QuickAnswer";
import { ToolFaq, ToolGuide, type GuideBlock } from "@/components/ToolPageSections";
import { FACE_SHAPES, FACE_SHAPE_SLUGS } from "@/lib/face-shape-data";
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
  const alternates = buildAlternates(locale, "/glasses-analysis");
  return {
    title: messages.meta.glassesTitle,
    description: messages.meta.glassesDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.glassesTitle,
      description: messages.meta.glassesDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.glassesTitle,
      description: messages.meta.glassesDescription,
    },
  };
}

export default async function GlassesAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cta = await getFeatureCtaCopy(locale, "glasses_match");
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "glassesPage" });
  const ft = await getTranslations({ locale, namespace: "features" });
  const tp = await getTranslations({ locale, namespace: "tryPage" });
  const w = await getTranslations({ locale, namespace: "featureWhy" });
  const nt = await getTranslations({ locale, namespace: "nav" });

  // 前 4 条所有语种都有；第 5 条起是按搜索问句补的问答，哪个语种写了就显示哪条
  const faqs = [1, 2, 3, 4, 5, 6]
    .filter((n) => t.has(`faq${n}Q`))
    .map((n) => ({ q: t(`faq${n}Q`), a: t(`faq${n}A`) }));

  // 答案块（按脸型选镜框对照表）：哪个语种写了就显示；内容读 face-shape-data 里的 glassesFrames，和 /face-shape/* 页面一致
  const guideSections: { title: string; blocks: GuideBlock[] }[] = [];
  if (t.has("guideTitle")) {
    const fc = await getTranslations({ locale, namespace: "face" });
    guideSections.push({
      title: t("guideTitle"),
      blocks: [
        { type: "text", paragraphs: [t("guideLead")] },
        {
          type: "table",
          head: [t("guideColShape"), t("guideColBest"), t("guideColAvoid")],
          rows: FACE_SHAPE_SLUGS.map((slug) => {
            const data = FACE_SHAPES[slug];
            const key = `shape${data.name}`;
            return {
              cells: [
                fc.has(key) ? fc(key) : data.name,
                data.glassesFrames.best.slice(0, 2).join(" · "),
                data.glassesFrames.avoid[0],
              ],
              href: `/face-shape/${slug}`,
            };
          }),
        },
      ],
    });
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
    { name: "Glasses Analysis", path: "/glasses-analysis" },
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
        description={w("glasses.hero")}
        image="/images/examples/report_glasses_match.webp"
        sampleLabel={tp("demoBadge")}
        actions={<FeatureHeroActions tool="glasses_match" copy={cta} />}
      />

      <FeatureWhy locale={locale} tool="glasses" />

      {/* 关键事实（费用 / 限制 / 方法 / 照片去向）折叠成一行；一句话答案已经在首屏，不再单独占一块 */}
      <QuickAnswerSection locale={locale} variant="tool" collapsed />

      <section className="bg-muted/30 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <FeatureCta tool="glasses_match" copy={cta} from="feature_mid" />
        </div>
      </section>

      <ToolGuide sections={guideSections} />

      <ToolFaq title={t("faqTitle")} faqs={faqs} />

      <FeatureCta variant="end" tool="glasses_match" copy={cta} from="feature_end" />

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-bold">{ft("relatedTools")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/face-shape-analysis"
            className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <span className="font-medium text-foreground">{nt("faceAnalysis")}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {ft("relFaceShapeForGlasses")}
            </span>
          </Link>
          <Link
            href="/tools/face-shape-quiz"
            className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <span className="font-medium text-foreground">{nt("faceQuiz")}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {ft("relQuizForGlasses")}
            </span>
          </Link>
          <Link
            href="/personal-color-analysis"
            className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <span className="font-medium text-foreground">{nt("colorAnalysis")}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {ft("relColorForGlasses")}
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}


