import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import Image from "next/image";
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
      title: messages.meta.makeupTitle,
      description: messages.meta.makeupDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
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
  const t = await getTranslations({ locale, namespace: "makeup" });
  const ft = await getTranslations({ locale, namespace: "features" });

  const items = [t("item1"), t("item2"), t("item3"), t("item4"), t("item5"), t("item6")];

  const faqs = [
    {
      q: "What is AI makeup analysis?",
      a: "AI makeup analysis uses computer vision to study your skin tone, undertone, face shape, and facial features from a selfie. It then generates personalized makeup recommendations — including foundation shades, blush, eyeshadow, lip colors, and complete looks tailored to your unique coloring.",
    },
    {
      q: "How does Belle's makeup analysis work?",
      a: "Upload a clear selfie and our AI analyzes your skin depth, undertone, eye color, and face shape. Based on these measurements, you receive a detailed report with specific product color recommendations, application tips, and curated makeup looks that complement your natural features.",
    },
    {
      q: "What makeup recommendations will I receive?",
      a: "Your report includes foundation and concealer shade matches, blush and bronzer colors, eyeshadow palettes, lip color suggestions, and full makeup look ideas. Recommendations are customized to your skin tone and face shape for a flattering, harmonious result.",
    },
    {
      q: "Do I need to know my skin tone before using makeup analysis?",
      a: "No — the AI detects your skin undertone and depth automatically from your photo. Whether you have warm, cool, or neutral undertones, the analysis identifies your coloring and suggests makeup shades that enhance your natural beauty.",
    },
    {
      q: "Is the makeup analysis free?",
      a: "Yes, your first AI makeup analysis is completely free with no signup required. You get a full personalized report with color recommendations and styling tips based on your selfie.",
    },
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
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-primary">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("description")}
          </p>
          <Link
            href="/try?type=makeup"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-center">{ft("reportIncludes")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MAKEUP_DIMENSIONS.map((dim, i) => (
              <div
                key={dim.image}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={dim.image}
                    alt={items[i] || dim.image}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium">{items[i]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold">{ft("whyAI")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <WhyItem text={ft("aiAccuracy")} />
            <WhyItem text={ft("aiSpeed")} />
            <WhyItem text={ft("aiCost")} />
            <WhyItem text={ft("aiQuality")} />
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/try?type=makeup"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function WhyItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-primary"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-sm">{text}</p>
    </div>
  );
}

const MAKEUP_DIMENSIONS = [
  { image: "/images/dim_skin.webp" },
  { image: "/images/dim_eyes.webp" },
  { image: "/images/dim_blush.webp" },
  { image: "/images/dim_lips.webp" },
  { image: "/images/dim_looks.webp" },
  { image: "/images/dim_tools.webp" },
];
