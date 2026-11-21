import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeatureCta, FeatureHeroActions, getFeatureCtaCopy } from "@/components/FeatureCta";
import { FeatureHero } from "@/components/FeatureHero";
import { FeatureWhy } from "@/components/FeatureWhy";
import { ToolFaq } from "@/components/ToolPageSections";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/face-shape-analysis");
  return {
    title: messages.meta.faceTitle,
    description: messages.meta.faceDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.faceTitle,
      description: messages.meta.faceDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.faceTitle,
      description: messages.meta.faceDescription,
    },
  };
}

export default async function FaceShapeAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cta = await getFeatureCtaCopy(locale, "face_shape");
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "face" });
  const ft = await getTranslations({ locale, namespace: "features" });
  const tp = await getTranslations({ locale, namespace: "tryPage" });
  const nt = await getTranslations({ locale, namespace: "nav" });
  const w = await getTranslations({ locale, namespace: "featureWhy" });

  // 页面卖的是发型：先答「脸型会影响发型吗 / 怎么判断 / 准不准」，「哪种脸型最常见」放最后
  const faqs = [3, 1, 4, 2].map((n) => ({
    q: t(`faq${n}Q`),
    a: t(`faq${n}A`),
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
    { name: "Face Shape Analysis", path: "/face-shape-analysis" },
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
        description={w("face.hero")}
        image="/images/examples/report_face_shape.webp"
        sampleLabel={tp("demoBadge")}
        actions={<FeatureHeroActions tool="face_shape" copy={cta} />}
      />

      <FeatureWhy locale={locale} tool="face" />

      <section className="bg-muted/30 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <FeatureCta tool="face_shape" copy={cta} from="feature_mid" />
        </div>
      </section>

      <ToolFaq title={t("faqTitle")} faqs={faqs} />

      <FeatureCta variant="end" tool="face_shape" copy={cta} from="feature_end" />

      {/* 七种脸型：不再逐个讲解（那是 /face-shape/<shape> 的事），这里只是一张图 + 七个入口，把想深入了解的人导过去 */}
      <section className="mx-auto max-w-4xl px-4 pb-10">
        <h2 className="mb-4 text-center text-xl font-bold">{t("shapesTitle")}</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <Image
            src="/images/face_shapes_nolabel.webp"
            alt={t("shapesAlt")}
            width={1672}
            height={520}
            className="w-full"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          {/* 插画本身不带文字，七个名称用当前语言渲染在每张脸下方，同时是指向各脸型详情页的链接 */}
          <div className="grid grid-cols-7 px-1 pb-4 pt-1 sm:pb-5">
            {FACE_SHAPES.map((shape) => (
              <Link
                key={shape.key}
                href={`/face-shape/${shape.key.toLowerCase()}`}
                className="px-0.5 text-center font-serif text-[10px] leading-tight text-foreground/80 underline-offset-4 hover:text-primary hover:underline sm:text-sm"
              >
                {t(`shape${shape.key}`)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-bold">{ft("relatedTools")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/glasses-analysis"
            className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <span className="font-medium text-foreground">{nt("glassesMatch")}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {ft("relGlassesForFace")}
            </span>
          </Link>
          <Link
            href="/tools/face-shape-quiz"
            className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <span className="font-medium text-foreground">{nt("faceQuiz")}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {ft("relQuizForFace")}
            </span>
          </Link>
          <Link
            href="/hair-color-analysis"
            className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <span className="font-medium text-foreground">{nt("hairPreview")}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {ft("relHairForFace")}
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}

// key 对应 messages 里 face.shape<Key>，也是 /face-shape/<key 小写> 的路径；顺序与插图中七张脸一致
const FACE_SHAPES = [
  { key: "Oval" },
  { key: "Round" },
  { key: "Square" },
  { key: "Heart" },
  { key: "Oblong" },
  { key: "Diamond" },
  { key: "Triangle" },
] as const;
