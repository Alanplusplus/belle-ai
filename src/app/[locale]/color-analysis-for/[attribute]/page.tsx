import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, canonicalUrl, ogLocale } from "@/lib/seo";
import { PaletteCardDownload, PaletteCardImage, PaletteCardLarge } from "@/components/PaletteCardImage";
import { PageHero } from "@/components/PageHero";
import { SectionNav } from "@/components/SectionNav";
import { ColorTextList } from "@/components/ColorTextList";
import { attributeCardKey, isColorNote, paletteImageJsonLd } from "@/lib/palette-card";
import { ATTRIBUTES, ATTRIBUTE_SLUGS } from "@/lib/color-analysis-for-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  const params: { locale: string; attribute: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of ATTRIBUTE_SLUGS) {
      params.push({ locale, attribute: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; attribute: string }>;
}): Promise<Metadata> {
  const { locale, attribute } = await params;
  const data = ATTRIBUTES[attribute];
  if (!data) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;

  const localName = messages.ad?.[attribute]?.name ?? data.name;

  const title = messages.meta.colorForTitle.replace(/\{audience\}/g, localName);
  const description = messages.meta.colorForDescription.replace(/\{audience\}/g, localName);
  const alternates = buildAlternates(locale, `/color-analysis-for/${attribute}`);

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

export default async function ColorAnalysisForPage({
  params,
}: {
  params: Promise<{ locale: string; attribute: string }>;
}) {
  const { locale, attribute } = await params;
  setRequestLocale(locale);
  const data = ATTRIBUTES[attribute];
  if (!data) notFound();

  const attributeName = attribute
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Color Analysis", path: "/color-analysis" },
    { name: attributeName, path: `/color-analysis-for/${attribute}` },
  ]);

  // 页面上真实嵌入了这张色板卡片：写明授权和署名，授权说明在 /color-palette#license
  const imageJsonLd = paletteImageJsonLd({
    slug: attributeCardKey(attribute),
    name: data.name,
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
      <ColorAnalysisForContent slug={attribute} />
    </>
  );
}

function ColorAnalysisForContent({ slug }: { slug: string }) {
  const t = useTranslations("colorFor");
  const ad = useTranslations(`ad.${slug}`);
  const bt = useTranslations("blogTitles");
  const ph = useTranslations("paletteHub");
  const st = useTranslations("seasonPalette");

  const data = ATTRIBUTES[slug];
  const displayName = ad("name");

  const challenges = data.challenges.map((_, i) => ad(`ch${i}`));
  const commonSeasons = data.commonSeasons.map((_, i) => ad(`cs${i}`));
  const bestColors = data.bestColors.map((c, i) => ({ name: ad(`bc${i}`), hex: c.hex }));
  const avoidColors = data.avoidColors.map((c, i) => ({ name: ad(`ac${i}`), hex: c.hex, note: isColorNote(c.name) }));
  const makeupTips = data.makeupTips.map((_, i) => ad(`mt${i}`));
  const wardrobeTips = data.wardrobeTips.map((_, i) => ad(`wt${i}`));
  const faqs = data.faq.map((_, i) => ({ q: ad(`faq${i}Q`), a: ad(`faq${i}A`) }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const otherAttributes = Object.values(ATTRIBUTES).filter((a) => a.slug !== slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero：右边是这个人群的色板卡片（微微倾斜） */}
      <PageHero
        crumb={
          <>
            <Link href="/color-analysis" className="hover:underline">{t("guideLink")}</Link>{" "}
            / {t("forLabel", { audience: displayName })}
          </>
        }
        title={t("colorAnalysisFor", { audience: displayName })}
        description={ad("heroDesc")}
        actions={
          <Link href="/try?type=color_analysis" className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-7 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
            {t("getMyAnalysis")}
          </Link>
        }
        visual={
          <div className="mx-auto w-[62%] max-w-[17rem] rotate-[3deg] lg:w-[78%]">
            <PaletteCardImage
              slug={attributeCardKey(slug)}
              alt={ph("cardAltGuide", { name: displayName })}
              sizes="(min-width: 1024px) 260px, 60vw"
              priority
              rounded="rounded-xl"
              className="w-full shadow-2xl shadow-primary/25"
            />
          </div>
        }
      />
      <SectionNav />

      <div className="content-page mx-auto max-w-4xl px-4">
        {/* Challenges */}
        <section className="py-12">
          <h2 className="text-2xl font-bold">{t("challenges", { audience: displayName })}</h2>
          <ul className="mt-6 space-y-3">
            {challenges.map((ch) => (
              <li key={ch} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 text-primary">→</span><span>{ch}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Undertone */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("findUndertone")}</h2>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{ad("undertone")}</p>
        </section>

        {/* Common Seasons */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("commonSeasons", { audience: displayName })}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {commonSeasons.map((cs) => {
              const [seasonName, reason] = cs.includes(" — ") ? cs.split(" — ") : [cs, ""];
              const csSlug = seasonName.toLowerCase().replace(/ /g, "-");
              return (
                <Link key={cs} href={`/color-palette/${csSlug}`} className="group card-soft p-5 transition hover:border-primary/40 hover:shadow-md">
                  <h3 className="font-semibold group-hover:text-primary">{seasonName}</h3>
                  {reason && <p className="mt-1 text-sm text-muted-foreground">{reason}</p>}
                </Link>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground italic">{t("commonSeasonsNote")}</p>
        </section>

        {/* 色板：用 PNG 卡片展示，不再由浏览器用 CSS 画色块。颜色名和色值保留为纯文本（可复制、可被搜索引擎读到） */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("bestColors", { audience: displayName })}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("bestColorsDesc", { audience: displayName })}</p>

          <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,26rem)_1fr]">
            <PaletteCardLarge slug={attributeCardKey(slug)} alt={ph("cardAltGuide", { name: displayName })} />

            <div className="space-y-8">
              <ColorTextList colors={bestColors} className="mt-0" />

              <div>
                <h3 className="text-lg font-semibold">{t("avoidColors")}</h3>
                <ColorTextList colors={avoidColors} />
              </div>

              <PaletteCardDownload
                slug={attributeCardKey(slug)}
                label={st("downloadPalette")}
                termsLabel={st("downloadTerms")}
              />
            </div>
          </div>
        </section>

        {/* Makeup */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("makeupTips", { audience: displayName })}</h2>
          <ul className="mt-6 space-y-3">
            {makeupTips.map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 text-primary">→</span><span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Wardrobe */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("wardrobeTips", { audience: displayName })}</h2>
          <ul className="mt-6 space-y-3">
            {wardrobeTips.map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 text-primary">→</span><span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="my-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("ctaDesc", { audience: displayName })}</p>
          <Link href="/try?type=color_analysis" className="mt-6 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl">
            {t("getMyAnalysis")}
          </Link>
        </section>

        {/* FAQ */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("faqTitle", { audience: displayName })}</h2>
          <div className="mt-6 space-y-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* More Guides */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("moreGuides")}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {otherAttributes.map((attr) => {
              const OtherName = () => {
                const oAd = useTranslations(`ad.${attr.slug}`);
                return (
                  <Link href={`/color-analysis-for/${attr.slug}`} className="rounded-lg border border-border px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-muted">
                    {t("colorAnalysisFor", { audience: oAd("name") })}
                  </Link>
                );
              };
              return <OtherName key={attr.slug} />;
            })}
          </div>
        </section>

        {/* Related & Back */}
        <section className="border-t border-border py-12 mb-10">
          <h2 className="text-2xl font-bold">{t("relatedArticles")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.relatedSlugs.map((rs) => (
              <Link key={rs} href={`/blog/${rs}`} className="rounded-lg border border-border px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-muted">
                {bt.has(rs) ? bt(rs) : rs.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
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
