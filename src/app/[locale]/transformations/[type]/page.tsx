import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import { TRANSFORMATION_TYPES, TRANSFORMATION_SLUGS } from "@/lib/transformation-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  const params: { locale: string; type: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of TRANSFORMATION_SLUGS) {
      params.push({ locale, type: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}): Promise<Metadata> {
  const { locale, type } = await params;
  const data = TRANSFORMATION_TYPES.find((t) => t.slug === type);
  if (!data) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, `/transformations/${type}`);

  const title = messages.meta.transformationTypeTitle.replace(/\{type\}/g, data.name);
  const description = messages.meta.transformationTypeDescription.replace(/\{type\}/g, data.name);

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, type: "website", locale: ogLocale(locale), url: alternates.canonical },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TransformationTypePage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;
  setRequestLocale(locale);

  const data = TRANSFORMATION_TYPES.find((t) => t.slug === type);
  if (!data) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Transformations", path: "/transformations" },
    { name: data.name, path: `/transformations/${type}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TransformationTypeContent slug={type} />
    </>
  );
}

function TransformationTypeContent({ slug }: { slug: string }) {
  const t = useTranslations("transformations");
  const data = TRANSFORMATION_TYPES.find((t) => t.slug === slug)!;
  const otherTypes = TRANSFORMATION_TYPES.filter((t) => t.slug !== slug);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-medium text-primary">
            <Link href="/transformations" className="hover:underline">
              {t("backToAll").replace("← ", "")}
            </Link>
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-5xl">{data.name}</h1>
          <p className="mt-2 text-lg text-primary">{data.tagline}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{data.description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4">
        {/* Examples */}
        <section className="py-12">
          <div className="space-y-12">
            {data.examples.map((example, idx) => (
              <div key={idx} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Before → After → Report */}
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  <div className="relative bg-muted">
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={example.before}
                        alt={`${data.name} before — ${example.label}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        unoptimized
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">
                        {t("before")}
                      </span>
                    </div>
                  </div>
                  <div className="relative bg-muted">
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={example.after}
                        alt={`${data.name} after — ${example.label}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        unoptimized
                      />
                      <span className="absolute left-1/2 -translate-x-1/2 top-3 rounded-full bg-primary/80 px-3 py-1 text-sm font-medium text-white">
                        {t("after")}
                      </span>
                    </div>
                  </div>
                  <div className="relative bg-muted">
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={example.report}
                        alt={`${data.name} AI report — ${example.label}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        unoptimized
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600/80 px-3 py-1 text-sm font-medium text-white">
                        AI Report
                      </span>
                    </div>
                  </div>
                </div>
                {/* Details */}
                <div className="p-6">
                  <h2 className="text-xl font-bold">{example.label}</h2>
                  <p className="mt-2 text-muted-foreground">{example.description}</p>
                  {example.season && (
                    <p className="mt-3 text-sm">
                      <span className="font-semibold text-primary">{t("seasonLabel")}:</span>{" "}
                      <span className="text-muted-foreground">{example.season}</span>
                    </p>
                  )}
                  {example.details && (
                    <div className="mt-4 rounded-lg bg-muted/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {t("detailsLabel")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{example.details}</p>
                    </div>
                  )}
                </div>
              </div>
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

        {/* Other Types */}
        <section className="border-t border-border py-12 mb-10">
          <h2 className="text-2xl font-bold">{t("otherTypes")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherTypes.map((other) => (
              <Link
                key={other.slug}
                href={`/transformations/${other.slug}`}
                className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md"
              >
                <h3 className="font-semibold group-hover:text-primary">{other.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{other.tagline}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/transformations"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("backToAll")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
