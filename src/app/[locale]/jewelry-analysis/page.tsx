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
  const alternates = buildAlternates(locale, "/jewelry-analysis");
  return {
    title: messages.meta.jewelryTitle,
    description: messages.meta.jewelryDescription,
    alternates,
    openGraph: {
      title: messages.meta.jewelryTitle,
      description: messages.meta.jewelryDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.jewelryTitle,
      description: messages.meta.jewelryDescription,
    },
  };
}

export default async function JewelryAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "jewelryPage" });
  const ft = await getTranslations({ locale, namespace: "features" });

  const faqs = [
    {
      q: "What is AI jewelry analysis?",
      a: "AI jewelry analysis determines which metals, gemstones, and jewelry styles complement your skin undertone and coloring. It helps you choose between gold, silver, rose gold, and mixed metals, plus recommends earring shapes, necklace lengths, and gemstone colors that enhance your natural glow.",
    },
    {
      q: "Should I wear gold or silver jewelry?",
      a: "The best metal depends on your skin undertone. Warm undertones typically look best in yellow gold and rose gold, while cool undertones shine in silver and white gold. Our AI analyzes your skin from a selfie and tells you which metals flatter you most — many people can wear both.",
    },
    {
      q: "What jewelry recommendations will I receive?",
      a: "Your report covers optimal metal tones (gold, silver, rose gold), earring styles and shapes, necklace lengths, gemstone color suggestions, and specific pieces to seek out or avoid. Recommendations are tailored to your undertone and contrast level.",
    },
    {
      q: "How accurate is AI jewelry matching?",
      a: "Our AI uses the same undertone and contrast analysis used in professional color consultations. By measuring your skin's warm/cool balance from a clear selfie, it provides metal and gemstone recommendations comparable to an in-person styling session.",
    },
    {
      q: "Is jewelry analysis free?",
      a: "Yes, your first AI jewelry analysis is completely free. Upload a selfie to discover your best metals, gemstone colors, and jewelry styles with no signup required.",
    },
  ];

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
    { name: "Jewelry Analysis", path: "/jewelry-analysis" },
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
            href="/try?type=jewelry_guide"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold">{t("whatYouGet")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map((dim) => (
              <div key={dim.image} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={dim.image}
                    alt={t(`feat${dim.feat}Title`)}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium">{t(`feat${dim.feat}Title`)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(`feat${dim.feat}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/try?type=jewelry_guide"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const DIMENSIONS = [
  { image: "/images/dim_jewelry_metals.webp", feat: 1 },
  { image: "/images/dim_jewelry_earrings.webp", feat: 2 },
  { image: "/images/dim_jewelry_necklace.webp", feat: 3 },
  { image: "/images/dim_jewelry_gems.webp", feat: 4 },
];
