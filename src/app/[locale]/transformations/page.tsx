import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { TRANSFORMATION_TYPES } from "@/lib/transformation-data";
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
  const alternates = buildAlternates(locale, "/transformations");

  const title = messages.meta.transformationsTitle;
  const description = messages.meta.transformationsDescription;

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, type: "website", locale: ogLocale(locale), url: alternates.canonical, images: OG_IMAGES },
    twitter: { card: "summary_large_image", title, description, images: TWITTER_IMAGES },
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
                {/* Before → After 预览（成品报告放在每个类型的详情页顶部，用现在真实的示例报告） */}
                <div className="relative flex h-56">
                  <div className="relative w-1/2 overflow-hidden bg-muted">
                    <Image
                      src={type.examples[0].before}
                      alt={`${type.name} · ${t("before")}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 17vw"
                    />
                    <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                      {t("before")}
                    </span>
                  </div>
                  <div className="relative w-1/2 overflow-hidden bg-muted">
                    <Image
                      src={type.examples[0].after}
                      alt={`${type.name} · ${t("after")}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 17vw"
                    />
                    <span className="absolute bottom-2 right-2 rounded bg-primary/80 px-2 py-0.5 text-xs font-medium text-white">
                      {t("after")}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold group-hover:text-primary">{t(`type_${type.slug}_name`)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`type_${type.slug}_tagline`)}</p>
                  <p className="mt-2 text-xs font-medium text-primary">
                    {type.examples.length > 1 ? t("examplesCount", { count: type.examples.length }) : t("examplesSingle")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <ResultCta type="color_analysis" from="transformations" variant="band" />
      </div>
    </>
  );
}
