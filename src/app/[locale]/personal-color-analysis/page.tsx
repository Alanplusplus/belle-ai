import { getTranslations, setRequestLocale } from "next-intl/server";
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
  const alternates = buildAlternates(locale, "/personal-color-analysis");
  return {
    title: messages.meta.colorTitle,
    description: messages.meta.colorDescription,
    alternates,
    openGraph: {
      title: messages.meta.colorTitle,
      description: messages.meta.colorDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.colorTitle,
      description: messages.meta.colorDescription,
    },
  };
}

export default async function PersonalColorAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "color" });
  const ft = await getTranslations({ locale, namespace: "features" });

  const items = [t("item1"), t("item2"), t("item3"), t("item4"), t("item5"), t("item6")];

  const faqs = [
    {
      q: "What is personal color analysis?",
      a: "Personal color analysis (seasonal color analysis) determines which colors complement your natural coloring — skin tone, eye color, and hair color. The system categorizes people into 12 seasonal sub-types across 4 main seasons: Spring, Summer, Autumn, and Winter.",
    },
    {
      q: "How does AI color analysis work?",
      a: "Our AI uses computer vision to analyze your skin undertone, depth, contrast, and chroma from a selfie. These measurements are compared against the 12-season system to find your best match — achieving results comparable to in-person consultations.",
    },
    {
      q: "Is AI color analysis accurate?",
      a: "Yes — our AI achieves a 73-82% match rate with professional color draping. For best results, use a clear selfie in natural daylight with no makeup or filters.",
    },
    {
      q: "What's the difference between the quiz and AI analysis?",
      a: "The quiz relies on your self-observation (60-70% accuracy), while AI analysis measures actual color values from your photo objectively (73-82% accuracy). AI also provides a detailed report with specific color palette, makeup recommendations, and styling tips.",
    },
    {
      q: "Do I need to pay for color analysis?",
      a: "Your first AI color analysis is completely free — no signup required. You get a full report with your seasonal color type, personalized palette, and styling recommendations.",
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
    { name: "Personal Color Analysis", path: "/personal-color-analysis" },
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
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try?type=color_analysis"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
            <Link
              href="/tools/color-quiz"
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              Free Quiz
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-center">{ft("reportIncludes")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {COLOR_DIMENSIONS.map((dim, i) => (
              <div
                key={dim.image}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={dim.image}
                    alt={items[i] || dim.image}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
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

      {/* Seasonal Color Types Preview */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">
            12 Seasonal Color Types
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SEASONS.map((season) => (
              <Link
                href={`/color-palette/${season.name.toLowerCase().replace(/\s+/g, "-")}`}
                key={season.name}
                className="rounded-xl border border-border bg-card p-4 text-center transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="mx-auto mb-2 flex gap-1 justify-center">
                  {season.colors.map((color) => (
                    <div
                      key={color}
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium">{season.name}</p>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/try?type=color_analysis"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">FAQ</h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details key={i} className="group border-b border-gray-200 pb-4">
              <summary className="cursor-pointer font-medium text-gray-900 group-open:text-rose-600 transition-colors">
                {faq.q}
              </summary>
              <p className="mt-3 text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/blog/best-colors-for-warm-undertones"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">Best Colors for Warm Undertones</span>
          </Link>
          <Link
            href="/blog/cool-tone-vs-warm-tone"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">Cool Tone vs Warm Tone: 5 Easy Tests</span>
          </Link>
          <Link
            href="/blog/best-makeup-colors-color-season"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">Best Makeup Colors for Every Season</span>
          </Link>
        </div>
      </section>
    </>
  );
}

const COLOR_DIMENSIONS = [
  { image: "/images/dim_color_season.webp" },
  { image: "/images/dim_color_palette.webp" },
  { image: "/images/dim_color_makeup.webp" },
  { image: "/images/dim_color_clothing.webp" },
];

const SEASONS = [
  { name: "Light Spring", colors: ["#F9E4B7", "#FBBF77", "#E8A87C"] },
  { name: "Warm Spring", colors: ["#F5C16C", "#E8963E", "#D4712B"] },
  { name: "Bright Spring", colors: ["#FF6B6B", "#FFD93D", "#6BCB77"] },
  { name: "Light Summer", colors: ["#B5C7D3", "#D4A5B9", "#C8B6D9"] },
  { name: "Cool Summer", colors: ["#8BAAB7", "#C0A1C1", "#96ADC8"] },
  { name: "Soft Summer", colors: ["#A8B5A0", "#C4ADA0", "#B8A9C0"] },
  { name: "Soft Autumn", colors: ["#C4A882", "#B8976A", "#8B9A6B"] },
  { name: "Warm Autumn", colors: ["#C87533", "#8B6914", "#6B4226"] },
  { name: "Deep Autumn", colors: ["#8B4513", "#CD853F", "#556B2F"] },
  { name: "Deep Winter", colors: ["#1C1C3A", "#8B0000", "#006400"] },
  { name: "Cool Winter", colors: ["#2F4F6F", "#C71585", "#008B8B"] },
  { name: "Bright Winter", colors: ["#FF1493", "#00BFFF", "#7CFC00"] },
];
