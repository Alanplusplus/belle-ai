import { getTranslations } from "next-intl/server";
import { FeatureCta, FeatureHeroActions, getFeatureCtaCopy } from "@/components/FeatureCta";
import { FeatureHero } from "@/components/FeatureHero";
import { FeatureWhy } from "@/components/FeatureWhy";
import Image from "next/image";
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
  const alternates = buildAlternates(locale, "/style-personality");
  return {
    title: messages.meta.styleTitle,
    description: messages.meta.styleDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.styleTitle,
      description: messages.meta.styleDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.styleTitle,
      description: messages.meta.styleDescription,
    },
  };
}

export default async function StylePersonalityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cta = await getFeatureCtaCopy(locale, "style_personality");
  const t = await getTranslations({ locale, namespace: "stylePage" });
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
    { name: "Style Personality", path: "/style-personality" },
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
        description={w("persona.hero")}
        image="/images/examples/report_style_personality.webp"
        sampleLabel={tp("demoBadge")}
        actions={<FeatureHeroActions tool="style_personality" copy={cta} />}
      />

      <FeatureWhy locale={locale} tool="persona" />

      <section className="bg-muted/30 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold">{t("archetypes")}</h2>
          {/* 这句不是废话：它说明「这八个是经典风格族、你的结果是另起的个人风格名」，没有它访客会以为结果只会是八选一，所以保留 */}
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">{t("archetypesIntro")}</p>
          {/* 手机上两列（原来是单列的大方图，八张要滚八屏）；桌面四列 */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
            {PERSONALITIES.map((p) => (
              <div key={p.key} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={p.image}
                    alt={t(`style${p.key}`)}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-3 text-center">
                  <p className="font-medium">{t(`style${p.key}`)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t(`style${p.key}Essence`)}</p>
                </div>
              </div>
            ))}
          </div>
          <FeatureCta tool="style_personality" copy={cta} from="feature_mid" className="mt-8 sm:mt-10" />
        </div>
      </section>

      <ClampedIntro text={t("seoIntro")} moreLabel={bt("readMore")} />

      <ToolFaq title={t("faqTitle")} faqs={faqs} />

      <FeatureCta variant="end" tool="style_personality" copy={cta} from="feature_end" />
    </>
  );
}

// key 对应 messages 里 stylePage.style<Key> / style<Key>Essence
const PERSONALITIES = [
  { key: "Romantic", image: "/images/dim_style_romantic.webp" },
  { key: "Dramatic", image: "/images/dim_style_dramatic.webp" },
  { key: "Classic", image: "/images/dim_style_classic.webp" },
  { key: "Natural", image: "/images/dim_style_natural.webp" },
  { key: "Gamine", image: "/images/dim_style_gamine.webp" },
  { key: "Ethereal", image: "/images/dim_style_ethereal.webp" },
  { key: "Creative", image: "/images/dim_style_creative.webp" },
  { key: "Sensual", image: "/images/dim_style_sensual.webp" },
] as const;

