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
  const alternates = buildAlternates(locale, "/outfit-color-analysis");
  return {
    title: messages.meta.outfitTitle,
    description: messages.meta.outfitDescription,
    alternates,
    openGraph: {
      title: messages.meta.outfitTitle,
      description: messages.meta.outfitDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.outfitTitle,
      description: messages.meta.outfitDescription,
    },
  };
}

export default async function OutfitColorAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "outfitPage" });
  const ft = await getTranslations({ locale, namespace: "features" });

  const faqs = [
    {
      q: "What is outfit color analysis?",
      a: "Outfit color analysis identifies which clothing colors flatter your personal coloring based on your skin undertone and seasonal color type. It helps you build a wardrobe palette of neutrals, accent colors, and combinations that make you look vibrant and polished.",
    },
    {
      q: "How does AI outfit color matching work?",
      a: "Upload a selfie and our AI determines your personal color season and undertone. You then receive a curated outfit color palette with recommended neutrals, statement colors, color combinations to try, and shades to avoid when shopping for clothes.",
    },
    {
      q: "Why do certain clothing colors look better on me?",
      a: "Colors that share undertones with your skin, hair, and eyes create visual harmony and make your complexion appear brighter. Colors with clashing undertones can make skin look dull or sallow. Outfit color analysis identifies your ideal palette so every outfit enhances your natural coloring.",
    },
    {
      q: "Can outfit color analysis help me shop smarter?",
      a: "Absolutely — your report serves as a personal shopping guide. Keep your recommended neutrals and accent colors handy when buying tops, dresses, jackets, and accessories. You'll waste less money on colors that don't suit you and build a cohesive, flattering wardrobe.",
    },
    {
      q: "Is outfit color analysis free?",
      a: "Yes, your first AI outfit color analysis is completely free. Upload a selfie to discover your best clothing colors, seasonal palette, and styling combinations tailored to your personal coloring.",
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
    { name: "Outfit Color Analysis", path: "/outfit-color-analysis" },
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
            href="/try?type=outfit_color"
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
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold">{t("howItWorks")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Step num="1" text={t("step1")} />
            <Step num="2" text={t("step2")} />
            <Step num="3" text={t("step3")} />
          </div>
          <Link
            href="/try?type=outfit_color"
            className="mt-10 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>
    </>
  );
}

function Step({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold">{num}</div>
      <p className="mt-3 text-sm">{text}</p>
    </div>
  );
}

const DIMENSIONS = [
  { image: "/images/dim_outfit_neutrals.webp", feat: 2 },
  { image: "/images/dim_outfit_avoid.webp", feat: 3 },
  { image: "/images/dim_outfit_season.webp", feat: 4 },
  { image: "/images/dim_outfit_palette.webp", feat: 5 },
];
