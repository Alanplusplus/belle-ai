import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, canonicalUrl, ogLocale } from "@/lib/seo";
import { PaletteCardDownload, PaletteCardImage, PaletteCardLarge } from "@/components/PaletteCardImage";
import { PageHero } from "@/components/PageHero";
import { SectionNav } from "@/components/SectionNav";
import { ParentArchTrio, SeasonPhotoCollage } from "@/components/SeasonHeroVisuals";
import { ColorTextList } from "@/components/ColorTextList";
import { paletteImageJsonLd } from "@/lib/palette-card";
import {
  SEASON_PALETTES,
  SEASON_SLUGS,
  PARENT_SEASON_ORDER,
  getSeasonsByParent,
} from "@/lib/color-palette-data";
import {
  PARENT_SEASONS,
  PARENT_SEASON_COLORS,
  PARENT_SEASON_RELATED_BLOGS,
} from "@/lib/parent-season-data";
import type { Metadata } from "next";

const ALL_SLUGS = [...SEASON_SLUGS, ...PARENT_SEASONS];

export function generateStaticParams() {
  const params: { locale: string; season: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of ALL_SLUGS) {
      params.push({ locale, season: slug });
    }
  }
  return params;
}

function isParentSeason(slug: string): boolean {
  return (PARENT_SEASONS as readonly string[]).includes(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; season: string }>;
}): Promise<Metadata> {
  const { locale, season } = await params;

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, `/color-palette/${season}`);

  if (isParentSeason(season)) {
    const label = season.charAt(0).toUpperCase() + season.slice(1);
    const title = messages.meta.seasonHubTitle.replace(/\{season\}/g, label);
    const description = messages.meta.seasonHubDescription.replace(/\{season\}/g, label);
    return {
      title,
      description,
      alternates,
      openGraph: { title, description, type: "website", locale: ogLocale(locale), url: alternates.canonical },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const data = SEASON_PALETTES[season];
  if (!data) return {};

  const localName = messages.sd?.[season]?.name ?? data.name.split(" (")[0];

  const title = messages.meta.seasonPaletteTitle.replace(/\{season\}/g, localName);
  const description = messages.meta.seasonPaletteDescription.replace(/\{season\}/g, localName);

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

export default async function SeasonPalettePage({
  params,
}: {
  params: Promise<{ locale: string; season: string }>;
}) {
  const { locale, season } = await params;
  setRequestLocale(locale);

  if (isParentSeason(season)) {
    const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
      { name: "Color Analysis", path: "/color-analysis" },
      { name: season.charAt(0).toUpperCase() + season.slice(1), path: `/color-palette/${season}` },
    ]);
    // 页面上真实嵌入了这张大类卡片：写明授权和署名（图上的文字是英文，名称也用英文）
    const parentImageJsonLd = paletteImageJsonLd({
      slug: season,
      name: season.charAt(0).toUpperCase() + season.slice(1),
      licenseUrl: `${canonicalUrl(locale, "/color-palette")}#license`,
    });
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(parentImageJsonLd) }} />
        <ParentSeasonContent parent={season} />
      </>
    );
  }

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

  // 页面上真实嵌入了这张卡片：写明授权和署名，授权说明在 /color-palette#license（图上的文字是英文，名称也用英文）
  const imageJsonLd = paletteImageJsonLd({
    slug: season,
    name: seasonName,
    licenseUrl: `${canonicalUrl(locale, "/color-palette")}#license`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageJsonLd) }}
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
  const ph = useTranslations("paletteHub");

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

      {/* Hero：左边文案和按钮，右边是该季型的色板平铺照和妆容特写 */}
      <PageHero
        crumb={
          <>
            <Link href="/color-analysis" className="hover:underline">{t("guideLink")}</Link> /{" "}
            <Link href={`/color-palette/${data.parentSeason}`} className="hover:underline">{parentLabel}</Link>
          </>
        }
        title={displayName}
        subtitle={sd("tagline")}
        description={sd("desc")}
        actions={
          <>
            <Link href="/try?type=color_analysis" className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-7 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
              {t("getMyAnalysis")}
            </Link>
            <Link href="/tools/color-quiz" className="rounded-full border-2 border-primary/70 bg-white/70 px-7 py-[10px] font-semibold text-primary-dark transition hover:border-primary hover:bg-primary/10">
              {qt("startQuiz")}
            </Link>
          </>
        }
        visual={<SeasonPhotoCollage slug={slug} faceAlt={ph("photoAlt", { season: displayName })} />}
      />
      <SectionNav />

      <div className="content-page mx-auto max-w-4xl px-4">
        {/* Characteristics */}
        <section className="py-12">
          <h2 className="text-2xl font-bold">{t("characteristics")} — {displayName}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {chars.map((ch) => (
              <div key={ch.key} className="card-spec p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{ch.key}</p>
                <p className="mt-1 text-sm text-muted-foreground">{ch.val}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 色板：用 PNG 卡片展示，不再由浏览器用 CSS 画色块。颜色名和色值保留为纯文本（可复制、可被搜索引擎读到） */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("bestColors", { season: displayName })}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("bestColorsDesc")}</p>

          <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,26rem)_1fr]">
            <PaletteCardLarge slug={slug} alt={ph("cardAlt", { season: displayName })} priority />

            <div className="space-y-8">
              <ColorTextList colors={bestColors} />

              <div>
                <h3 className="text-lg font-semibold">{t("neutrals", { season: displayName })}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("neutralsDesc")}</p>
                <ColorTextList colors={neutrals} />
              </div>

              <div>
                <h3 className="text-lg font-semibold">{t("avoidColors", { season: displayName })}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("avoidColorsDesc")}</p>
                <ColorTextList colors={avoidColors} />
              </div>

              <PaletteCardDownload slug={slug} label={t("downloadPalette")} termsLabel={t("downloadTerms")} />
            </div>
          </div>
        </section>

        {/* Makeup */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("makeupGuide", { season: displayName })}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {makeupItems.map((item) => (
              <div key={item.label} className="card-spec p-4">
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
            <div className="card-tint p-5">
              <h3 className="font-semibold text-primary">{t("recommended")}</h3>
              <ul className="mt-3 space-y-1.5">
                {hairColors.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">✓</span> {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-soft p-5">
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
                  <Link href={`/color-palette/${sib.slug}`} className="group card-soft flex gap-4 p-4 transition hover:border-primary/40 hover:shadow-md">
                    <PaletteCardImage
                      slug={sib.slug}
                      alt={ph("cardAlt", { season: sibSd("name") })}
                      sizes="96px"
                      className="w-24 shrink-0 self-start"
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold group-hover:text-primary">{sibSd("name")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{sibSd("tagline")}</p>
                    </div>
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

function ParentSeasonContent({ parent }: { parent: string }) {
  const t = useTranslations("seasonHub");
  const sh = useTranslations(`sh.${parent}`);
  const qt = useTranslations("quiz");
  const bt = useTranslations("blogTitles");
  const ph = useTranslations("paletteHub");
  const st = useTranslations("seasonPalette");
  const cg = useTranslations("colorGuide");

  const label = parent.charAt(0).toUpperCase() + parent.slice(1);
  const parentName = cg(`${parent}Name` as "springName");
  const subSeasons = getSeasonsByParent(parent);
  const colors = PARENT_SEASON_COLORS[parent as keyof typeof PARENT_SEASON_COLORS];
  const relatedBlogs = PARENT_SEASON_RELATED_BLOGS[parent as keyof typeof PARENT_SEASON_RELATED_BLOGS];
  const otherParents = PARENT_SEASON_ORDER.filter((p) => p !== parent);

  const faqItems = Array.from({ length: 4 }, (_, i) => ({
    q: sh(`faq${i + 1}Q`),
    a: sh(`faq${i + 1}A`),
  }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const chars = [
    { key: "undertone", val: sh("charUndertone") },
    { key: "depth", val: sh("charDepth") },
    { key: "chroma", val: sh("charChroma") },
    { key: "contrast", val: sh("charContrast") },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero：右边是三个子季型的妆容照（拱形），点哪个进哪个子季型页 */}
      <PageHero
        crumb={<Link href="/color-analysis" className="hover:underline">{t("backToGuide")}</Link>}
        title={t("subtitle", { season: label })}
        description={sh("heroDesc")}
        actions={
          <>
            <Link href="/try?type=color_analysis" className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-7 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
              {t("getAnalysis")}
            </Link>
            <Link href="/tools/color-quiz" className="rounded-full border-2 border-primary/70 bg-white/70 px-7 py-[10px] font-semibold text-primary-dark transition hover:border-primary hover:bg-primary/10">
              {qt("startQuiz")}
            </Link>
          </>
        }
        visual={<ParentArchTrio slugs={subSeasons.map((x) => x.slug)} />}
      />
      <SectionNav />

      <div className="content-page mx-auto max-w-4xl px-4">
        {/* Characteristics */}
        <section className="py-12">
          <h2 className="text-2xl font-bold">{t("characteristics", { season: label })}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {chars.map((ch) => (
              <div key={ch.key} className="card-spec p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t(ch.key as "undertone" | "depth" | "chroma" | "contrast")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{ch.val}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Signature Colors */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("signatureColors", { season: label })}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("signatureDesc", { season: label })}</p>
          <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,26rem)_1fr]">
            <PaletteCardLarge slug={parent} alt={ph("cardAltParent", { season: parentName })} priority />

            <div className="space-y-8">
              <ColorTextList colors={colors.map((c, i) => ({ name: sh(`sc${i}`), hex: c.hex }))} className="mt-0" />
              <PaletteCardDownload slug={parent} label={st("downloadPalette")} termsLabel={st("downloadTerms")} />
            </div>
          </div>
        </section>

        {/* Sub-Seasons */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("subSeasons", { season: label })}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("subSeasonsDesc", { season: label })}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {subSeasons.map((sub) => {
              const SubCard = () => {
                const sd = useTranslations(`sd.${sub.slug}`);
                return (
                  <Link href={`/color-palette/${sub.slug}`} className="group card-soft flex flex-col p-3 transition hover:border-primary/40 hover:shadow-lg">
                    <PaletteCardImage
                      slug={sub.slug}
                      alt={ph("cardAlt", { season: sd("name") })}
                      sizes="(min-width: 896px) 272px, (min-width: 640px) 30vw, 90vw"
                      className="w-full shadow-sm"
                    />
                    <div className="flex flex-1 flex-col px-2 pb-2">
                      <h3 className="mt-4 text-lg font-semibold group-hover:text-primary">{sd("name")}</h3>
                      <p className="mt-1 text-sm text-primary">{sd("tagline")}</p>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{sd("desc")}</p>
                      <p className="mt-3 text-xs font-medium text-primary">{t("exploreSubSeason")} →</p>
                    </div>
                  </Link>
                );
              };
              return <SubCard key={sub.slug} />;
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("faqTitle", { season: label })}</h2>
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
          <h2 className="text-xl font-bold">{t("ctaTitle", { season: label })}</h2>
          <p className="mt-2 text-muted-foreground">{t("ctaDesc")}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/try?type=color_analysis" className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
              {t("getAnalysis")}
            </Link>
            <Link href="/tools/color-quiz" className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted">
              {qt("startQuiz")}
            </Link>
          </div>
        </section>

        {/* Other Seasons */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("otherSeasons")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {otherParents.map((p) => {
              const pName = cg(`${p}Name` as "springName");
              return (
                <Link key={p} href={`/color-palette/${p}`} className="group card-soft flex items-center gap-4 p-4 transition hover:border-primary/40 hover:shadow-md">
                  <PaletteCardImage
                    slug={p}
                    alt={ph("cardAltParent", { season: pName })}
                    sizes="64px"
                    className="w-16 shrink-0 shadow-sm"
                  />
                  <h3 className="font-semibold group-hover:text-primary">{pName}</h3>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Related Articles */}
        <section className="border-t border-border mb-10 py-12">
          <h2 className="text-2xl font-bold">{t("relatedArticles")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {relatedBlogs.map((s) => (
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
