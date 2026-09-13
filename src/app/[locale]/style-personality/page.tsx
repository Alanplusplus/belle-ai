import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/style-personality");
  return {
    title: messages.meta.styleTitle,
    description: messages.meta.styleDescription,
    alternates,
    openGraph: {
      title: messages.meta.styleTitle,
      description: messages.meta.styleDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.styleTitle,
      description: messages.meta.styleDescription,
    },
  };
}

export default async function StylePersonalityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stylePage" });
  const ft = await getTranslations({ locale, namespace: "features" });

  const faqCount = 5;
  const faqs = Array.from({ length: faqCount }, (_, i) => ({
    q: t(`faq${i + 1}Q`),
    a: t(`faq${i + 1}A`),
  }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Style Personality", path: "/style-personality" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-primary">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("description")}</p>
          <Link
            href="/try?type=style_personality"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold">{t("archetypes")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONALITIES.map((p) => (
              <div key={p.name} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                  />
                </div>
                <div className="p-3 text-center">
                  <p className="font-medium">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.essence}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold">{t("whatYouGet")}</h2>
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            {INCLUDES.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <span className="mt-0.5 text-primary">✓</span>
                <p className="text-sm">{t(item)}</p>
              </div>
            ))}
          </div>
          <Link
            href="/try?type=style_personality"
            className="mt-10 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-gray-700 leading-relaxed text-base">{t("seoIntro")}</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-semibold mb-6">{t("faqTitle")}</h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details key={i} className="group border-b border-gray-200 pb-4">
              <summary className="cursor-pointer font-medium text-gray-900 group-open:text-rose-600 transition-colors">
                {faq.q}
              </summary>
              <p className="mt-3 text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

const PERSONALITIES = [
  { name: "Romantic", image: "/images/dim_style_romantic.webp", essence: "Soft, feminine, curves" },
  { name: "Dramatic", image: "/images/dim_style_dramatic.webp", essence: "Bold, angular, striking" },
  { name: "Classic", image: "/images/dim_style_classic.webp", essence: "Timeless, balanced, refined" },
  { name: "Natural", image: "/images/dim_style_natural.webp", essence: "Relaxed, earthy, effortless" },
  { name: "Gamine", image: "/images/dim_style_gamine.webp", essence: "Playful, youthful, petite" },
  { name: "Ethereal", image: "/images/dim_style_ethereal.webp", essence: "Delicate, luminous, airy" },
  { name: "Creative", image: "/images/dim_style_creative.webp", essence: "Eclectic, artistic, bold" },
  { name: "Sensual", image: "/images/dim_style_sensual.webp", essence: "Confident, magnetic, chic" },
];

const INCLUDES = ["inc1", "inc2", "inc3", "inc4", "inc5", "inc6"];
