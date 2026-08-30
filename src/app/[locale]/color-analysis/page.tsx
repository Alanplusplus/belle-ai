import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/constants";
import { buildAlternates, buildBreadcrumbJsonLd } from "@/lib/seo";
import {
  SEASON_PALETTES,
  PARENT_SEASON_ORDER,
  getSeasonsByParent,
} from "@/lib/color-palette-data";
import { ATTRIBUTES } from "@/lib/color-analysis-for-data";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.colorGuideTitle,
    description: messages.meta.colorGuideDescription,
    alternates: buildAlternates(locale, "/color-analysis"),
  };
}

export default async function ColorAnalysisPillarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "colorGuide" });
  const sd = await getTranslations({ locale, namespace: "sd" });
  const adT = await getTranslations({ locale, namespace: "ad" });

  const faqs = Array.from({ length: 10 }, (_, i) => ({
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

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t("heroTitle"),
    description: t("heroDesc"),
    author: { "@type": "Organization", name: "Belle AI" },
    publisher: {
      "@type": "Organization",
      name: "Belle AI",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-full.webp` },
    },
    datePublished: "2026-06-01",
    dateModified: new Date().toISOString().split("T")[0],
    mainEntityOfPage: `${SITE_URL}/color-analysis`,
  };

  const dimensions = [
    { titleKey: "dimUndertoneTitle" as const, descKey: "dimUndertoneDesc" as const, link: "/blog/cool-tone-vs-warm-tone" },
    { titleKey: "dimDepthTitle" as const, descKey: "dimDepthDesc" as const, link: "/blog/how-to-determine-skin-undertone" },
    { titleKey: "dimChromaTitle" as const, descKey: "dimChromaDesc" as const, link: "/blog/science-behind-personal-color-analysis" },
    { titleKey: "dimContrastTitle" as const, descKey: "dimContrastDesc" as const, link: "/blog/personal-color-analysis-guide" },
  ];

  const parentSeasonKeys: Record<string, { nameKey: string; descKey: string }> = {
    spring: { nameKey: "springName", descKey: "springDesc" },
    summer: { nameKey: "summerName", descKey: "summerDesc" },
    autumn: { nameKey: "autumnName", descKey: "autumnDesc" },
    winter: { nameKey: "winterName", descKey: "winterDesc" },
  };

  const methods = [
    {
      titleKey: "methodAITitle" as const,
      descKey: "methodAIDesc" as const,
      pros: [t("aiPro0"), t("aiPro1"), t("aiPro2"), t("aiPro3")],
      link: "/try?type=color_analysis",
      linkLabelKey: "tryFreeAnalysis" as const,
    },
    {
      titleKey: "methodQuizTitle" as const,
      descKey: "methodQuizDesc" as const,
      pros: [t("quizPro0"), t("quizPro1"), t("quizPro2"), t("quizPro3")],
      link: "/tools/color-quiz",
      linkLabelKey: "takeFreeQuiz" as const,
    },
    {
      titleKey: "methodProTitle" as const,
      descKey: "methodProDesc" as const,
      pros: [t("proPro0"), t("proPro1"), t("proPro2"), t("proPro3")],
      link: "/blog/ai-vs-professional-color-analysis",
      linkLabelKey: "aiVsPro" as const,
    },
  ];

  const useResults = [
    { titleKey: "useMakeupTitle" as const, descKey: "useMakeupDesc" as const, link: "/blog/best-makeup-colors-color-season" },
    { titleKey: "useWardrobeTitle" as const, descKey: "useWardrobeDesc" as const, link: "/blog/capsule-wardrobe-color-season" },
    { titleKey: "useHairTitle" as const, descKey: "useHairDesc" as const, link: "/blog/best-hair-color-for-color-season" },
    { titleKey: "useJewelryTitle" as const, descKey: "useJewelryDesc" as const, link: "/blog/accessorize-by-color-season" },
  ];

  const blogSlugs = [
    "what-is-color-analysis",
    "how-to-do-color-analysis-at-home",
    "what-color-season-am-i",
    "cool-tone-vs-warm-tone",
    "science-behind-personal-color-analysis",
    "ai-vs-professional-color-analysis",
    "why-color-analysis-quizzes-are-wrong",
    "how-to-determine-skin-undertone",
  ];

  const tocItems = Array.from({ length: 8 }, (_, i) => t(`toc${i + 1}`));
  const tocAnchors = [
    "#what-is", "#how-it-works", "#4-season", "#12-season",
    "#find-your-season", "#use-results", "#by-skin-tone", "#faq",
  ];

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Color Analysis", path: "/color-analysis" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">{t("heroTitle")}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{t("heroDesc")}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/try?type=color_analysis" className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
              {t("tryFreeAI")}
            </Link>
            <Link href="/tools/color-quiz" className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted">
              {t("takeFreeQuiz")}
            </Link>
          </div>
        </div>
      </section>

      {/* TOC */}
      <section className="border-b border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-lg font-semibold">{t("tocTitle")}</h2>
          <nav className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
            {tocItems.map((label, i) => (
              <a key={tocAnchors[i]} href={tocAnchors[i]} className="rounded-lg px-3 py-2 transition hover:bg-muted">{label}</a>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4">
        {/* What Is */}
        <section id="what-is" className="scroll-mt-20 py-16">
          <h2 className="text-3xl font-bold">{t("whatIsTitle")}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {t.rich("whatIsP1", { b: (c) => <b>{c}</b> })}
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {t.rich("whatIsP2", { b: (c) => <b>{c}</b>, i: (c) => <i>{c}</i> })}
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {t.rich("whatIsP3Korea", {
              koreaLink: (chunks) => (
                <Link href="/blog/korean-personal-color-analysis" className="text-primary hover:underline">{chunks}</Link>
              ),
            })}
          </p>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-border py-16">
          <h2 className="text-3xl font-bold">{t("howWorksTitle")}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t("howWorksDesc")}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {dimensions.map((dim) => (
              <div key={dim.titleKey} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold">{t(dim.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(dim.descKey)}</p>
                <Link href={dim.link} className="mt-3 inline-block text-sm text-primary hover:underline">{t("learnMore")} →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* 4-Season */}
        <section id="4-season" className="scroll-mt-20 border-t border-border py-16">
          <h2 className="text-3xl font-bold">{t("fourSeasonTitle")}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t("fourSeasonDesc")}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PARENT_SEASON_ORDER.map((parent) => {
              const seasons = getSeasonsByParent(parent);
              const keys = parentSeasonKeys[parent];
              return (
                <div key={parent} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-xl font-bold">{t(keys.nameKey)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(keys.descKey)}</p>
                  <div className="mt-3 flex gap-1">
                    {seasons.flatMap((s) => s.bestColors.slice(0, 2)).map((c) => (
                      <div key={c.hex + c.name} className="h-5 w-5 rounded-full border border-border/50" style={{ backgroundColor: c.hex }} title={c.name} />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("subSeasons", { list: seasons.map((s) => sd(`${s.slug}.name`)).join(", ") })}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Mid CTA */}
        <section className="my-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h3 className="text-xl font-bold">{t("midCtaTitle")}</h3>
          <p className="mt-2 text-muted-foreground">{t("midCtaDesc")}</p>
          <Link href="/try?type=color_analysis" className="mt-4 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
            {t("tryFreeAI")}
          </Link>
        </section>

        {/* 12-Season */}
        <section id="12-season" className="scroll-mt-20 border-t border-border py-16">
          <h2 className="text-3xl font-bold">{t("twelveSeasonTitle")}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t("twelveSeasonDesc")}</p>
          {PARENT_SEASON_ORDER.map((parent) => {
            const seasons = getSeasonsByParent(parent);
            const keys = parentSeasonKeys[parent];
            return (
              <div key={parent} className="mt-10">
                <h3 className="text-2xl font-bold">{t("subSeasonsOf", { season: t(keys.nameKey) })}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {seasons.map((season) => (
                    <Link key={season.slug} href={`/color-palette/${season.slug}`} className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md">
                      <div className="flex gap-1.5">
                        {season.bestColors.slice(0, 5).map((c) => (
                          <div key={c.hex} className="h-7 w-7 rounded-full border border-border/30" style={{ backgroundColor: c.hex }} />
                        ))}
                      </div>
                      <h4 className="mt-3 font-semibold group-hover:text-primary">{sd(`${season.slug}.name`)}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{sd(`${season.slug}.tagline`)}</p>
                      <span className="mt-2 inline-block text-xs text-primary">{t("viewFullPalette")} →</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Find Your Season */}
        <section id="find-your-season" className="scroll-mt-20 border-t border-border py-16">
          <h2 className="text-3xl font-bold">{t("findSeasonTitle")}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t("findSeasonDesc")}</p>
          <div className="mt-8 space-y-6">
            {methods.map((method) => (
              <div key={method.titleKey} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold">{t(method.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(method.descKey)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {method.pros.map((pro) => (
                    <span key={pro} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{pro}</span>
                  ))}
                </div>
                <Link href={method.link} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">{t(method.linkLabelKey)} →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* Use Results */}
        <section id="use-results" className="scroll-mt-20 border-t border-border py-16">
          <h2 className="text-3xl font-bold">{t("useResultsTitle")}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t("useResultsDesc")}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {useResults.map((use) => (
              <div key={use.titleKey} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold">{t(use.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(use.descKey)}</p>
                <Link href={use.link} className="mt-3 inline-block text-sm text-primary hover:underline">{t("readFullGuide")} →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* By Skin Tone */}
        <section id="by-skin-tone" className="scroll-mt-20 border-t border-border py-16">
          <h2 className="text-3xl font-bold">{t("bySkinToneTitle")}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t("bySkinToneDesc")}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(ATTRIBUTES).map((attr) => (
              <Link key={attr.slug} href={`/color-analysis-for/${attr.slug}`} className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md">
                <h3 className="font-semibold group-hover:text-primary">
                  {t("colorAnalysisFor", { audience: adT(`${attr.slug}.name`) })}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {adT(`${attr.slug}.heroDesc`).slice(0, 120)}…
                </p>
                <span className="mt-2 inline-block text-xs text-primary">{t("readGuide")} →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Further Reading */}
        <section className="border-t border-border py-16">
          <h2 className="text-3xl font-bold">{t("furtherReadingTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("furtherReadingDesc")}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {blogSlugs.map((slug, i) => (
              <Link key={slug} href={`/blog/${slug}`} className="rounded-lg border border-border px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-muted">
                {t(`fr${i}`)}
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-border py-16">
          <h2 className="text-3xl font-bold">{t("faqTitle")}</h2>
          <div className="mt-8 space-y-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <h3 className="text-lg font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mb-16 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold">{t("bottomCtaTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("bottomCtaDesc")}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/try?type=color_analysis" className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
              {t("startFreeAnalysis")}
            </Link>
            <Link href="/tools/color-quiz" className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted">
              {t("takeFreeQuizAlt")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
