import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { LOCALE_NAMES } from "@/lib/constants";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { EMBED_QUIZZES, EMBED_QUIZ_NAV_KEY, EMBED_FRAME_HEIGHT, type EmbedQuiz } from "@/lib/embed";
import { ToolFaq, ToolRelated } from "@/components/ToolPageSections";
import { EmbedGenerator } from "./EmbedGenerator";

const PATH = "/tools/embed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "embedPage" });
  const alternates = buildAlternates(locale, PATH);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "embedPage" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const footer = await getTranslations({ locale, namespace: "footer" });
  const quiz = await getTranslations({ locale, namespace: "quiz" });

  // 生成器需要每个语种的测验名（iframe 的 title）和署名句；都在服务端取好再传给客户端组件
  const titles: Record<string, Record<EmbedQuiz, string>> = {};
  const credits: Record<string, string> = {};
  for (const l of routing.locales) {
    const navL = await getTranslations({ locale: l, namespace: "nav" });
    const embedL = await getTranslations({ locale: l, namespace: "embed" });
    titles[l] = Object.fromEntries(
      EMBED_QUIZZES.map((q) => [q, navL(EMBED_QUIZ_NAV_KEY[q])]),
    ) as Record<EmbedQuiz, string>;
    credits[l] = embedL.raw("credit") as string;
  }
  const quizNames = titles[locale];

  const faqs = [1, 2, 3].map((n) => ({
    q: t(`faq${n}Q` as "faq1Q"),
    a: t(`faq${n}A` as "faq1A"),
  }));
  const terms = [1, 2, 3, 4].map((n) => t(`term${n}` as "term1"));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [{ name: t("breadcrumb"), path: PATH }]);

  const related = [
    { href: "/tools/color-quiz", label: nav("colorQuiz") },
    { href: "/tools/undertone-test", label: nav("undertoneTest") },
    { href: "/tools/face-shape-quiz", label: nav("faceQuiz") },
    { href: "/color-palette", label: footer("colorPalettes") },
    { href: "/ai-color-analysis-accuracy", label: footer("aiAccuracy") },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{t("title")}</h1>
          <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">{t("intro")}</p>

          <div className="mt-10">
            <h2 className="mb-4 text-xl font-semibold">{t("builderTitle")}</h2>
            <EmbedGenerator
              quizNames={quizNames}
              titles={titles}
              credits={credits}
              languages={routing.locales.map((l) => ({ code: l, label: LOCALE_NAMES[l] ?? l }))}
              initialLocale={locale}
              labels={{
                quiz: t("quizLabel"),
                language: t("languageLabel"),
                preview: t("previewTitle"),
                code: t("codeTitle"),
                codeAria: t("codeAria"),
                copy: t("copy"),
                copied: t("copied"),
                sizeNote: t("sizeNote", { height: EMBED_FRAME_HEIGHT }),
              }}
            />
          </div>

          <div className="mt-14 max-w-3xl">
            <h2 className="text-xl font-semibold">{t("termsTitle")}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {terms.map((term) => (
                <li key={term} className="flex gap-3">
                  <span className="mt-0.5 text-primary" aria-hidden="true">
                    ✓
                  </span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ToolFaq title={quiz("faqTitle")} faqs={faqs} />
      <ToolRelated title={t("relatedTitle")} links={related} />
    </>
  );
}
