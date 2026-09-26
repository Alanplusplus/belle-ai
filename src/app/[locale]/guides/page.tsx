import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import { GUIDE_TOPICS } from "@/lib/guide-data";
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
  const alternates = buildAlternates(locale, "/guides");

  const title = messages.meta.guidesTitle;
  const description = messages.meta.guidesDescription;

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, type: "website", locale: ogLocale(locale), url: alternates.canonical },
    twitter: { card: "summary_large_image", title, description },
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
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("heroDesc")}</p>
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
                <h2 className="text-lg font-bold group-hover:text-primary">{guide.name}</h2>
                <p className="mt-1 text-sm text-primary">{guide.tagline}</p>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{guide.description}</p>
                <p className="mt-4 text-xs font-medium text-primary">{guide.sections.length} sections →</p>
              </Link>
            ))}
          </div>
        </section>

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
      </div>
    </>
  );
}
