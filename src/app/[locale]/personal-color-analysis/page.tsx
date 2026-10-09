import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import Image from "next/image";
import type { Metadata } from "next";
import {
  PARENT_SEASON_ORDER,
  getSeasonsByParent,
} from "@/lib/color-palette-data";

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
              {ft("freeQuiz")}
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
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-center text-2xl font-bold">
            12 Seasonal Color Types
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
            {t("description")}
          </p>
          <div className="grid gap-8 sm:grid-cols-2">
            {PARENT_SEASON_ORDER.map((parent) => {
              const subSeasons = getSeasonsByParent(parent);
              const seasonImage = `/images/season_${parent}.webp`;
              const parentLabel = parent.charAt(0).toUpperCase() + parent.slice(1);
              return (
                <div key={parent} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-lg">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={seasonImage}
                      alt={`${parentLabel} color palettes`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <h3 className="absolute bottom-3 left-4 text-lg font-bold text-white drop-shadow-md">
                      {parentLabel}
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {subSeasons.map((season) => (
                      <Link
                        href={`/color-palette/${season.slug}`}
                        key={season.slug}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50"
                      >
                        <div className="flex shrink-0 gap-1">
                          {season.bestColors.slice(0, 5).map((c) => (
                            <div
                              key={c.hex}
                              className="h-5 w-5 rounded-full border border-white/50 shadow-sm"
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{season.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
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
        <h2 className="text-2xl font-semibold mb-6">{t("faqTitle")}</h2>
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
