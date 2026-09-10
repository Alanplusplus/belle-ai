import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import { SEASON_PALETTES } from "@/lib/color-palette-data";
import {
  COMPARISON_DATA,
  COMPARISON_SLUGS,
  getSeasonDisplayName,
} from "@/lib/season-compare-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  const params: { locale: string; pair: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of COMPARISON_SLUGS) {
      params.push({ locale, pair: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; pair: string }>;
}): Promise<Metadata> {
  const { locale, pair } = await params;
  const data = COMPARISON_DATA[pair];
  if (!data) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const season1Name =
    messages.sd?.[data.season1]?.name ??
    getSeasonDisplayName(data.season1);
  const season2Name =
    messages.sd?.[data.season2]?.name ??
    getSeasonDisplayName(data.season2);

  const title = messages.meta.compareTitle
    .replace(/\{season1\}/g, season1Name)
    .replace(/\{season2\}/g, season2Name);
  const description = messages.meta.compareDescription
    .replace(/\{season1\}/g, season1Name)
    .replace(/\{season2\}/g, season2Name);
  const alternates = buildAlternates(locale, `/compare/${pair}`);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string; pair: string }>;
}) {
  const { locale, pair } = await params;
  const data = COMPARISON_DATA[pair];
  if (!data) notFound();

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const season1Name =
    messages.sd?.[data.season1]?.name ??
    getSeasonDisplayName(data.season1);
  const season2Name =
    messages.sd?.[data.season2]?.name ??
    getSeasonDisplayName(data.season2);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Color Analysis", path: "/color-analysis" },
    {
      name: `${season1Name} vs ${season2Name}`,
      path: `/compare/${pair}`,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CompareContent slug={pair} />
    </>
  );
}

function CompareContent({ slug }: { slug: string }) {
  const t = useTranslations("comparePage");
  const cmp = useTranslations(`cmp.${slug}`);
  const sd = useTranslations("sd");

  const data = COMPARISON_DATA[slug];
  const season1Name = sd(`${data.season1}.name`);
  const season2Name = sd(`${data.season2}.name`);

  const otherComparisons = COMPARISON_SLUGS.filter((s) => s !== slug);

  const faqItems = [
    { q: cmp("faq1Q"), a: cmp("faq1A") },
    { q: cmp("faq2Q"), a: cmp("faq2A") },
    { q: cmp("faq3Q"), a: cmp("faq3A") },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-medium text-primary">
            <Link href="/color-analysis" className="hover:underline">
              {t("guideLink")}
            </Link>
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
            {season1Name}{" "}
            <span className="text-muted-foreground">{t("vsLabel")}</span>{" "}
            {season2Name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {data.description}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4">
        {/* Key Differences */}
        <section className="py-12">
          <h2 className="text-2xl font-bold">{t("keyDifferences")}</h2>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("dimension")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-primary">
                    {season1Name}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-primary">
                    {season2Name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.keyDifferences.map((row) => (
                  <tr
                    key={row.dimension}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{row.dimension}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.season1Value}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.season2Value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to Tell */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("howToTell")}</h2>
          <ul className="mt-6 space-y-3">
            {data.howToTell.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <span className="mt-0.5 text-primary">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Season Palette Links */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("explorePalettes")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[data.season1, data.season2].map((seasonSlug) => {
              const palette = SEASON_PALETTES[seasonSlug];
              const name = sd(`${seasonSlug}.name`);
              return (
                <Link
                  key={seasonSlug}
                  href={`/color-palette/${seasonSlug}`}
                  className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <h3 className="font-semibold group-hover:text-primary">
                    {name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {palette.tagline}
                  </p>
                  <p className="mt-3 text-sm font-medium text-primary">
                    {t("viewPalette", { season: name })} →
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("faqTitle", { season1: season1Name, season2: season2Name })}
          </h2>
          <div className="mt-6 space-y-6">
            {faqItems.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="my-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("ctaDesc")}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try?type=color"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("getAnalysis")}
            </Link>
            <Link
              href="/tools/color-quiz"
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              {t("takeQuiz")}
            </Link>
          </div>
        </section>

        {/* Other Comparisons */}
        <section className="border-t border-border mb-10 py-12">
          <h2 className="text-2xl font-bold">{t("otherComparisons")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherComparisons.map((s) => {
              const cmpData = COMPARISON_DATA[s];
              const s1 = sd(`${cmpData.season1}.name`);
              const s2 = sd(`${cmpData.season2}.name`);
              return (
                <Link
                  key={s}
                  href={`/compare/${s}`}
                  className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <h3 className="font-semibold group-hover:text-primary">
                    {s1} {t("vsLabel")} {s2}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {cmpData.description}
                  </p>
                </Link>
              );
            })}
          </div>
          <div className="mt-6">
            <Link
              href="/color-analysis"
              className="inline-block rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              ← {t("backToGuide")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
