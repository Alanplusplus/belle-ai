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

  const faqs = [
    {
      q: "What is style personality analysis?",
      a: "Style personality analysis identifies your personal style archetype — such as Romantic, Dramatic, Classic, Natural, Gamine, Ethereal, Creative, or Sensual — based on your facial features, body lines, and overall aesthetic. It helps you understand which fashion styles naturally suit your appearance and energy.",
    },
    {
      q: "How does AI determine my style personality?",
      a: "Our AI analyzes your facial structure, feature proportions, and overall visual impression from a selfie. These characteristics are mapped to established style archetypes to reveal which fashion aesthetics — from soft and feminine to bold and angular — align with your natural look.",
    },
    {
      q: "What style archetypes does Belle recognize?",
      a: "Belle identifies eight style personalities: Romantic (soft, feminine), Dramatic (bold, striking), Classic (timeless, refined), Natural (relaxed, effortless), Gamine (playful, youthful), Ethereal (delicate, luminous), Creative (eclectic, artistic), and Sensual (confident, magnetic). You may have a primary type with secondary influences.",
    },
    {
      q: "How can style personality help me dress better?",
      a: "Knowing your style personality guides clothing silhouettes, fabric choices, patterns, and accessories that feel authentic to you. Instead of following trends blindly, you build a wardrobe aligned with your natural aesthetic — making shopping decisions easier and your outfits more cohesive.",
    },
    {
      q: "Is style personality analysis free?",
      a: "Yes, your first AI style personality analysis is free with no signup required. Upload a selfie to discover your style archetype and receive personalized fashion recommendations.",
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
