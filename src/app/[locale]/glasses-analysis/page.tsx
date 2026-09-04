import { getTranslations, setRequestLocale } from "next-intl/server";
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
  const alternates = buildAlternates(locale, "/glasses-analysis");
  return {
    title: messages.meta.glassesTitle,
    description: messages.meta.glassesDescription,
    alternates,
    openGraph: {
      title: messages.meta.glassesTitle,
      description: messages.meta.glassesDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.glassesTitle,
      description: messages.meta.glassesDescription,
    },
  };
}

export default async function GlassesAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "glassesPage" });
  const ft = await getTranslations({ locale, namespace: "features" });

  const faqs = [
    {
      q: "How does AI glasses recommendation work?",
      a: "Our AI analyzes your face shape, proportions, and skin tone from a selfie. It then matches these features against frame-shape compatibility rules used by opticians — recommending frames that balance and complement your facial features.",
    },
    {
      q: "What face shapes suit which glasses?",
      a: "Round faces look great with angular frames. Square faces suit rounded or oval frames. Oval faces can wear almost any style. Heart-shaped faces benefit from bottom-heavy frames. Our analysis gives personalized recommendations beyond these general rules.",
    },
    {
      q: "Can I get sunglasses recommendations too?",
      a: "Yes! Our analysis covers both prescription glasses and sunglasses, recommending frame shapes, colors, and styles that work for each.",
    },
    {
      q: "Is the glasses analysis free?",
      a: "Your first glasses analysis is completely free — no signup required. Upload a selfie and get frame recommendations in 60 seconds.",
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
    { name: "Glasses Analysis", path: "/glasses-analysis" },
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
            href="/try?type=glasses_match"
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
            href="/try?type=glasses_match"
            className="mt-10 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">FAQ</h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details key={i} className="group border-b border-gray-200 pb-4">
              <summary className="cursor-pointer font-medium text-gray-900 transition-colors group-open:text-rose-600">
                {faq.q}
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-bold">Related Tools</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/face-shape-analysis"
            className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <span className="font-medium text-gray-900">Face Shape Analysis</span>
            <span className="mt-1 block text-sm text-gray-500">
              Know your face shape first
            </span>
          </Link>
          <Link
            href="/tools/face-shape-quiz"
            className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <span className="font-medium text-gray-900">Face Shape Quiz</span>
            <span className="mt-1 block text-sm text-gray-500">
              Quick face shape test
            </span>
          </Link>
          <Link
            href="/personal-color-analysis"
            className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <span className="font-medium text-gray-900">Color Analysis</span>
            <span className="mt-1 block text-sm text-gray-500">
              Find your best colors for frame color
            </span>
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
  { image: "/images/dim_glasses_frames.webp", feat: 1 },
  { image: "/images/dim_glasses_face.webp", feat: 2 },
  { image: "/images/dim_glasses_sun.webp", feat: 3 },
  { image: "/images/dim_glasses_avoid.webp", feat: 6 },
];
