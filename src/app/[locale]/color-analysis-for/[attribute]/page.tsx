import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildBreadcrumbJsonLd, canonicalUrl, ogLocale } from "@/lib/seo";
import { localizedPageSeo } from "@/lib/untranslated";
import { PaletteCardDownload, PaletteCardImage, PaletteCardLarge } from "@/components/PaletteCardImage";
import { PageHero } from "@/components/PageHero";
import { SectionNav } from "@/components/SectionNav";
import { ColorTextList } from "@/components/ColorTextList";
import { SkinToneChart } from "@/components/SkinToneChart";
import { attributeCardKey, isColorNote, paletteImageJsonLd } from "@/lib/palette-card";
import { ATTRIBUTES, ATTRIBUTE_SLUGS } from "@/lib/color-analysis-for-data";
import { SEASON_SLUGS } from "@/lib/color-palette-data";
import { SKIN_TONE_CHARTS, type SkinUndertone } from "@/lib/skin-tone-chart-data";
import type { Metadata } from "next";
import { FeatureHeroActions, useFeatureCtaCopy } from "@/components/FeatureCta";
import { ResultCta } from "@/components/ResultCta";

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

  // 个别页面（如 asian-skin）按真实搜索意图单独写了标题和描述：ad.<slug>.metaTitle / metaDescription，没有就用通用模板
  const title: string =
    messages.ad?.[attribute]?.metaTitle ?? messages.meta.colorForTitle.replace(/\{audience\}/g, localName);
  const description: string =
    messages.ad?.[attribute]?.metaDescription ?? messages.meta.colorForDescription.replace(/\{audience\}/g, localName);
  const { alternates, robots } = localizedPageSeo(locale, "ad", attribute, `/color-analysis-for/${attribute}`);

  return {
    title,
    description,
    alternates,
    robots,
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
  const cta = useFeatureCtaCopy("color_analysis");
  const t = useTranslations("colorFor");
  const ad = useTranslations(`ad.${slug}`);
  const bt = useTranslations("blogTitles");
  const ph = useTranslations("paletteHub");
  const st = useTranslations("seasonPalette");
  const sd = useTranslations("sd");

  const data = ATTRIBUTES[slug];
  const displayName = ad("name");

  const challenges = data.challenges.map((_, i) => ad(`ch${i}`));
  // 链接目标只能由语言无关的英文数据决定：以前用译文拼 slug，非英语页变成 /color-palette/heller-frühling 之类的 404；
  // 英文里也有不是季型的条目（"All seasons apply"、"Undertone — …"、整句建议），这些只展示、不加链接。
  const commonSeasons = data.commonSeasons.map((source, i) => {
    const seasonSlug = source.split(" — ")[0].trim().toLowerCase().replace(/ /g, "-");
    return { text: ad(`cs${i}`), seasonSlug: SEASON_SLUGS.includes(seasonSlug) ? seasonSlug : null };
  });
  const bestColors = data.bestColors.map((c, i) => ({ name: ad(`bc${i}`), hex: c.hex }));
  const avoidColors = data.avoidColors.map((c, i) => ({ name: ad(`ac${i}`), hex: c.hex, note: isColorNote(c.name) }));
  const makeupTips = data.makeupTips.map((_, i) => ad(`mt${i}`));
  const wardrobeTips = data.wardrobeTips.map((_, i) => ad(`wt${i}`));
  // 前几条所有语种都有；后面按搜索问句补的问答，哪个语种写了就显示哪条
  const faqs = data.faq
    .map((_, i) => i)
    .filter((i) => ad.has(`faq${i}Q`))
    .map((i) => ({ q: ad(`faq${i}Q`), a: ad(`faq${i}A`) }));

  // 肤色色卡表：数据与语言无关，名称/表头文案只在写了 ad.<slug>.chart* 的语言里有，没有就不渲染
  const chartShades = SKIN_TONE_CHARTS[slug];
  const showChart = Boolean(chartShades) && ad.has("chartTitle");
  const undertoneLabel: Record<SkinUndertone, string> = showChart
    ? { cool: ad("chartUtCool"), neutral: ad("chartUtNeutral"), warm: ad("chartUtWarm"), olive: ad("chartUtOlive") }
    : { cool: "", neutral: "", warm: "", olive: "" };
  const chartRows = showChart
    ? chartShades.map((shade, i) => ({
        name: ad(`st${i}`),
        hex: shade.hex,
        undertone: undertoneLabel[shade.undertone],
        seasons: shade.seasons.map((s) => ({ slug: s, name: sd.has(`${s}.name`) ? sd(`${s}.name`) : s })),
      }))
    : [];

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
        actions={<FeatureHeroActions tool="color_analysis" copy={cta} from="color_for" />}
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
        {/* 肤色色卡表：放在最前面，搜「肤色表 / 色值」的人一进页面就能看到 */}
        {showChart && (
          <section className="py-12">
            <h2 className="text-2xl font-bold">{ad("chartTitle")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{ad("chartIntro")}</p>
            <SkinToneChart
              caption={ad("chartCaption")}
              headers={{
                shade: ad("chartHeadShade"),
                hex: ad("chartHeadHex"),
                undertone: ad("chartHeadUndertone"),
                seasons: ad("chartHeadSeasons"),
              }}
              rows={chartRows}
            />
            <p className="mt-4 text-xs italic text-muted-foreground">{ad("chartNote")}</p>
          </section>
        )}

        {/* Challenges */}
        <section className={showChart ? "border-t border-border py-12" : "py-12"}>
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
            {commonSeasons.map(({ text, seasonSlug }) => {
              const [seasonName, reason] = text.includes(" — ") ? text.split(" — ") : [text, ""];
              if (!seasonSlug) {
                return (
                  <div key={text} className="card-soft p-5">
                    <h3 className="font-semibold">{seasonName}</h3>
                    {reason && <p className="mt-1 text-sm text-muted-foreground">{reason}</p>}
                  </div>
                );
              }
              return (
                <Link key={text} href={`/color-palette/${seasonSlug}`} className="group card-soft p-5 transition hover:border-primary/40 hover:shadow-md">
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

        <ResultCta type="color_analysis" from="color_for" variant="band" />

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
