import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  canonicalUrl,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";

const PATH = "/ai-color-analysis-accuracy";
const CONTACT_EMAIL = "support@aicoloranalysis.io";

/**
 * 这一页描述的是 Belle AI「截至此日」的做法。改了分析方式、换了模型供应商，或页面内容有变动，
 * 都要同步更新这个日期（页面上显示的「最后更新」和结构化数据里的 dateModified 都读它）。
 */
const LAST_UPDATED = "2026-10-23";

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "accuracy" });
  const alternates = buildAlternates(locale, PATH);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "article",
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-0.5 text-primary" aria-hidden="true">
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AccuracyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "accuracy" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const footer = await getTranslations({ locale, namespace: "footer" });
  const format = await getFormatter({ locale });

  const glance = range(5).map((n) => t(`glance${n}` as "glance1"));
  const how = range(4).map((n) => t(`how${n}` as "how1"));
  const factors = range(5).map((n) => t(`factor${n}` as "factor1"));
  const limits = range(5).map((n) => t(`limit${n}` as "limit1"));
  const human = range(4).map((n) => t(`human${n}` as "human1"));
  const tips = range(4).map((n) => t(`tip${n}` as "tip1"));
  const faqs = range(4).map((n) => ({
    q: t(`faq${n}Q` as "faq1Q"),
    a: t(`faq${n}A` as "faq1A"),
  }));

  const updatedText = format.dateTime(new Date(LAST_UPDATED), { dateStyle: "long", timeZone: "UTC" });
  const url = canonicalUrl(locale, PATH);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t("title"),
    description: t("metaDescription"),
    datePublished: LAST_UPDATED,
    dateModified: LAST_UPDATED,
    inLanguage: locale,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Belle AI", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Belle AI",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-full.webp` },
    },
  };
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

  const links = [
    { href: "/try", label: nav("tryNow") },
    { href: "/tools/color-quiz", label: nav("colorQuiz") },
    { href: "/tools/undertone-test", label: nav("undertoneTest") },
    { href: "/color-palette", label: footer("colorPalettes") },
    { href: "/privacy", label: footer("privacy") },
    { href: "/press", label: footer("press") },
  ];

  const h2 = "text-xl font-semibold";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <article className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("updatedLabel")}: <time dateTime={LAST_UPDATED}>{updatedText}</time>
          </p>

          <section className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h2 className="text-lg font-semibold">{t("shortTitle")}</h2>
            <p className="mt-2 leading-relaxed">{t("shortText")}</p>
          </section>

          <section className="mt-10">
            <h2 className={h2}>{t("glanceTitle")}</h2>
            <BulletList items={glance} />
          </section>

          <section className="mt-12">
            <h2 className={h2}>{t("howTitle")}</h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {how.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("howNote")}</p>
          </section>

          <section className="mt-12">
            <h2 className={h2}>{t("whyNoNumberTitle")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("whyNoNumber1")}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("whyNoNumber2")}</p>
          </section>

          <section className="mt-12">
            <h2 className={h2}>{t("factorsTitle")}</h2>
            <BulletList items={factors} />
          </section>

          <section className="mt-12">
            <h2 className={h2}>{t("limitsTitle")}</h2>
            <BulletList items={limits} />
          </section>

          <section className="mt-12">
            <h2 className={h2}>{t("humanTitle")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("humanIntro")}</p>
            <BulletList items={human} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("humanTip")}</p>
          </section>

          <section className="mt-12">
            <h2 className={h2}>{t("tipsTitle")}</h2>
            <BulletList items={tips} />
          </section>

          <section className="mt-12">
            <h2 className={h2}>{t("claimsTitle")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("claim1")}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("claim2")}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("claim3")}</p>
          </section>

          <section className="mt-12">
            <h2 className={h2}>{t("faqTitle")}</h2>
            <div className="mt-6 space-y-6">
              {faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="font-semibold">{f.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-lg font-semibold">{t("relatedTitle")}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </>
  );
}
