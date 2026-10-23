import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  canonicalUrl,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { PARENT_SEASON_ORDER, getSeasonsByParent } from "@/lib/color-palette-data";
import { brandMarkupToHtml } from "@/lib/embed";
import { CopyCodeBox } from "@/components/CopyCodeBox";
import { PaletteCardImage } from "@/components/PaletteCardImage";
import { paletteCardFilename, paletteCardPath, paletteImageJsonLd } from "@/lib/palette-card";

const PATH = "/color-palette";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "paletteHub" });
  const alternates = buildAlternates(locale, PATH);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function ColorPaletteHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "paletteHub" });
  const guide = await getTranslations({ locale, namespace: "colorGuide" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const footer = await getTranslations({ locale, namespace: "footer" });

  // 大类名（Spring / Summer / Autumn / Winter）用色彩指南页已有的本地化名称
  const parentName: Record<(typeof PARENT_SEASON_ORDER)[number], string> = {
    spring: guide("springName"),
    summer: guide("summerName"),
    autumn: guide("autumnName"),
    winter: guide("winterName"),
  };

  const groups = await Promise.all(
    PARENT_SEASON_ORDER.map(async (parent) => {
      const seasons = await Promise.all(
        getSeasonsByParent(parent).map(async (season) => {
          const sd = await getTranslations({ locale, namespace: `sd.${season.slug}` });
          return { season, name: sd("name"), tagline: sd("tagline") };
        }),
      );
      return { parent, seasons };
    }),
  );

  const hubUrl = canonicalUrl(locale, PATH);
  const creditHtml = brandMarkupToHtml(t.raw("credit") as string, hubUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    description: t("metaDescription"),
    url: hubUrl,
    inLanguage: locale,
    // 授权说明就在本页的 #license：Google 图片等据此识别「可使用、需署名」
    license: `${hubUrl}#license`,
    creditText: "Belle AI (aicoloranalysis.io)",
    creator: { "@type": "Organization", name: "Belle AI", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: groups.flatMap((g) => g.seasons).map(({ season, name }, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name,
        url: canonicalUrl(locale, `/color-palette/${season.slug}`),
      })),
    },
  };
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [{ name: t("breadcrumb"), path: PATH }]);
  // 页面上真实嵌入了这 12 张图：给每张写明授权和署名（图上的文字是英文，所以名称也用英文）
  const imagesJsonLd = [
    ...PARENT_SEASON_ORDER.map((parent) =>
      paletteImageJsonLd({
        slug: parent,
        name: parent.charAt(0).toUpperCase() + parent.slice(1),
        licenseUrl: `${hubUrl}#license`,
      }),
    ),
    ...groups.flatMap((g) =>
      g.seasons.map(({ season }) =>
        paletteImageJsonLd({
          slug: season.slug,
          name: season.name.split(" (")[0],
          licenseUrl: `${hubUrl}#license`,
        }),
      ),
    ),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(imagesJsonLd) }} />

      <section className="bg-gradient-to-b from-primary/5 to-transparent py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{t("title")}</h1>
          <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">{t("intro")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4">
        <section id="license" className="scroll-mt-24 py-8">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h2 className="text-lg font-semibold">{t("licenseTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("licenseText")}</p>
            <h3 className="mt-5 text-sm font-semibold">{t("creditTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("creditIntro")}</p>
            <div className="mt-3">
              <CopyCodeBox
                code={creditHtml}
                copyLabel={t("copy")}
                copiedLabel={t("copied")}
                ariaLabel={t("creditTitle")}
                rows={2}
              />
            </div>
          </div>
        </section>

        {/* 四大季型的入口：这 4 个大类页此前只靠互相链接和 sitemap 才能到达 */}
        <section className="py-6">
          <h2 className="text-xl font-semibold">{t("parentTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("parentDesc")}</p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PARENT_SEASON_ORDER.map((parent) => (
              <li key={parent} className="flex flex-col rounded-xl border border-border bg-card p-3">
                <Link href={`/color-palette/${parent}`} tabIndex={-1} className="block">
                  <PaletteCardImage
                    slug={parent}
                    alt={t("cardAltParent", { season: parentName[parent] })}
                    sizes="(min-width: 896px) 200px, 45vw"
                    className="w-full shadow-sm transition hover:shadow-md"
                  />
                </Link>
                <h3 className="mt-3 font-semibold">{parentName[parent]}</h3>
                <Link
                  href={`/color-palette/${parent}`}
                  className="mt-1 text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t("viewParent", { season: parentName[parent] })}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {groups.map(({ parent, seasons }) => (
          <section key={parent} className="py-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-xl font-semibold">{parentName[parent]}</h2>
              <Link
                href={`/color-palette/${parent}`}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {t("viewParent", { season: parentName[parent] })} →
              </Link>
            </div>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {seasons.map(({ season, name, tagline }) => (
                <li key={season.slug} className="flex flex-col rounded-xl border border-border bg-card p-3">
                  {/* 点图进入该季型的色板页；键盘用户走下面的「查看」链接，这里不重复占一个 Tab 位 */}
                  <Link href={`/color-palette/${season.slug}`} tabIndex={-1} className="block">
                    <PaletteCardImage
                      slug={season.slug}
                      alt={t("cardAlt", { season: name })}
                      sizes="(min-width: 896px) 272px, (min-width: 640px) 30vw, 90vw"
                      className="w-full shadow-sm transition hover:shadow-md"
                    />
                  </Link>
                  <h3 className="mt-4 font-semibold">{name}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{tagline}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <a
                      href={paletteCardPath(season.slug)}
                      download={paletteCardFilename(season.slug)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 font-medium text-primary transition hover:bg-primary/10"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      {t("download")}
                    </a>
                    <Link
                      href={`/color-palette/${season.slug}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {t("view")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="border-t border-border py-10">
          <h2 className="text-lg font-semibold">{t("noteTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("noteText")}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {[
              { href: "/ai-color-analysis-accuracy", label: footer("aiAccuracy") },
              { href: "/tools/color-quiz", label: nav("colorQuiz") },
              { href: "/tools/embed", label: footer("embedQuizzes") },
              { href: "/color-analysis", label: nav("colorAnalysisGuide") },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
