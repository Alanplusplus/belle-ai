import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeatureHero } from "@/components/FeatureHero";
import { FunnelLink } from "@/components/FunnelLink";
import { sampleHref } from "@/lib/blogTools";
import { FeatureIncludes } from "@/components/FeatureIncludes";
import { QuickAnswerSection } from "@/components/QuickAnswer";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
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
      images: OG_IMAGES,
      title: messages.meta.glassesTitle,
      description: messages.meta.glassesDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
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
  const tp = await getTranslations({ locale, namespace: "tryPage" });
  const nt = await getTranslations({ locale, namespace: "nav" });

  const faqCount = 4;
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
      <FeatureHero
        title={t("title")}
        subtitle={t("subtitle")}
        description={t("description")}
        image="/images/examples/report_glasses_match.webp"
        sampleLabel={tp("demoBadge")}
        actions={
          <>
            <Link
              href="/try?type=glasses_match"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
            <FunnelLink
              href={sampleHref("glasses_match")}
              from="feature"
              tool="glasses_match"
              kind="sample"
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              {tp("trySample")}
            </FunnelLink>
          </>
        }
      />

      {/* 一句话答案 + 关键事实：开头就能被整段摘取（这个页面本来就被 ChatGPT 引用） */}
      <QuickAnswerSection locale={locale} lead={t("answerLead")} variant="tool" />

      <FeatureIncludes locale={locale} tool="glasses" />

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
        <h2 className="mb-6 text-2xl font-semibold">{t("faqTitle")}</h2>
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
        <h2 className="mb-6 text-2xl font-bold">{ft("relatedTools")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/face-shape-analysis"
            className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <span className="font-medium text-gray-900">{nt("faceAnalysis")}</span>
            <span className="mt-1 block text-sm text-gray-500">
              {ft("relFaceShapeForGlasses")}
            </span>
          </Link>
          <Link
            href="/tools/face-shape-quiz"
            className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <span className="font-medium text-gray-900">{nt("faceQuiz")}</span>
            <span className="mt-1 block text-sm text-gray-500">
              {ft("relQuizForGlasses")}
            </span>
          </Link>
          <Link
            href="/personal-color-analysis"
            className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <span className="font-medium text-gray-900">{nt("colorAnalysis")}</span>
            <span className="mt-1 block text-sm text-gray-500">
              {ft("relColorForGlasses")}
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

