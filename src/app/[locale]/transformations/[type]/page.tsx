import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import { TRANSFORMATION_TYPES, TRANSFORMATION_SLUGS, TRANSFORMATION_TOOL } from "@/lib/transformation-data";
import { ResultCta } from "@/components/ResultCta";
import { FunnelLink } from "@/components/FunnelLink";
import { sampleHref } from "@/lib/blogTools";
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
  const tp = useTranslations("tryPage");
  const data = TRANSFORMATION_TYPES.find((t) => t.slug === slug)!;
  const tool = TRANSFORMATION_TOOL[slug] ?? "color_analysis";
  const otherTypes = TRANSFORMATION_TYPES.filter((t) => t.slug !== slug);

  return (
    <>
      {/* Hero */}
      <section className="hero-soft py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-medium text-primary">
            <Link href="/transformations" className="hover:underline">
              {t("backToAll").replace("← ", "")}
            </Link>
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-5xl">{t(`type_${data.slug}_name`)}</h1>
          <p className="mt-2 text-lg text-primary">{t(`type_${data.slug}_tagline`)}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t(`type_${data.slug}_desc`)}</p>
          {/* 先给「成品」：这个工具现在真实生成的示例报告 + 直接试 / 先看示例 */}
          <ResultCta type={tool} from="transformations" className="mx-auto mt-8 max-w-3xl text-left" />
        </div>
      </section>

      <div className="content-page mx-auto max-w-4xl px-4">
        {/* Examples */}
        <section className="py-12">
          <div className="space-y-12">
            {data.examples.map((example, idx) => (
              <div key={idx} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Before → After：故事照。成品（报告）统一放在页面顶部和底部的示例卡里，每个例子不再重复贴一张报告图 */}
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <div className="relative bg-muted">
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={example.before}
                        alt={`${data.name} · ${t("before")} — ${example.label}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
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
                        alt={`${data.name} · ${t("after")} — ${example.label}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-primary/80 px-3 py-1 text-sm font-medium text-white">
                        {t("after")}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Details */}
                <div className="p-6">
                  <h2 className="text-xl font-bold">{t.has(`type_${data.slug}_ex${idx}_label`) ? t(`type_${data.slug}_ex${idx}_label`) : example.label}</h2>
                  <p className="mt-2 text-muted-foreground">{t.has(`type_${data.slug}_ex${idx}_desc`) ? t(`type_${data.slug}_ex${idx}_desc`) : example.description}</p>
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
                      <p className="mt-1 text-sm text-muted-foreground">{t.has(`type_${data.slug}_ex${idx}_details`) ? t(`type_${data.slug}_ex${idx}_details`) : example.details}</p>
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
              href={`/try?type=${tool}`}
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("startAnalysis")}
            </Link>
            <FunnelLink
              href={sampleHref(tool)}
              from="transformations"
              tool={tool}
              kind="sample"
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              {tp("trySample")}
            </FunnelLink>
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
                className="group card-soft p-4 transition hover:border-primary/40 hover:shadow-md"
              >
                <h3 className="font-semibold group-hover:text-primary">{t(`type_${other.slug}_name`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`type_${other.slug}_tagline`)}</p>
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
