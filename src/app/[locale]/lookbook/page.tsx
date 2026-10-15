import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { SEASON_PALETTES, PARENT_SEASON_ORDER, getSeasonsByParent } from "@/lib/color-palette-data";
import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/lookbook");

  const title = messages.meta.lookbookIndexTitle;
  const description = messages.meta.lookbookIndexDescription;

  return {
    title,
    description,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title,
      description,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function LookbookIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Color Analysis", path: "/color-analysis" },
    { name: "Style Lookbooks", path: "/lookbook" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <LookbookIndexContent />
    </>
  );
}

function LookbookIndexContent() {
  const t = useTranslations("lookbook");

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="font-serif text-3xl font-bold sm:text-5xl">
            {t("indexHeroTitle")}
          </h1>
          <p className="mt-2 text-lg text-primary">{t("indexHeroSubtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("indexHeroDesc")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-16">
        {PARENT_SEASON_ORDER.map((parent) => (
          <SeasonGroup key={parent} parent={parent} />
        ))}

        {/* CTA */}
        <section className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">{t("ctaTitle").replace("{season}", "")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("ctaDesc2")}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try?type=color_analysis"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("getAnalysis")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function SeasonGroup({ parent }: { parent: string }) {
  const t = useTranslations("lookbook");
  const sd = useTranslations("sd");
  const seasons = getSeasonsByParent(parent);
  const parentKeys: Record<string, string> = { spring: "parentSpring", summer: "parentSummer", autumn: "parentAutumn", winter: "parentWinter" };
  const parentLabel = t(parentKeys[parent] || parent);

  const gradients: Record<string, string> = {
    spring: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    summer: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
    autumn: "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
    winter: "from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20",
  };

  const emojis: Record<string, string> = {
    spring: "🌸",
    summer: "🌊",
    autumn: "🍂",
    winter: "❄️",
  };

  return (
    <section className="mt-10 first:mt-0">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <span>{emojis[parent]}</span>
        {parentLabel}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((season) => {
          const name = sd.has(`${season.slug}.name`) ? sd(`${season.slug}.name`) : season.name.split(" (")[0];
          return (
            <Link
              key={season.slug}
              href={`/lookbook/${season.slug}`}
              className={`group overflow-hidden rounded-xl border border-border bg-gradient-to-br ${gradients[parent] || ""} transition hover:border-primary/40 hover:shadow-lg`}
            >
              {/* Color swatch strip */}
              <div className="flex h-12">
                {season.bestColors.slice(0, 8).map((c) => (
                  <div
                    key={c.hex}
                    className="flex-1 transition-transform group-hover:scale-y-110"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold group-hover:text-primary">{name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {sd.has(`${season.slug}.tagline`) ? sd(`${season.slug}.tagline`) : `${season.characteristics.undertone} undertone · ${season.characteristics.depth} depth · ${season.characteristics.chroma} chroma`}
                </p>
                <p className="mt-2 text-xs font-medium text-primary">
                  {t("indexViewLookbook")}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
