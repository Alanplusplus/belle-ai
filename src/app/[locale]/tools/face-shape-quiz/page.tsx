import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import type { Metadata } from "next";
import { FaceShapeQuizClient } from "./FaceShapeQuizClient";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/tools/face-shape-quiz");
  return {
    title: messages.meta.faceQuizTitle,
    description: messages.meta.faceQuizDescription,
    alternates,
    openGraph: {
      title: messages.meta.faceQuizTitle,
      description: messages.meta.faceQuizDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.faceQuizTitle,
      description: messages.meta.faceQuizDescription,
    },
  };
}

export default async function FaceShapeQuizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faceQuiz" });

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
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
    { name: "Face Shape Quiz", path: "/tools/face-shape-quiz" },
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

      <FaceShapeQuizClient />

      <section className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-gray-700 leading-relaxed text-base">
          {t("seoIntro")}
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-semibold mb-6">FAQ</h2>
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

      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-semibold mb-4">{t("relatedTitle")}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/face-shape-analysis"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">AI Face Shape Analysis</span>
            <span className="block text-sm text-gray-500 mt-1">
              Upload a photo for AI-powered face shape detection
            </span>
          </Link>
          <Link
            href="/glasses-analysis"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">Glasses Analysis</span>
            <span className="block text-sm text-gray-500 mt-1">
              Find the perfect frames for your face shape
            </span>
          </Link>
          <Link
            href="/hair-color-analysis"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">Hair Color Analysis</span>
            <span className="block text-sm text-gray-500 mt-1">
              Discover which hair colors suit your features
            </span>
          </Link>
          <Link
            href="/blog"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">Beauty Blog</span>
            <span className="block text-sm text-gray-500 mt-1">
              Hairstyle guides, face shape tips & more
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
