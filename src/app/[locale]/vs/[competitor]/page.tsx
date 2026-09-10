import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import type { Metadata } from "next";

const VS_SLUGS = [
  "dressika",
  "colorwise",
  "professional-stylist",
  "mycoloranalysis",
  "color-analysis-app",
  "palettehunt",
] as const;

const VS_COUNTS: Record<
  string,
  { features: number; belleAdv: number; compAdv: number }
> = {
  dressika: { features: 9, belleAdv: 5, compAdv: 4 },
  colorwise: { features: 7, belleAdv: 5, compAdv: 3 },
  "professional-stylist": { features: 8, belleAdv: 6, compAdv: 4 },
  mycoloranalysis: { features: 9, belleAdv: 5, compAdv: 3 },
  "color-analysis-app": { features: 8, belleAdv: 6, compAdv: 4 },
  palettehunt: { features: 8, belleAdv: 5, compAdv: 3 },
};

export function generateStaticParams() {
  const params: { locale: string; competitor: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of VS_SLUGS) {
      params.push({ locale, competitor: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; competitor: string }>;
}): Promise<Metadata> {
  const { locale, competitor } = await params;
  if (!VS_COUNTS[competitor]) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const name = messages.vs?.[competitor]?.name ?? competitor;
  const description = messages.vs?.[competitor]?.desc ?? "";
  const title = (messages.meta?.vsTitle ?? "Belle AI vs {competitor}").replace(
    /\{competitor\}/g,
    name
  );
  const alternates = buildAlternates(locale, `/vs/${competitor}`);

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

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ locale: string; competitor: string }>;
}) {
  const { locale, competitor } = await params;
  if (!VS_COUNTS[competitor]) notFound();

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const name = messages.vs?.[competitor]?.name ?? competitor;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name, path: `/vs/${competitor}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <VsContent slug={competitor} />
    </>
  );
}

function VsContent({ slug }: { slug: string }) {
  const t = useTranslations("vsPage");
  const v = useTranslations(`vs.${slug}`);
  const counts = VS_COUNTS[slug];
  const name = v("name");

  const comparison = Array.from({ length: counts.features }, (_, i) => ({
    feature: v(`feat${i}`),
    belle: v(`belle${i}`),
    competitor: v(`comp${i}`),
  }));

  const belleAdvantages = Array.from({ length: counts.belleAdv }, (_, i) =>
    v(`ba${i}`)
  );

  const competitorAdvantages = Array.from({ length: counts.compAdv }, (_, i) =>
    v(`ca${i}`)
  );

  const faqItems = [
    { q: v("faq1Q"), a: v("faq1A") },
    { q: v("faq2Q"), a: v("faq2A") },
    { q: v("faq3Q"), a: v("faq3A") },
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
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {t("title", { competitor: name })}
          </h1>
          <p className="mt-3 text-muted-foreground">{v("desc")}</p>

          <div className="mt-10 overflow-x-auto">
            <h2 className="mb-4 text-xl font-semibold">{t("comparisonTitle")}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 text-left font-semibold">
                    {t("featureColumn")}
                  </th>
                  <th className="py-3 text-left font-semibold text-primary">
                    {t("belleColumn")}
                  </th>
                  <th className="py-3 text-left font-semibold">{name}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="py-3 font-medium">{row.feature}</td>
                    <td className="py-3">{row.belle}</td>
                    <td className="py-3 text-muted-foreground">
                      {row.competitor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <h3 className="font-semibold text-primary">
                {t("belleAdvantages")}
              </h3>
              <ul className="mt-3 space-y-2">
                {belleAdvantages.map((adv) => (
                  <li key={adv} className="flex items-start gap-2 text-sm">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold">
                {t("competitorAdvantages", { competitor: name })}
              </h3>
              <ul className="mt-3 space-y-2">
                {competitorAdvantages.map((adv) => (
                  <li
                    key={adv}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-muted/50 p-6">
            <h3 className="font-semibold">{t("verdictTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {v("verdict")}
            </p>
          </div>

          <div className="mt-10 text-center">
            <p className="text-lg font-semibold">{t("ctaTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("ctaDesc")}</p>
            <Link
              href="/try"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("tryBelle")}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("ctaSubtext")}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
