import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import {
  FACE_SHAPES,
  FACE_SHAPE_SLUGS,
} from "@/lib/face-shape-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  const params: { locale: string; shape: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of FACE_SHAPE_SLUGS) {
      params.push({ locale, shape: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; shape: string }>;
}): Promise<Metadata> {
  const { locale, shape } = await params;
  const data = FACE_SHAPES[shape];
  if (!data) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const shapeName = data.name;

  const title = messages.meta.faceShapeTitle.replace(/\{shape\}/g, shapeName);
  const description = messages.meta.faceShapeDescription.replace(
    /\{shape\}/g,
    shapeName
  );
  const alternates = buildAlternates(locale, `/face-shape/${shape}`);

  return {
    title,
    description,
    alternates,
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

export default async function FaceShapePage({
  params,
}: {
  params: Promise<{ locale: string; shape: string }>;
}) {
  const { locale, shape } = await params;
  setRequestLocale(locale);
  const data = FACE_SHAPES[shape];
  if (!data) notFound();

  const shapeName = shape
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Face Shape", path: "/face-shape-analysis" },
    { name: shapeName, path: `/face-shape/${shape}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <FaceShapeContent slug={shape} />
    </>
  );
}

function FaceShapeContent({ slug }: { slug: string }) {
  const t = useTranslations("faceShapePage");
  const fs = useTranslations(`fs.${slug}`);
  const qt = useTranslations("quiz");
  const bt = useTranslations("blogTitles");

  const data = FACE_SHAPES[slug];
  const displayName = data.name;

  const otherShapes = FACE_SHAPE_SLUGS.filter((s) => s !== slug);

  const faqItems = [
    { q: fs("faq1Q"), a: fs("faq1A") },
    { q: fs("faq2Q"), a: fs("faq2A") },
    { q: fs("faq3Q"), a: fs("faq3A") },
    { q: fs("faq4Q"), a: fs("faq4A") },
    { q: fs("faq5Q"), a: fs("faq5A") },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-medium text-primary">
            <Link href="/face-shape-analysis" className="hover:underline">
              {t("guideLink")}
            </Link>
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
            {displayName}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {data.description}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4">
        {/* Characteristics */}
        <section className="py-12">
          <h2 className="text-2xl font-bold">
            {t("characteristics")} — {displayName}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["proportions", data.characteristics.proportions],
                ["jawline", data.characteristics.jawline],
                ["forehead", data.characteristics.forehead],
                ["cheekbones", data.characteristics.cheekbones],
              ] as const
            ).map(([key, val]) => (
              <div
                key={key}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {t(key)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{val}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Best Hairstyles */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("bestHairstyles", { shape: displayName })}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("bestHairstylesDesc")}
          </p>
          <ul className="mt-6 space-y-3">
            {data.bestHairstyles.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <span className="mt-0.5 text-primary">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Avoid Hairstyles */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("avoidHairstyles", { shape: displayName })}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("avoidHairstylesDesc")}
          </p>
          <ul className="mt-6 space-y-3">
            {data.avoidHairstyles.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <span className="mt-0.5 text-red-400">✕</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Bangs Guide */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("bangsGuide", { shape: displayName })}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {data.bangsGuide}
          </p>
        </section>

        {/* Glasses */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("glassesTitle", { shape: displayName })}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("glassesDesc")}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-primary">{t("bestFrames")}</h3>
              <ul className="mt-3 space-y-1.5">
                {data.glassesFrames.best.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">{t("avoidFrames")}</h3>
              <ul className="mt-3 space-y-1.5">
                {data.glassesFrames.avoid.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-red-400">✕</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Makeup Tips */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("makeupTitle", { shape: displayName })}
          </h2>
          <ul className="mt-6 space-y-3">
            {data.makeupTips.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <span className="mt-0.5 text-primary">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Earring Tips */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("earringTitle", { shape: displayName })}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("earringDesc")}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-primary">
                {t("bestEarrings")}
              </h3>
              <ul className="mt-3 space-y-1.5">
                {data.earringTips.best.map((tip) => (
                  <li
                    key={tip}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-primary">✓</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">{t("avoidEarrings")}</h3>
              <ul className="mt-3 space-y-1.5">
                {data.earringTips.avoid.map((tip) => (
                  <li
                    key={tip}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-red-400">✕</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Facial Hair Tips (for men) */}
        {data.facialHairTips && data.facialHairTips.length > 0 && (
          <section className="border-t border-border py-12">
            <h2 className="text-2xl font-bold">
              {t("facialHairTitle", { shape: displayName })}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("facialHairDesc")}
            </p>
            <ul className="mt-6 space-y-3">
              {data.facialHairTips.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 text-primary">→</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Celebrities */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("celebrityTitle", { shape: displayName })}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("celebrityDesc", { shape: displayName })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.celebrities.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">
            {t("faqTitle", { shape: displayName })}
          </h2>
          <div className="mt-6 space-y-6">
            {faqItems.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
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
              href="/try?type=face_shape"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("getMyAnalysis")}
            </Link>
            <Link
              href="/tools/face-shape-quiz"
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              {qt("startQuiz")}
            </Link>
          </div>
        </section>

        {/* Other Shapes */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("otherShapes")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherShapes.map((s) => {
              const shapeData = FACE_SHAPES[s];
              return (
                <Link
                  key={s}
                  href={`/face-shape/${s}`}
                  className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <h3 className="font-semibold group-hover:text-primary">
                    {shapeData.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {shapeData.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Related Articles */}
        <section className="border-t border-border mb-10 py-12">
          <h2 className="text-2xl font-bold">{t("relatedArticles")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.relatedSlugs.map((s) => (
              <Link
                key={s}
                href={`/blog/${s}`}
                className="rounded-lg border border-border px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-muted"
              >
                {bt.has(s)
                  ? bt(s)
                  : s
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
              </Link>
            ))}
            <Link
              href="/face-shape-analysis"
              className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              ← {t("backToGuide")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
