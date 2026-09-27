import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import { TRANSFORMATION_TYPES } from "@/lib/transformation-data";
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
  const alternates = buildAlternates(locale, "/transformations");

  const title = messages.meta.transformationsTitle;
  const description = messages.meta.transformationsDescription;

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, type: "website", locale: ogLocale(locale), url: alternates.canonical },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TransformationsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Transformations", path: "/transformations" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TransformationsIndexContent />
    </>
  );
}

function TransformationsIndexContent() {
  const t = useTranslations("transformations");

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-serif text-3xl font-bold sm:text-5xl">{t("heroTitle")}</h1>
          <p className="mt-2 text-lg text-primary">{t("heroSubtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("heroDesc")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* Transformation Types Grid */}
        <section className="py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TRANSFORMATION_TYPES.map((type) => (
              <Link
                key={type.slug}
                href={`/transformations/${type.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
              >
                {/* Before → After → Report Preview */}
                <div className="relative flex h-48">
                  <div className="relative w-1/3 overflow-hidden bg-muted">
                    <Image
                      src={type.examples[0].before}
                      alt={`${type.name} before`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 17vw"
                      unoptimized
                    />
                    <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                      {t("before")}
                    </span>
                  </div>
                  <div className="relative w-1/3 overflow-hidden bg-muted">
                    <Image
                      src={type.examples[0].after}
                      alt={`${type.name} after`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 17vw"
                      unoptimized
                    />
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-primary/80 px-2 py-0.5 text-xs font-medium text-white">
                      {t("after")}
                    </span>
                  </div>
                  <div className="relative w-1/3 overflow-hidden bg-muted">
                    <Image
                      src={type.examples[0].report}
                      alt={`${type.name} AI report`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 17vw"
                      unoptimized
                    />
                    <span className="absolute bottom-2 right-2 rounded bg-emerald-600/80 px-2 py-0.5 text-xs font-medium text-white">
                      Report
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold group-hover:text-primary">{type.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{type.tagline}</p>
                  <p className="mt-2 text-xs font-medium text-primary">
                    {type.examples.length} example{type.examples.length > 1 ? "s" : ""} →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="my-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("ctaDesc")}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try?type=color_analysis"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("startAnalysis")}
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              {t("viewPricing")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
