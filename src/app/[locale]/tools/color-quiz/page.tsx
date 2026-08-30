import { buildAlternates, buildBreadcrumbJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import { ColorQuizClient } from "./ColorQuizClient";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.colorQuizTitle,
    description: messages.meta.colorQuizDescription,
    alternates: buildAlternates(locale, "/tools/color-quiz"),
  };
}

export default async function ColorQuizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "colorQuiz" });

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
    { name: "Color Quiz", path: "/tools/color-quiz" },
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

      <ColorQuizClient />

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
            href="/color-analysis"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">AI Color Analysis</span>
            <span className="block text-sm text-gray-500 mt-1">
              Upload a photo for AI-powered 12-season analysis
            </span>
          </Link>
          <Link
            href="/personal-color-analysis"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">Personal Color Analysis</span>
            <span className="block text-sm text-gray-500 mt-1">
              Learn about the 12 seasonal color types
            </span>
          </Link>
          <Link
            href="/color-palette/light-spring"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">Spring Palettes</span>
            <span className="block text-sm text-gray-500 mt-1">
              Explore Light, True & Bright Spring colors
            </span>
          </Link>
          <Link
            href="/color-palette/cool-summer"
            className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium text-gray-900">Summer Palettes</span>
            <span className="block text-sm text-gray-500 mt-1">
              Explore Cool, True & Soft Summer colors
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
