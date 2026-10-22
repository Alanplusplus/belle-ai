import { hasLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import Image from "next/image";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import { PARENT_SEASON_ORDER, getSeasonsByParent } from "@/lib/color-palette-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // 带点号的未知路径（/foo.txt）会落到这里，先校验才能返回 404 而不是 500
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const meta = messages.meta;

  return {
    title: `${meta.homeTitle} | ${meta.siteName}`,
    description: meta.homeDescription,
    alternates: buildAlternates(locale, ""),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // 必须在页面里设置：layout 与 page 并行渲染，只靠 layout 的 setRequestLocale 会让
  // 同步组件里的 useTranslations 回退到 headers()，整页被降级成动态渲染。
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("home");
  const ft = useTranslations("features");
  const cg = useTranslations("colorGuide");
  const sd = useTranslations("sd");

  const allSeasons = PARENT_SEASON_ORDER.flatMap((parent) => getSeasonsByParent(parent));
  // 首页正文向下链接的站内页面：专题页（color analysis）、落地页（personal color analysis）、测验、免费在线分析指南
  const inlineLink = (href: string) =>
    function InlineLink(chunks: React.ReactNode) {
      return (
        <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
          {chunks}
        </Link>
      );
    };

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  // 「怎么用」三步，对应页面里的 How It Works 区块（文案直接复用，保证与页面一致）
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("howTitle"),
    description: t("howSubtitle"),
    step: [1, 2, 3].map((n) => ({
      "@type": "HowToStep",
      position: n,
      name: t(`step${n}Title`),
      text: t(`step${n}Desc`),
    })),
  };

  // 网页应用：免费起步；没有真实评分数据，不写 aggregateRating
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Belle AI",
    url: SITE_URL,
    description: t("heroDescription"),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:py-12 lg:py-18">
          <p className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium tracking-widest uppercase text-primary">
            {t("heroSubtitle")}
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("heroTitle")}
            <br />
            <span className="bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent">
              {t("heroTitleAccent")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("heroDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
            >
              {ft("tryItFree")}
            </Link>
            <Link
              href="/tools/color-quiz"
              className="rounded-full border-2 border-primary/60 bg-background/70 px-8 py-[10px] text-base font-semibold text-foreground transition hover:border-primary hover:bg-primary/10"
            >
              {t("heroSecondaryCta")}
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t("heroNote")}</p>

          {/* Product Stats Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
              <span><span className="font-semibold text-foreground">{t("statsAnalysisTypes")}</span></span>
            </div>
            <span className="text-border">·</span>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>
              <span><span className="font-semibold text-foreground">{t("statsSeasonSystem")}</span></span>
            </div>
            <span className="text-border">·</span>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
              <span><span className="font-semibold text-foreground">{t("statsLanguages")}</span></span>
            </div>
            <span className="text-border">·</span>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              <span><span className="font-semibold text-foreground">{t("statsSpeed")}</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Before / After Results */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold">{t("resultsTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("resultsSubtitle")}</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {BEFORE_AFTER.map((pair) => (
              <div key={pair.type} className="group">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-lg">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={pair.after}
                      alt={`${t(pair.labelKey)} – ${t("resultsAfter")}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 overflow-hidden rounded-xl border-2 border-white shadow-lg" style={{ width: "30%", aspectRatio: "3/4" }}>
                    <Image
                      src={pair.before}
                      alt={t(pair.labelKey)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 30vw, 10vw"
                    />
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {t("resultsAfter")}
                  </div>
                </div>
                <p className="mt-3 text-center text-sm font-medium">{t(pair.labelKey)}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">{t("resultsNote")}</p>
          <div className="mt-6 text-center">
            <Link
              href="/try"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
            >
              {ft("tryItFree")}
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold">{t("howTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("howSubtitle")}</p>
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <StepCard number="1" title={t("step1Title")} desc={t("step1Desc")} />
            <StepCard number="2" title={t("step2Title")} desc={t("step2Desc")} />
            <StepCard number="3" title={t("step3Title")} desc={t("step3Desc")} />
          </div>
        </div>
      </section>

      {/* Photo privacy commitments */}
      <section className="py-6">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-gold/5 px-6 py-6 text-center sm:px-8">
            <h2 className="font-serif text-xl font-bold sm:text-2xl">{t("privacyTitle")}</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {(["privacyItem1", "privacyItem2", "privacyItem3"] as const).map((key) => (
                <li key={key} className="flex items-start justify-center gap-2 text-left sm:text-center">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <Link href="/privacy" className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
              {t("privacyLink")}
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold">{t("featuresTitle")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("featuresSubtitle")}
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <FeatureCard
              image="/images/card_color_analysis.webp"
              icon={<ColorIcon />}
              title={t("colorTitle")}
              description={t("colorDesc")}
              href="/personal-color-analysis"
              cta={ft("learnMore")}
            />
            <FeatureCard
              image="/images/showcase_skin.webp"
              icon={<MakeupIcon />}
              title={t("makeupTitle")}
              description={t("makeupDesc")}
              href="/makeup-analysis"
              cta={ft("learnMore")}
            />
            <FeatureCard
              image="/images/card_face_shape.webp"
              icon={<FaceIcon />}
              title={t("faceTitle")}
              description={t("faceDesc")}
              href="/face-shape-analysis"
              cta={ft("learnMore")}
            />
          </div>
        </div>
      </section>

      {/* Color Analysis Guide Banner */}
      <section className="py-6">
        <div className="mx-auto max-w-6xl px-4">
          <Link
            href="/color-analysis"
            className="group flex items-center justify-between rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-gold/5 px-6 py-5 transition hover:border-primary/40 hover:shadow-md sm:px-8"
          >
            <div>
              <h3 className="font-serif text-lg font-bold group-hover:text-primary sm:text-xl">
                {cg("homeBannerTitle")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {cg("homeBannerDesc")}
              </p>
            </div>
            <span className="ml-4 shrink-0 text-primary transition group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </div>
      </section>

      {/* More Analysis Types */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold">{t("moreTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("moreSubtitle")}</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MORE_FEATURES.map((f) => (
              <Link key={f.href} href={f.href} className="group">
                <div className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={f.image}
                      alt={t(f.titleKey)}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold">{t(f.titleKey)}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{t(f.descKey)}</p>
                    {f.premium && (
                      <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        {t("premiumBadge")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why AI Color Analysis */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl font-bold">{t("whyTitle")}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <WhyCard icon={<WhyFreeIcon />} title={t("whyFree")} text={t("whyFreeDesc")} />
            <WhyCard icon={<WhyAccuracyIcon />} title={t("whyAccurate")} text={t("whyAccurateDesc")} />
            <WhyCard icon={<WhyCostIcon />} title={t("whyCost")} text={t("whyCostDesc")} />
            <WhyCard icon={<WhyPersonalIcon />} title={t("whyPersonal")} text={t("whyPersonalDesc")} />
          </div>
        </div>
      </section>

      {/* AI color analysis 深度内容：它测什么、怎么对应 12 季型；正文内链把权重分给专题页 / 落地页 / 测验 / 季型页 */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-serif text-3xl font-bold">{t("aiDeepTitle")}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center leading-relaxed text-muted-foreground">
            {t.rich("aiDeepIntro", { guide: inlineLink("/color-analysis") })}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AI_DIMENSIONS.map((dim) => (
              <div key={dim.titleKey} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold">{cg(dim.titleKey)}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{cg(dim.descKey)}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-12 text-center font-serif text-2xl font-bold">{t("aiSeasonsTitle")}</h3>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">{t("aiSeasonsDesc")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {allSeasons.map((season) => (
              <Link
                key={season.slug}
                href={`/color-palette/${season.slug}`}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm transition hover:border-primary/40 hover:shadow-sm"
              >
                <span className="flex gap-0.5">
                  {season.bestColors.slice(0, 3).map((c) => (
                    <span key={c.hex} className="h-3.5 w-3.5 rounded-full border border-border/40" style={{ backgroundColor: c.hex }} />
                  ))}
                </span>
                {sd(`${season.slug}.name`)}
              </Link>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
            {t.rich("aiDeepOutro", {
              quiz: inlineLink("/tools/color-quiz"),
              personal: inlineLink("/personal-color-analysis"),
              free: inlineLink("/blog/free-ai-color-analysis-online"),
            })}
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center font-serif text-2xl font-bold sm:text-3xl">
            {t("compareTitle")}
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            {t("compareSubtitle")}
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground sm:px-4" />
                  <th className="px-3 py-3 text-center font-semibold text-primary sm:px-4">Belle AI</th>
                  <th className="px-3 py-3 text-center font-medium sm:px-4">{t("compareStylist")}</th>
                  <th className="px-3 py-3 text-center font-medium sm:px-4">{t("compareQuiz")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <tr key={n}>
                    <td className="px-3 py-3 font-medium sm:px-4">{t(`compareRow${n}Label`)}</td>
                    <td className="px-3 py-3 text-center font-medium text-primary sm:px-4">{t(`compareRow${n}Belle`)}</td>
                    <td className="px-3 py-3 text-center sm:px-4">{t(`compareRow${n}Stylist`)}</td>
                    <td className="px-3 py-3 text-center sm:px-4">{t(`compareRow${n}Quiz`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center font-serif text-3xl font-bold">{t("faqTitle")}</h2>
          <div className="mt-6 divide-y divide-border">
            {faqs.map((faq, i) => (
              <details key={i} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  <span>{faq.q}</span>
                  <span className="ml-4 shrink-0 text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary/5 to-gold/5 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("ctaSubtitle")}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-10 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
            >
              {t("ctaCta")}
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("ctaNote")}
          </p>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  image,
  icon,
  title,
  description,
  href,
  cta,
}: {
  image?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
      {image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <div className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center text-sm font-medium text-primary transition group-hover:underline"
        >
          {cta} &rarr;
        </Link>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold text-xl font-bold text-white shadow-md shadow-primary/20">
        {number}
      </div>
      <h3 className="font-serif text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function WhyCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function WhyFreeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function WhyAccuracyIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WhyCostIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WhyPersonalIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  );
}

function MakeupIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  );
}

function ColorIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}

function FaceIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  );
}

const MORE_FEATURES = [
  { titleKey: "hairTitle", descKey: "hairDesc", href: "/hair-color-analysis" as const, image: "/images/card_hair.webp" },
  { titleKey: "outfitTitle", descKey: "outfitDesc", href: "/outfit-color-analysis" as const, image: "/images/card_outfit.webp" },
  { titleKey: "glassesTitle", descKey: "glassesDesc", href: "/glasses-analysis" as const, image: "/images/card_glasses.webp" },
  { titleKey: "occasionTitle", descKey: "occasionDesc", href: "/occasion-makeup" as const, image: "/images/card_occasion.webp" },
  { titleKey: "jewelryTitle", descKey: "jewelryDesc", href: "/jewelry-analysis" as const, image: "/images/card_jewelry.webp" },
  { titleKey: "glowUpTitle", descKey: "glowUpDesc", href: "/glow-up-report" as const, image: "/images/card_glow_up.webp", premium: true },
  { titleKey: "styleTitle", descKey: "styleDesc", href: "/style-personality" as const, image: "/images/card_style.webp" },
  { titleKey: "celebTitle", descKey: "celebDesc", href: "/celebrity-match" as const, image: "/images/card_celebrity.webp" },
];

// 复用专题页已翻译好的四个维度文案，不需要额外翻译
const AI_DIMENSIONS = [
  { titleKey: "dimUndertoneTitle", descKey: "dimUndertoneDesc" },
  { titleKey: "dimDepthTitle", descKey: "dimDepthDesc" },
  { titleKey: "dimChromaTitle", descKey: "dimChromaDesc" },
  { titleKey: "dimContrastTitle", descKey: "dimContrastDesc" },
] as const;

const BEFORE_AFTER = [
  { before: "/images/showcase/before-color.webp", after: "/images/showcase/after-color.webp", type: "color", labelKey: "resultsColorLabel" },
  { before: "/images/showcase/before-makeup.webp", after: "/images/showcase/after-makeup.webp", type: "makeup", labelKey: "resultsMakeupLabel" },
  { before: "/images/showcase/before-face.webp", after: "/images/showcase/after-face.webp", type: "face", labelKey: "resultsFaceLabel" },
];

