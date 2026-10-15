import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import {
  CELEBRITY_DATA,
  CELEBRITY_SLUGS,
} from "@/lib/celebrity-data";
import { SEASON_PALETTES } from "@/lib/color-palette-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  const params: { locale: string; name: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of CELEBRITY_SLUGS) {
      params.push({ locale, name: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; name: string }>;
}): Promise<Metadata> {
  const { locale, name } = await params;
  const data = CELEBRITY_DATA[name];
  if (!data) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const seasonData = SEASON_PALETTES[data.season];
  const seasonName =
    messages.sd?.[data.season]?.name ?? seasonData?.name ?? data.season;

  const title = messages.meta.celebrityPseoTitle
    .replace(/\{name\}/g, data.name)
    .replace(/\{season\}/g, seasonName);
  const description = messages.meta.celebrityPseoDescription
    .replace(/\{name\}/g, data.name)
    .replace(/\{season\}/g, seasonName);
  const alternates = buildAlternates(locale, `/celebrity/${name}`);

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

export default async function CelebrityPage({
  params,
}: {
  params: Promise<{ locale: string; name: string }>;
}) {
  const { locale, name } = await params;
  setRequestLocale(locale);
  const data = CELEBRITY_DATA[name];
  if (!data) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Color Analysis", path: "/color-analysis" },
    { name: data.name, path: `/celebrity/${name}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CelebrityContent slug={name} />
    </>
  );
}

function CelebrityContent({ slug }: { slug: string }) {
  const t = useTranslations("celebrityPseo");
  const ct = useTranslations(`celeb.${slug}`);
  const bt = useTranslations("blogTitles");

  const data = CELEBRITY_DATA[slug];
  const seasonData = SEASON_PALETTES[data.season];
  const sd = useTranslations(`sd.${data.season}`);
  const sdAll = useTranslations("sd");
  const seasonName = sd.has("name") ? sd("name") : seasonData.name;

  const hasDeepContent = !!data.detailedAnalysis;
  const otherCelebrities = CELEBRITY_SLUGS.filter((s) => s !== slug);

  const faqItems = [
    { q: ct("faq1Q"), a: ct("faq1A") },
    { q: ct("faq2Q"), a: ct("faq2A") },
    { q: ct("faq3Q"), a: ct("faq3A") },
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
            {data.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {data.description}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4">
        {/* Color Season */}
        <section className="py-12">
          <h2 className="text-2xl font-bold">
            {t("seasonLabel")} — {data.name}
          </h2>
          <div className="mt-6 rounded-xl border border-border bg-card p-6">
            <Link
              href={`/color-palette/${data.season}`}
              className="group inline-flex items-center gap-3"
            >
              <div className="flex gap-1.5">
                {seasonData.bestColors.slice(0, 5).map((c) => (
                  <div
                    key={c.hex}
                    className="h-8 w-8 rounded-full border border-border/50"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <div>
                <p className="font-semibold group-hover:text-primary">
                  {seasonName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sd.has("tagline") ? sd("tagline") : seasonData.tagline}
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Best Colors */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("bestColors")} — {data.name}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("bestColorsDesc")}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {data.bestColors.map((c) => (
              <div key={c.hex} className="text-center">
                <div
                  className="mx-auto h-20 w-20 rounded-xl border border-border/50 shadow-sm"
                  style={{ backgroundColor: c.hex }}
                />
                <p className="mt-2 text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.hex}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Style Insights */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("styleInsights")} — {data.name}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("styleInsightsDesc")}
          </p>
          <ul className="mt-6 space-y-3">
            {data.styleInsights.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <span className="mt-0.5 text-primary">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Detailed Analysis (deep content) */}
        {hasDeepContent && data.detailedAnalysis && (
          <section className="border-t border-border py-12">
            <h2 className="text-2xl font-bold">
              {t("detailedAnalysisTitle", { name: data.name })}
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              {data.detailedAnalysis.split(". ").reduce((acc: string[][], sentence, i, arr) => {
                const groupSize = Math.ceil(arr.length / 3);
                const groupIdx = Math.floor(i / groupSize);
                if (!acc[groupIdx]) acc[groupIdx] = [];
                acc[groupIdx].push(sentence + (i < arr.length - 1 ? "." : ""));
                return acc;
              }, []).map((group, i) => (
                <p key={i}>{group.join(" ")}</p>
              ))}
            </div>
          </section>
        )}

        {/* Iconic Looks (deep content) */}
        {hasDeepContent && data.iconicLooks && data.iconicLooks.length > 0 && (
          <section className="border-t border-border py-12">
            <h2 className="text-2xl font-bold">
              {t("iconicLooksTitle", { name: data.name })}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("iconicLooksDesc")}
            </p>
            <div className="mt-6 space-y-6">
              {data.iconicLooks.map((look) => (
                <div
                  key={look.event}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h3 className="font-semibold">{look.event}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {look.description}
                  </p>
                  <div className="mt-3 rounded-lg bg-primary/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {t("whyItWorks")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {look.whyItWorks}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Color Mistakes (deep content) */}
        {hasDeepContent && data.colorMistakes && data.colorMistakes.length > 0 && (
          <section className="border-t border-border py-12">
            <h2 className="text-2xl font-bold">
              {t("colorMistakesTitle", { name: data.name })}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("colorMistakesDesc")}
            </p>
            <div className="mt-6 space-y-4">
              {data.colorMistakes.map((mistake) => (
                <div
                  key={mistake.description}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <p className="text-sm text-muted-foreground">
                    {mistake.description}
                  </p>
                  <div className="mt-3 rounded-lg bg-red-500/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                      {t("whyItClashed")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {mistake.whyItClashed}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Get the Look (deep content) */}
        {hasDeepContent && data.getTheLook && data.getTheLook.length > 0 && (
          <section className="border-t border-border py-12">
            <h2 className="text-2xl font-bold">
              {t("getTheLookTitle", { name: data.name, season: seasonName })}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("getTheLookDesc")}
            </p>
            <ul className="mt-6 space-y-3">
              {data.getTheLook.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 text-primary">★</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Season Peers (deep content) */}
        {hasDeepContent && data.seasonPeers && data.seasonPeers.length > 0 && (
          <section className="border-t border-border py-12">
            <h2 className="text-2xl font-bold">
              {t("seasonPeersTitle", { season: seasonName })}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("seasonPeersDesc", { name: data.name, season: seasonName })}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.seasonPeers.map((peer) => {
                const peerSlug = peer
                  .toLowerCase()
                  .replace(/[()]/g, "")
                  .replace(/\s+/g, "-")
                  .replace(/é/g, "e");
                const peerData = CELEBRITY_DATA[peerSlug];
                return peerData ? (
                  <Link
                    key={peer}
                    href={`/celebrity/${peerSlug}`}
                    className="rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
                  >
                    {peer}
                  </Link>
                ) : (
                  <span
                    key={peer}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
                  >
                    {peer}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("faqTitle", { name: data.name })}
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
          <div className="mt-6">
            <Link
              href="/try"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("getAnalysis")}
            </Link>
          </div>
        </section>

        {/* Other Celebrities */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("otherCelebrities")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherCelebrities.map((s) => {
              const celeb = CELEBRITY_DATA[s];
              const celebSeason = SEASON_PALETTES[celeb.season];
              return (
                <Link
                  key={s}
                  href={`/celebrity/${s}`}
                  className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex gap-1.5">
                    {celeb.bestColors.slice(0, 4).map((c) => (
                      <div
                        key={c.hex}
                        className="h-5 w-5 rounded-full border border-border/50"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <h3 className="mt-3 font-semibold group-hover:text-primary">
                    {celeb.name}
                  </h3>
                  <p className="mt-1 text-xs text-primary">
                    {sdAll.has(`${celeb.season}.name`) ? sdAll(`${celeb.season}.name`) : celebSeason.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {celeb.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Related Articles */}
        <section className="mb-10 border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("relatedArticles")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.relatedSlugs.map((s) => (
              <Link
                key={s}
                href={`/blog/${s}`}
                className="rounded-lg border border-border px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-muted"
              >
                {bt.has(s)
                  ? bt(s)
                  : s
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
              </Link>
            ))}
            <Link
              href="/color-analysis"
              className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              ← {t("backToGuide")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
