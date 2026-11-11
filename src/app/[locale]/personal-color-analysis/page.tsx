import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeatureHero } from "@/components/FeatureHero";
import { FunnelLink } from "@/components/FunnelLink";
import { sampleHref } from "@/lib/blogTools";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import Image from "next/image";
import { LocalPrice } from "@/components/LocalPrice";
import { KIT_PERK_VALUES } from "@/lib/kit";
import { KIT_RETEST_DAYS } from "@/lib/constants";
import type { Metadata } from "next";
import {
  PARENT_SEASON_ORDER,
  getSeasonsByParent,
} from "@/lib/color-palette-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/personal-color-analysis");
  return {
    title: messages.meta.colorTitle,
    description: messages.meta.colorDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.colorTitle,
      description: messages.meta.colorDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.colorTitle,
      description: messages.meta.colorDescription,
    },
  };
}

export default async function PersonalColorAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "color" });
  const ft = await getTranslations({ locale, namespace: "features" });
  const tp = await getTranslations({ locale, namespace: "tryPage" });
  const cg = await getTranslations({ locale, namespace: "colorGuide" });
  // 文末相关文章：标题取各语种的 blogTitles，小标题复用已翻译的 seasonPalette.relatedArticles
  const bt = await getTranslations({ locale, namespace: "blogTitles" });
  const rt = await getTranslations({ locale, namespace: "seasonPalette" });
  const sd = await getTranslations({ locale, namespace: "sd" });
  const cp = await getTranslations({ locale, namespace: "colorPage" });
  const kt = await getTranslations({ locale, namespace: "kit" });

  const faqCount = 5;
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
    { name: "Personal Color Analysis", path: "/personal-color-analysis" },
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
        image="/images/examples/report_color_analysis.webp"
        sampleLabel={tp("demoBadge")}
        actions={
          <>
            <Link
              href="/try?type=color_analysis"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
            <FunnelLink
              href={sampleHref("color_analysis")}
              from="feature"
              tool="color_analysis"
              kind="sample"
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              {tp("trySample")}
            </FunnelLink>
          </>
        }
      />

      {/* 报告里有什么：真实报告截图 + 逐页说明 */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold">{cp("insideTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{cp("insideSub")}</p>
          <div className="mt-12 space-y-14 sm:space-y-16">
            {REPORT_ROWS.map((row, i) => (
              <div key={row.key} className="grid items-center gap-6 md:grid-cols-2 md:gap-14">
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/5">
                    <Image
                      src={row.image}
                      alt={cp(`${row.key}t`)}
                      width={row.width}
                      height={row.height}
                      sizes="340px"
                      className="h-auto w-full"
                    />
                  </div>
                </div>
                <div className="mx-auto max-w-md md:mx-0">
                  <span className="font-serif text-4xl text-primary/30">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1 text-xl font-bold sm:text-2xl">{cp(`${row.key}t`)}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{cp(`${row.key}d`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 套装：价格 + 包含项 */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-xl shadow-primary/5 sm:p-10">
            <h2 className="text-2xl font-bold sm:text-3xl">{cp("kitTitle")}</h2>
            <p className="mt-4 text-5xl font-bold text-primary">
              <LocalPrice spec="kit" />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{kt("billingNote")}</p>
            <ul className="mx-auto mt-8 max-w-xl space-y-3 text-left">
              {KIT_PAGE_PERKS.map((key) => (
                <li key={key} className="flex items-start gap-3 text-sm sm:text-base">
                  <span aria-hidden="true" className="mt-0.5 text-primary">✓</span>
                  <span>{kt(key, KIT_PERK_VALUES)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/try?type=color_analysis"
                className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
              >
                {ft("tryItFree")}
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
              >
                {cp("kitSeePricing")}
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{cp("kitFreeFirst")}</p>
          </div>
        </div>
      </section>

      {/* 信服力：为什么可以相信结果 */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-bold">{cp("trustTitle")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold">{cp(`t${n}t`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {cp(`t${n}d`, { days: KIT_RETEST_DAYS })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12 季型：同一风格的 12 张季型图，按四个季节分组，点进完整色板页 */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-3 text-center text-2xl font-bold">{t("seasonsTitle")}</h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">{cp("seasonsSub")}</p>
          {PARENT_SEASON_ORDER.map((parent) => (
            <div key={parent} className="mt-10 first:mt-0">
              <div className="mb-4 flex items-center gap-3">
                <h3 className="text-lg font-semibold">
                  <Link href={`/color-palette/${parent}`} className="hover:text-primary">
                    {cg(`${parent}Name`)}
                  </Link>
                </h3>
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {getSeasonsByParent(parent).map((season) => (
                  <Link
                    key={season.slug}
                    href={`/color-palette/${season.slug}`}
                    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="relative aspect-[3/2] w-full overflow-hidden bg-white">
                      <Image
                        src={`/images/report/plate-${season.slug}.webp`}
                        alt={sd(`${season.slug}.name`)}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-semibold">{sd(`${season.slug}.name`)}</span>
                      <span className="text-xs text-muted-foreground transition group-hover:text-primary">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-12 text-center">
            <Link
              href="/try?type=color_analysis"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">{t("faqTitle")}</h2>
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

      {/* 落地页 → 专题页：「color analysis」这个词由 /color-analysis 承接，这里用描述性锚文本把权重导过去 */}
      <section className="mx-auto max-w-4xl px-4 pb-10">
        <Link
          href="/color-analysis"
          className="group flex items-center justify-between rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-gold/5 px-6 py-5 transition hover:border-primary/40 hover:shadow-md sm:px-8"
        >
          <div>
            <h2 className="font-serif text-lg font-bold group-hover:text-primary sm:text-xl">
              {cg("homeBannerTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{cg("homeBannerDesc")}</p>
          </div>
          <span className="ml-4 shrink-0 text-primary transition group-hover:translate-x-1">&rarr;</span>
        </Link>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">{rt("relatedArticles")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {RELATED_POST_SLUGS.map((slug) => (
            <Link
              key={slug}
              href={`/blog/${slug}`}
              className="block p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all"
            >
              <span className="font-medium text-gray-900">{bt(slug)}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

const RELATED_POST_SLUGS = [
  "best-colors-for-warm-undertones",
  "cool-tone-vs-warm-tone",
  "best-makeup-colors-color-season",
] as const;

// 真实报告里每一页的截图（见 public/images/examples/color_*.webp），key 对应 messages.colorPage.r<N>t / r<N>d
const REPORT_ROWS = [
  { key: "r1", image: "/images/examples/color_season.webp", width: 800, height: 1066 },
  { key: "r2", image: "/images/examples/color_why.webp", width: 800, height: 1066 },
  { key: "r3", image: "/images/examples/color_palette.webp", width: 800, height: 1066 },
  { key: "r4", image: "/images/examples/color_avoid.webp", width: 800, height: 1314 },
  { key: "r5", image: "/images/examples/color_makeup.webp", width: 800, height: 1066 },
  { key: "r6", image: "/images/examples/color_hair.webp", width: 800, height: 1070 },
  { key: "r7", image: "/images/examples/color_lookbook.webp", width: 800, height: 999 },
] as const;

// 套装卡片只列前六条（第 7 条是买前扫一扫，与色彩报告无关）
const KIT_PAGE_PERKS = ["perk1", "perk2", "perk3", "perk4", "perk5", "perk6"] as const;
