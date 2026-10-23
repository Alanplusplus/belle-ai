import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, canonicalUrl, ogLocale } from "@/lib/seo";
import { PaletteCardDownload, PaletteCardImage, PaletteCardLarge } from "@/components/PaletteCardImage";
import { PageHero } from "@/components/PageHero";
import { SectionNav } from "@/components/SectionNav";
import { SeasonPhotoCollage } from "@/components/SeasonHeroVisuals";
import { ColorTextList } from "@/components/ColorTextList";
import { paletteImageJsonLd } from "@/lib/palette-card";
import { SEASON_PALETTES, SEASON_SLUGS, getSeasonsByParent, PARENT_SEASON_ORDER } from "@/lib/color-palette-data";
import { LOOKBOOK_DATA, LOOKBOOK_SLUGS } from "@/lib/lookbook-data";
import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export function generateStaticParams() {
  const params: { locale: string; season: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of LOOKBOOK_SLUGS) {
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
  const alternates = buildAlternates(locale, `/lookbook/${season}`);

  const title = messages.meta.lookbookTitle.replace(/\{season\}/g, localName);
  const description = messages.meta.lookbookDescription.replace(/\{season\}/g, localName);

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
      images: data.bestColors.slice(0, 4).map((c) => ({
        url: `${SITE_URL}/lookbook/${season}/opengraph-image`,
        width: 1200,
        height: 630,
      })),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function LookbookPage({
  params,
}: {
  params: Promise<{ locale: string; season: string }>;
}) {
  const { locale, season } = await params;
  setRequestLocale(locale);

  const data = SEASON_PALETTES[season];
  const lookbook = LOOKBOOK_DATA[season];
  if (!data || !lookbook) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Color Analysis", path: "/color-analysis" },
    { name: `${data.name.split(" (")[0]} Lookbook`, path: `/lookbook/${season}` },
  ]);

  // 页面上真实嵌入了这个季型的色板卡片：写明授权和署名，授权说明在 /color-palette#license
  const imageJsonLd = paletteImageJsonLd({
    slug: season,
    name: data.name.split(" (")[0],
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
      <LookbookContent slug={season} />
    </>
  );
}

function LookbookContent({ slug }: { slug: string }) {
  const t = useTranslations("lookbook");
  const sd = useTranslations(`sd.${slug}`);
  const qt = useTranslations("quiz");
  const bt = useTranslations("blogTitles");
  const ph = useTranslations("paletteHub");
  const st = useTranslations("seasonPalette");

  const data = SEASON_PALETTES[slug];
  const lookbook = LOOKBOOK_DATA[slug];
  const displayName = sd("name");
  const parentKeys: Record<string, string> = { spring: "parentSpring", summer: "parentSummer", autumn: "parentAutumn", winter: "parentWinter" };
  const parentLabel = t(parentKeys[data.parentSeason] || data.parentSeason);

  const siblings = SEASON_SLUGS.filter((s) => s !== slug);
  const sameFamilySiblings = getSeasonsByParent(data.parentSeason).filter((s) => s.slug !== slug);

  const bestColors = data.bestColors.map((c, i) => ({ name: sd(`bc${i}`), hex: c.hex }));
  const neutrals = data.neutrals.map((c, i) => ({ name: sd(`nc${i}`), hex: c.hex }));
  const avoidColors = data.avoidColors.map((c, i) => ({ name: sd(`ac${i}`), hex: c.hex }));

  const makeupItems = [
    { label: t("lips"), value: sd("lips") },
    { label: t("eyes"), value: sd("eyes") },
    { label: t("blush"), value: sd("blush") },
    { label: t("foundation"), value: sd("found") },
  ];

  const hairColors = data.hairColors.map((_, i) => sd(`hr${i}`));

  const bc0 = sd("bc0");
  const nc0 = sd("nc0");
  const lips0 = sd("lips").split(",")[0].trim();
  const eyes0 = sd("eyes").split(",")[0].trim();
  const blush0 = sd("blush").split(",")[0].trim();
  const jewelry0 = sd("jewelry").split(",")[0].trim();
  const jewelryRest = sd("jewelry").split(",").slice(1, 3).map((s: string) => s.trim()).filter(Boolean).join(", ");

  const imgCaptions: Record<string, string> = {
    "outfit-casual": t("imgCasual", { season: displayName, color1: bc0, color2: nc0 }),
    "outfit-work": t("imgWork", { season: displayName, color: sd("bc1") }),
    "outfit-evening": t("imgEvening", { season: displayName, color: sd("bc2") }),
    "makeup-everyday": t("imgMakeupEveryday", { season: displayName, blush: blush0, lips: lips0 }),
    "makeup-glam": t("imgMakeupGlam", { season: displayName, eyes: eyes0 }),
    "makeup-natural": t("imgMakeupNatural", { season: displayName, blush: blush0 }),
    "hair-1": t("imgHair", { season: displayName, color: hairColors[0] || "" }),
    "hair-2": t("imgHair", { season: displayName, color: hairColors[1] || "" }),
    "hair-3": t("imgHair", { season: displayName, color: hairColors[2] || "" }),
    "jewelry-1": t("imgJewelry1", { season: displayName, metal: jewelry0 }),
    "jewelry-2": t("imgJewelry2", { season: displayName, materials: jewelryRest || jewelry0 }),
  };

  const sectionDescs = {
    palette: t("paletteDesc", { season: displayName, undertone: sd("charUndertone"), depth: sd("charDepth"), chroma: sd("charChroma") }),
    outfit: t("outfitDesc", { season: displayName, tip: sd("ft0") }),
    makeup: t("makeupDesc", { season: displayName, lips: sd("lips").split(",")[0], eyes: sd("eyes").split(",")[0] }),
    hair: t("hairDesc", { season: displayName, colors: hairColors.slice(0, 3).join(", ") }),
    jewelry: t("jewelryDesc", { season: displayName, jewelry: sd("jewelry") }),
    avoid: t("avoidDesc", { season: displayName }),
  };

  return (
    <>
      {/* Hero：右边是首饰平铺照和晚装穿搭（拱形） */}
      <PageHero
        wide
        crumb={
          <>
            <Link href="/lookbook" className="hover:underline">{t("breadcrumbLookbook")}</Link>
            {" / "}
            <span>{displayName}</span>
          </>
        }
        title={t("title", { season: displayName })}
        description={t("heroDesc", { season: displayName })}
        actions={
          <>
            <Link href="/try?type=color_analysis" className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-7 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
              {t("getAnalysis")}
            </Link>
            <Link href={`/color-palette/${slug}`} className="rounded-full border-2 border-primary/70 bg-white/70 px-7 py-[10px] font-semibold text-primary-dark transition hover:border-primary hover:bg-primary/10">
              {t("viewPalette", { season: displayName })}
            </Link>
          </>
        }
        visual={<SeasonPhotoCollage slug={slug} main="jewelry-1" face="outfit-evening" faceAlt={imgCaptions["outfit-evening"]} />}
      />
      <SectionNav wide />

      <div className="content-page mx-auto max-w-5xl px-4">
        {/* Best Colors Grid */}
        <section className="py-12">
          <h2 className="text-2xl font-bold">{t("paletteSection")} — {displayName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {sectionDescs.palette}
          </p>
          <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,26rem)_1fr]">
            <PaletteCardLarge slug={slug} alt={ph("cardAlt", { season: displayName })} />

            <div className="space-y-8">
              <ColorTextList colors={bestColors} className="mt-0" />
              <div>
                <h3 className="text-lg font-semibold">{t("neutrals")}</h3>
                <ColorTextList colors={neutrals} />
              </div>
              <PaletteCardDownload slug={slug} label={st("downloadPalette")} termsLabel={st("downloadTerms")} />
            </div>
          </div>
        </section>

        {/* Outfit Inspiration */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("outfitSection")} — {displayName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {sectionDescs.outfit}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lookbook.sections
              .find((s) => s.title === "Outfit Inspiration")
              ?.images.map((img) => (
                <div key={img.src} className="group overflow-hidden rounded-xl border border-border bg-card">
                  <div className="relative aspect-[3/4] bg-muted">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <p className="p-3 text-sm text-muted-foreground">{imgCaptions[img.key] || img.alt}</p>
                </div>
              ))}
          </div>
          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold">{t("fashionTipsFor", { season: displayName })}</h3>
            <ul className="mt-3 space-y-2">
              {data.fashionTips.map((tip, i) => {
                const localTip = sd(`ft${i}`);
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 text-primary">→</span>
                    <span>{localTip}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Makeup Looks */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("makeupSection")} — {displayName}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {makeupItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {lookbook.sections
              .find((s) => s.title === "Makeup Looks")
              ?.images.map((img) => (
                <div key={img.src} className="group overflow-hidden rounded-xl border border-border bg-card">
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                  <p className="p-3 text-sm text-muted-foreground">{imgCaptions[img.key] || img.alt}</p>
                </div>
              ))}
          </div>
        </section>

        {/* Hair Color Ideas */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("hairSection")} — {displayName}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {hairColors.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
                <span className="text-xs">✓</span> {c}
              </span>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {lookbook.sections
              .find((s) => s.title === "Hair Color Ideas")
              ?.images.map((img) => (
                <div key={img.src} className="group overflow-hidden rounded-xl border border-border bg-card">
                  <div className="relative aspect-[3/4] bg-muted">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                  <p className="p-3 text-sm text-muted-foreground">{imgCaptions[img.key] || img.alt}</p>
                </div>
              ))}
          </div>
        </section>

        {/* Jewelry & Accessories */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("jewelrySection")} — {displayName}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{sd("jewelry")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {lookbook.sections
              .find((s) => s.title === "Jewelry & Accessories")
              ?.images.map((img) => (
                <div key={img.src} className="group overflow-hidden rounded-xl border border-border bg-card">
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                  <p className="p-3 text-sm text-muted-foreground">{imgCaptions[img.key] || img.alt}</p>
                </div>
              ))}
          </div>
        </section>

        {/* Colors to Avoid */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("avoidSection")} — {displayName}</h2>
          <ColorTextList colors={avoidColors} className="mt-4" />
        </section>

        {/* CTA */}
        <section className="my-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">{t("ctaTitle", { season: displayName })}</h2>
          <p className="mt-2 text-muted-foreground">{t("ctaDesc", { season: displayName })}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try?type=color_analysis"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("getAnalysis")}
            </Link>
            <Link
              href={`/color-palette/${slug}`}
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              {t("viewPalette", { season: displayName })}
            </Link>
          </div>
        </section>

        {/* Other Lookbooks */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("exploreLookbooks")}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sameFamilySiblings.map((sib) => {
              const SibCard = () => {
                const sibSd = useTranslations(`sd.${sib.slug}`);
                return (
                  <Link
                    href={`/lookbook/${sib.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md"
                  >
                    <PaletteCardImage
                      slug={sib.slug}
                      alt={ph("cardAlt", { season: sibSd("name") })}
                      sizes="48px"
                      className="w-12 shrink-0 self-start shadow-sm"
                      rounded="rounded"
                    />
                    <div>
                      <p className="font-semibold group-hover:text-primary">{sibSd("name")} Lookbook</p>
                      <p className="text-xs text-muted-foreground">{sibSd("tagline")}</p>
                    </div>
                  </Link>
                );
              };
              return <SibCard key={sib.slug} />;
            })}
          </div>
        </section>

        {/* Related Articles */}
        <section className="border-t border-border py-12 mb-10">
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
                  : s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Link>
            ))}
            <Link
              href="/lookbook"
              className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              {t("backToGuide")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
