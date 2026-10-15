import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import { GUIDE_TOPICS, GUIDE_SLUGS } from "@/lib/guide-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  const params: { locale: string; topic: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of GUIDE_SLUGS) {
      params.push({ locale, topic: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}): Promise<Metadata> {
  const { locale, topic } = await params;
  const data = GUIDE_TOPICS.find((g) => g.slug === topic);
  if (!data) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, `/guides/${topic}`);

  const title = messages.meta.guideTopicTitle.replace(/\{topic\}/g, data.name);
  const description = messages.meta.guideTopicDescription.replace(/\{description\}/g, data.description);

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, type: "website", locale: ogLocale(locale), url: alternates.canonical },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GuideTopicPage({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}) {
  const { locale, topic } = await params;
  setRequestLocale(locale);

  const data = GUIDE_TOPICS.find((g) => g.slug === topic);
  if (!data) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Visual Style Guides", path: "/guides" },
    { name: data.name, path: `/guides/${topic}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <GuideTopicContent slug={topic} />
    </>
  );
}

const SEASON_LABEL_TO_SLUG: Record<string, string> = {
  "Light Spring": "light-spring", "Warm Spring": "warm-spring", "Bright Spring": "bright-spring",
  "Light Summer": "light-summer", "Cool Summer": "cool-summer", "Soft Summer": "soft-summer",
  "Soft Autumn": "soft-autumn", "Warm Autumn": "warm-autumn", "Deep Autumn": "deep-autumn",
  "Deep Winter": "deep-winter", "Cool Winter": "cool-winter", "Bright Winter": "bright-winter",
};

function GuideTopicContent({ slug }: { slug: string }) {
  const t = useTranslations("guides");
  const bt = useTranslations("blogTitles");
  const sdRoot = useTranslations("sd");

  const data = GUIDE_TOPICS.find((g) => g.slug === slug)!;
  const otherGuides = GUIDE_TOPICS.filter((g) => g.slug !== slug);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-medium text-primary">
            <Link href="/guides" className="hover:underline">
              {t("backToAll").replace("← ", "")}
            </Link>
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-5xl">{t.has(`guide_${data.i18nKey}_name`) ? t(`guide_${data.i18nKey}_name`) : data.name}</h1>
          <p className="mt-2 text-lg text-primary">{t.has(`guide_${data.i18nKey}_tagline`) ? t(`guide_${data.i18nKey}_tagline`) : data.tagline}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t.has(`guide_${data.i18nKey}_desc`) ? t(`guide_${data.i18nKey}_desc`) : data.description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4">
        {/* Sections */}
        {data.sections.map((section, idx) => (
          <section key={idx} className={`py-12 ${idx > 0 ? "border-t border-border" : ""}`}>
            <h2 className="text-2xl font-bold">{t.has(`guide_${data.i18nKey}_s${idx}_title`) ? t(`guide_${data.i18nKey}_s${idx}_title`) : section.title}</h2>
            <p className="mt-2 text-muted-foreground">{t.has(`guide_${data.i18nKey}_s${idx}_desc`) ? t(`guide_${data.i18nKey}_s${idx}_desc`) : section.description}</p>

            {section.image && (
              <div className="mt-6 overflow-hidden rounded-xl border border-border">
                <div className={`relative bg-muted ${guideImageAspect(section.image)}`}>
                  <Image
                    src={section.image}
                    alt={`${data.name} — ${section.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              </div>
            )}

            {section.items && section.items.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    {item.hex && (
                      <div
                        className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-border/50 shadow-sm"
                        style={{ backgroundColor: item.hex }}
                        role="img"
                        aria-label={`${item.label} color: ${item.hex}`}
                      />
                    )}
                    <GuideItemText t={t} sdRoot={sdRoot} guideKey={data.i18nKey} sIdx={idx} iIdx={i} item={item} />
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* CTA */}
        <section className="my-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("ctaDesc")}</p>
          <div className="mt-6">
            <Link
              href="/try?type=color_analysis"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("getAnalysis")}
            </Link>
          </div>
        </section>

        {/* Related Articles */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("relatedArticles")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.relatedBlogSlugs.map((s) => (
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
          </div>
        </section>

        {/* Other Guides */}
        <section className="border-t border-border py-12 mb-10">
          <h2 className="text-2xl font-bold">{t("otherGuides")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {otherGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md"
              >
                <h3 className="font-semibold group-hover:text-primary">{t.has(`guide_${g.i18nKey}_name`) ? t(`guide_${g.i18nKey}_name`) : g.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.has(`guide_${g.i18nKey}_tagline`) ? t(`guide_${g.i18nKey}_tagline`) : g.tagline}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/guides" className="text-sm font-medium text-primary hover:underline">
              {t("backToAll")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function GuideItemText({ t, sdRoot, guideKey, sIdx, iIdx, item }: {
  t: ReturnType<typeof useTranslations>;
  sdRoot: ReturnType<typeof useTranslations>;
  guideKey: string;
  sIdx: number;
  iIdx: number;
  item: { label: string; detail: string };
}) {
  const labelKey = `guide_${guideKey}_s${sIdx}_i${iIdx}_label`;
  const detailKey = `guide_${guideKey}_s${sIdx}_i${iIdx}_detail`;
  const shortKey = `guide_${guideKey}_s${sIdx}_i${iIdx}`;
  const bestKey = `guide_${guideKey}_s${sIdx}_best`;
  const avoidKey = `guide_${guideKey}_s${sIdx}_avoid`;
  const tipKey = `guide_${guideKey}_s${sIdx}_tip`;
  const bestLabelKey = `guide_${guideKey}_bestFrames`;
  const avoidLabelKey = `guide_${guideKey}_avoid`;
  const tipLabelKey = `guide_${guideKey}_tipLabel`;
  const avoidHairLabelKey = `guide_${guideKey}_avoidLabel`;

  let label = item.label;
  let detail = item.detail;

  if (t.has(labelKey)) {
    label = t(labelKey);
    detail = t.has(detailKey) ? t(detailKey) : item.detail;
  } else if (item.label === "Best Frames" && t.has(bestLabelKey)) {
    label = t(bestLabelKey);
    detail = t.has(bestKey) ? t(bestKey) : item.detail;
  } else if (item.label === "Avoid" && t.has(avoidLabelKey)) {
    label = t(avoidLabelKey);
    detail = t.has(avoidKey) ? t(avoidKey) : item.detail;
  } else if (item.label === "Avoid" && t.has(avoidHairLabelKey)) {
    label = t(avoidHairLabelKey);
    detail = t.has(avoidKey) ? t(avoidKey) : item.detail;
  } else if (item.label === "Tip" && t.has(tipLabelKey)) {
    label = t(tipLabelKey);
    detail = t.has(tipKey) ? t(tipKey) : item.detail;
  } else if (t.has(shortKey)) {
    detail = t(shortKey);
  }

  const seasonSlug = SEASON_LABEL_TO_SLUG[item.label];
  if (seasonSlug) {
    const sdNameKey = `${seasonSlug}.name` as Parameters<typeof sdRoot>[0];
    if (sdRoot.has(sdNameKey)) label = sdRoot(sdNameKey);
  }

  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function guideImageAspect(src: string): string {
  if (src.includes("season_")) return "aspect-[4/3]";
  if (src.includes("dim_hair_")) return "aspect-square";
  return "aspect-[16/9]";
}
