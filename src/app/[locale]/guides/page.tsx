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
import { GUIDE_TOPICS } from "@/lib/guide-data";
import type { Metadata } from "next";
import { ResultCta } from "@/components/ResultCta";

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
  const alternates = buildAlternates(locale, "/guides");

  const title = messages.meta.guidesTitle;
  const description = messages.meta.guidesDescription;

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, type: "website", locale: ogLocale(locale), url: alternates.canonical, images: OG_IMAGES },
    twitter: { card: "summary_large_image", title, description, images: TWITTER_IMAGES },
  };
}

export default async function GuidesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Visual Style Guides", path: "/guides" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <GuidesIndexContent />
    </>
  );
}

function GuidesIndexContent() {
  const t = useTranslations("guides");

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-serif text-3xl font-bold sm:text-5xl">{t("heroTitle")}</h1>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        <section className="py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDE_TOPICS.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-lg"
              >
                <h2 className="text-lg font-bold group-hover:text-primary">{t.has(`guide_${guide.i18nKey}_name`) ? t(`guide_${guide.i18nKey}_name`) : guide.name}</h2>
                <p className="mt-1 text-sm text-primary">{t.has(`guide_${guide.i18nKey}_tagline`) ? t(`guide_${guide.i18nKey}_tagline`) : guide.tagline}</p>
                <p className="mt-3 text-xs font-medium text-primary">{t("sectionsCount", { count: guide.sections.length })}</p>
              </Link>
            ))}
          </div>
        </section>

        <ResultCta type="color_analysis" from="guide" variant="band" />
      </div>
    </>
  );
}
