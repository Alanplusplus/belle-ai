import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd } from "@/lib/seo";
import {
  SEASON_PALETTES,
  SEASON_SLUGS,
  getSeasonsByParent,
} from "@/lib/color-palette-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  const params: { locale: string; season: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of SEASON_SLUGS) {
      params.push({ locale, season: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; season: string }>;
}): Promise<Metadata> {
  const { locale, season } = await params;
  const data = SEASON_PALETTES[season];
  if (!data) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;

  const localName = messages.sd?.[season]?.name ?? data.name.split(" (")[0];

  return {
    title: messages.meta.seasonPaletteTitle.replace(/\{season\}/g, localName),
    description: messages.meta.seasonPaletteDescription.replace(/\{season\}/g, localName),
    alternates: buildAlternates(locale, `/color-palette/${season}`),
  };
}

export default async function SeasonPalettePage({
  params,
}: {
  params: Promise<{ locale: string; season: string }>;
}) {
  const { locale, season } = await params;
  const data = SEASON_PALETTES[season];
  if (!data) notFound();

  const seasonName = season
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Color Palette", path: "/color-palette" },
    { name: seasonName, path: `/color-palette/${season}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SeasonPaletteContent slug={season} />
    </>
  );
}

function SeasonPaletteContent({ slug }: { slug: string }) {
  const t = useTranslations("seasonPalette");
  const sd = useTranslations(`sd.${slug}`);
  const qt = useTranslations("quiz");
  const bt = useTranslations("blogTitles");

  const data = SEASON_PALETTES[slug];
  const displayName = sd("name");
  const parentLabel = data.parentSeason.charAt(0).toUpperCase() + data.parentSeason.slice(1);

  const siblings = getSeasonsByParent(data.parentSeason).filter((s) => s.slug !== slug);

  const bestColors = data.bestColors.map((c, i) => ({ name: sd(`bc${i}`), hex: c.hex }));
  const avoidColors = data.avoidColors.map((c, i) => ({ name: sd(`ac${i}`), hex: c.hex }));
  const neutrals = data.neutrals.map((c, i) => ({ name: sd(`nc${i}`), hex: c.hex }));
  const hairColors = data.hairColors.map((_, i) => sd(`hr${i}`));
  const hairColorsAvoid = data.hairColorsAvoid.map((_, i) => sd(`ha${i}`));
  const fashionTips = data.fashionTips.map((_, i) => sd(`ft${i}`));

  const chars = [
    { key: "undertone", val: sd("charUndertone") },
    { key: "depth", val: sd("charDepth") },
    { key: "chroma", val: sd("charChroma") },
    { key: "contrast", val: sd("charContrast") },
  ];

  const makeupItems = [
    { label: t("lips"), value: sd("lips") },
    { label: t("eyes"), value: sd("eyes") },
    { label: t("blush"), value: sd("blush") },
    { label: t("foundation"), value: sd("found") },
  ];

  const faqItems = [
    { q: t("faqWhatIs", { season: displayName }), a: sd("desc") },
    {
      q: t("faqBestColors", { season: displayName }),
      a: `${bestColors.slice(0, 5).map((c) => c.name).join(", ")}`,
    },
    {
      q: t("faqAvoidColors", { season: displayName }),
      a: `${avoidColors.map((c) => c.name).join(", ")}`,
    },
    {
      q: t("faqMakeup", { season: displayName }),
      a: `${sd("lips")}. ${sd("eyes")}. ${sd("blush")}. ${sd("found")}.`,
    },
    {
      q: t("faqCelebrities", { season: displayName }),
      a: data.celebrities.join(", "),
    },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-medium text-primary">
            <Link href="/color-analysis" className="hover:underline">{t("guideLink")}</Link> / {parentLabel}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">{displayName}</h1>
          <p className="mt-3 text-lg text-primary">{sd("tagline")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{sd("desc")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4">
        {/* Characteristics */}
        <section className="py-12">
          <h2 className="text-2xl font-bold">{t("characteristics")} — {displayName}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {chars.map((ch) => (
              <div key={ch.key} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{ch.key}</p>
                <p className="mt-1 text-sm text-muted-foreground">{ch.val}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Best Colors */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("bestColors", { season: displayName })}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("bestColorsDesc")}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {bestColors.map((c) => (
              <div key={c.hex} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-xl border border-border/50 shadow-sm" style={{ backgroundColor: c.hex }} />
                <p className="mt-2 text-xs font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.hex}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Neutrals */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("neutrals", { season: displayName })}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("neutralsDesc")}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {neutrals.map((c) => (
              <div key={c.hex} className="text-center">
                <div className="mx-auto h-14 w-14 rounded-xl border border-border/50 shadow-sm" style={{ backgroundColor: c.hex }} />
                <p className="mt-2 text-xs font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.hex}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Avoid */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("avoidColors", { season: displayName })}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("avoidColorsDesc")}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {avoidColors.map((c) => (
              <div key={c.hex} className="text-center opacity-70">
                <div className="relative mx-auto h-14 w-14 rounded-xl border border-border/50 shadow-sm" style={{ backgroundColor: c.hex }}>
                  <div className="absolute inset-0 flex items-center justify-center text-white/80 text-xl font-bold drop-shadow">✕</div>
                </div>
                <p className="mt-2 text-xs font-medium">{c.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Makeup */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("makeupGuide", { season: displayName })}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {makeupItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hair */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("bestHairColors", { season: displayName })}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-primary">{t("recommended")}</h3>
              <ul className="mt-3 space-y-1.5">
                {hairColors.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">✓</span> {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">{t("avoid")}</h3>
              <ul className="mt-3 space-y-1.5">
                {hairColorsAvoid.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-red-400">✕</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Fashion */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("fashionTitle", { season: displayName })}</h2>
          <ul className="mt-6 space-y-3">
            {fashionTips.map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 text-primary">→</span><span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Jewelry */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("jewelryTitle", { season: displayName })}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <strong>{t("bestMetals")}</strong> {sd("jewelry")}
          </p>
        </section>

        {/* Celebrities */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("celebrityTitle", { season: displayName })}</h2>
          <p className="mt-4 text-muted-foreground">{t("celebrityDesc", { season: displayName })}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.celebrities.map((c) => (
              <span key={c} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">{c}</span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("faqTitle", { season: displayName })}</h2>
          <div className="mt-6 space-y-6">
            {faqItems.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="my-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">{t("ctaTitle", { season: displayName })}</h2>
          <p className="mt-2 text-muted-foreground">{t("ctaDesc")}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/try?type=color_analysis" className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
              {t("getMyAnalysis")}
            </Link>
            <Link href="/tools/color-quiz" className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted">
              {qt("startQuiz")}
            </Link>
          </div>
        </section>

        {/* Siblings */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("otherSubSeasons", { parent: parentLabel })}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {siblings.map((sib) => {
              const SibName = () => {
                const sibSd = useTranslations(`sd.${sib.slug}`);
                return (
                  <Link href={`/color-palette/${sib.slug}`} className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md">
                    <div className="flex gap-1.5">
                      {sib.bestColors.slice(0, 4).map((c) => (
                        <div key={c.hex} className="h-6 w-6 rounded-full border border-border/30" style={{ backgroundColor: c.hex }} />
                      ))}
                    </div>
                    <h3 className="mt-3 font-semibold group-hover:text-primary">{sibSd("name")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{sibSd("tagline")}</p>
                  </Link>
                );
              };
              return <SibName key={sib.slug} />;
            })}
          </div>
        </section>

        {/* Related */}
        <section className="border-t border-border py-12 mb-10">
          <h2 className="text-2xl font-bold">{t("relatedArticles")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.relatedSlugs.map((s) => (
              <Link key={s} href={`/blog/${s}`} className="rounded-lg border border-border px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-muted">
                {bt.has(s) ? bt(s) : s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Link>
            ))}
            <Link href="/color-analysis" className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10">
              ← {t("backToGuide")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
