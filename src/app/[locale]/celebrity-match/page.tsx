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
  const alternates = buildAlternates(locale, "/celebrity-match");
  return {
    title: messages.meta.celebrityTitle,
    description: messages.meta.celebrityDescription,
    alternates,
    openGraph: {
      title: messages.meta.celebrityTitle,
      description: messages.meta.celebrityDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.celebrityTitle,
      description: messages.meta.celebrityDescription,
    },
  };
}

export default async function CelebrityMatchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "celebrityPage" });
  const ft = await getTranslations({ locale, namespace: "features" });

  const faqs = [
    {
      q: "What is celebrity color matching?",
      a: "Celebrity color matching uses AI to find celebrities who share your skin tone, undertone, and coloring profile. By comparing your facial features and color characteristics to a database of celebrities, Belle identifies your 'color twin' — stars whose makeup, hair, and fashion choices can inspire your own style.",
    },
    {
      q: "How does the celebrity match feature work?",
      a: "Upload a selfie and our AI analyzes your skin undertone, depth, contrast, and facial coloring. These traits are matched against celebrities with similar color profiles to find your closest matches, along with styling lessons you can learn from their red carpet and everyday looks.",
    },
    {
      q: "What can I learn from my celebrity match?",
      a: "Your report shows your top celebrity matches, explains why you share similar coloring, and highlights specific beauty and fashion choices those celebrities make — from lipstick shades and hair colors to outfit palettes. It's a fun, practical way to discover colors and styles that work for your exact coloring.",
    },
    {
      q: "Why match with celebrities instead of just getting color analysis?",
      a: "Celebrity matching makes color theory tangible and inspiring. Seeing a famous face with your same undertone wearing certain shades helps you visualize what works on you. Plus, you get steal-the-look tips and beauty DNA insights that translate celebrity styling into actionable advice for your everyday wardrobe.",
    },
    {
      q: "Is celebrity match analysis free?",
      a: "Yes, your first AI celebrity match is completely free. Upload a selfie to discover your celebrity color twins and get personalized styling inspiration based on stars who share your coloring.",
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
    { name: "Celebrity Match", path: "/celebrity-match" },
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
            href="/try?type=celebrity_match"
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
              href="/try?type=celebrity_match"
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
  { image: "/images/dim_celeb_matches.webp", feat: 1 },
  { image: "/images/dim_celeb_lessons.webp", feat: 3 },
  { image: "/images/dim_celeb_steal.webp", feat: 4 },
  { image: "/images/dim_celeb_dna.webp", feat: 5 },
];
