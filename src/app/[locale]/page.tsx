import { hasLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import Image from "next/image";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import { SINGLE_UNLOCK_ENABLED, SITE_URL } from "@/lib/constants";
import { PARENT_SEASON_ORDER, getSeasonsByParent } from "@/lib/color-palette-data";
import { PaletteCardImage } from "@/components/PaletteCardImage";
import { VideoCard } from "@/components/VideoEmbed";
import { getPublishedVideos } from "@/lib/videos";
import { FunnelLink } from "@/components/FunnelLink";
import { sampleHref } from "@/lib/blogTools";
import { PricedFill } from "@/components/PricedFill";

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
  const ph = useTranslations("paletteHub");
  const vt = useTranslations("video");
  const tp = useTranslations("tryPage");
  const cp = useTranslations("colorPage");
  const videos = getPublishedVideos();
  // 首屏的「免费范围 + 价格」一行：只有打开了单份报告入口、且这个语言写了 heroPriceNote 才显示（价格按访客币种渲染）
  const showHeroPrice = SINGLE_UNLOCK_ENABLED && t.has("heroPriceNote");

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

      {/* Hero：左边文案和按钮，右边是「自拍 → 季型 → 色板卡片」的成品预览；手机上文案在前、预览在后，按钮仍在首屏 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-gold/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-6 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-28 bottom-0 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6 lg:py-16">
          <div className="text-center lg:text-left">
            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl xl:text-[3.4rem] xl:leading-[1.1]">
              {t("heroTitle")}
              <br />
              <span className="bg-gradient-to-r from-primary-dark via-primary to-gold-deep bg-clip-text text-transparent">
                {t("heroTitleAccent")}
              </span>
            </h1>
            {/* 一句话说清「传什么 → 得到什么 → 多久」；原来的三句描述和下面的 heroNote 在重复「免费 / 无需注册」。
                直接复用 /try 页的价值主张，两处说法一致（结构化数据里的 description 仍用完整的 heroDescription） */}
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
              {tp("valueProp")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/try"
                className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
              >
                {ft("tryItFree")}
              </Link>
              {/* 次按钮不再是「免费测验」（会把人带去另一条路），而是「先看示例」：落地 /try 就是完整示例结果 */}
              <FunnelLink
                href={sampleHref("color_analysis")}
                from="home_hero"
                tool="color_analysis"
                kind="sample"
                className="rounded-full border-2 border-primary/70 bg-white/70 px-8 py-[10px] text-base font-semibold text-primary-dark transition hover:border-primary hover:bg-primary/10"
              >
                {tp("trySample")}
              </FunnelLink>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t("heroNote")}</p>
            {showHeroPrice && (
              <p className="mt-1.5 text-sm font-medium text-foreground/80">
                <PricedFill template={t.raw("heroPriceNote") as string} prices={{ price: "single" }} />
              </p>
            )}
          </div>

          <HeroPreview
            cardAlt={ph("cardAltParent", { season: cg("autumnName") })}
            selfieAlt={t("resultsColorLabel")}
            seasonName={sd("soft-autumn.name")}
          />
        </div>
      </section>

      {/* 成品长什么样：真实报告里的四页（和 personal-color-analysis 页是同一批截图），让人在首屏之后马上看到「这就是我会拿到的」 */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title={cp("insideTitle")} />
          {/* 原来的一整句说明只为表达「这是示例」，换成一个小标签 */}
          <p className="mt-4 text-center">
            <span className="inline-block rounded-full border border-primary/20 bg-card px-3.5 py-1 text-xs font-semibold text-primary shadow-sm">
              {tp("demoBadge")}
            </span>
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {HOME_REPORT_PAGES.map((page) => (
              <FunnelLink
                key={page.key}
                href={sampleHref("color_analysis")}
                from="home_report"
                tool="color_analysis"
                kind="sample"
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card shadow-md shadow-black/5 transition group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/15">
                  <Image
                    src={page.image}
                    alt={cp(`${page.key}t`)}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <p className="mt-3 text-center text-sm font-semibold leading-snug">{cp(`${page.key}t`)}</p>
              </FunnelLink>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/try?type=color_analysis"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
            >
              {ft("tryItFree")}
            </Link>
            <FunnelLink
              href={sampleHref("color_analysis")}
              from="home_report"
              tool="color_analysis"
              kind="sample"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {tp("trySample")}
            </FunnelLink>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-primary/[0.05] py-12">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title={t("howTitle")} />
          {/* 手机上是一条带连接线的三步横排，只留标题：三段描述里第 2、3 步只是把标题再说一遍，第 1 步的「素颜 / 自然光」提示在 /try 上传框里已有。
              桌面端宽度够，描述保留（HowTo 结构化数据里的 step 文案不受影响） */}
          <ol className="mt-8 grid grid-cols-3">
            <StepCard number="1" title={t("step1Title")} desc={t("step1Desc")} first />
            <StepCard number="2" title={t("step2Title")} desc={t("step2Desc")} />
            <StepCard number="3" title={t("step3Title")} desc={t("step3Desc")} last />
          </ol>
        </div>
      </section>

      {/* Photo privacy commitments */}
      <section className="bg-primary/[0.05] pb-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-primary/20 bg-white/80 px-4 py-5 text-center shadow-sm sm:px-8 sm:py-6">
            <h2 className="font-serif text-xl font-bold sm:text-2xl">{t("privacyTitle")}</h2>
            {/* 三条承诺都是短句：手机上居中成一组、左对齐、每条一行（原来三列在手机上被挤成多行）；桌面一行排开 */}
            <ul className="mx-auto mt-4 flex w-fit max-w-full flex-col gap-2.5 text-left text-[13px] text-muted-foreground sm:w-auto sm:text-sm sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-2">
              {(["privacyItem1", "privacyItem2", "privacyItem3"] as const).map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
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

      {/* Learn in video：只在有已发布的 YouTube 视频时出现，放在 How It Works 之后，首屏不动 */}
      {videos.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading title={vt("homeTitle")} />
            <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-2">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} page="home" sizes="(max-width: 640px) 100vw, 400px" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 全部分析类型：一个统一的网格，只留图 + 标题，手机两列。
          以前分成「Complete Color Analysis Suite（3 个）」和「Explore All（另外 8 个）」两块：按定价页的分法，
          妆容 / 脸型和发色、穿搭、眼镜等是同一档（都用积分），拆开不准确，两个标题还互相矛盾，页面也更长。
          每张卡片的说明已去掉（妆容那句还写着现在的报告里没有的「contour」） */}
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title={t("moreTitle")} />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {ANALYSIS_TYPES.map((f) => (
              <Link key={f.href} href={f.href} className="group block h-full">
                <div className="h-full overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={f.image}
                      alt={t(f.titleKey)}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">{t(f.titleKey)}</h3>
                  </div>
                </div>
              </Link>
            ))}
            {/* 第 12 格：色彩分析指南入口。11 张卡片在两列 / 四列下都会留空位，补上这一格正好排满（手机 6 行、桌面 3 行） */}
            <Link
              href="/color-analysis"
              className="group flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-gold/10 p-4 text-center transition hover:border-primary/40 hover:shadow-lg"
            >
              <h3 className="font-serif text-base font-bold group-hover:text-primary sm:text-lg">
                {cg("homeBannerTitle")}
              </h3>
              <span aria-hidden="true" className="text-primary transition group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* AI color analysis 深度内容：它测什么、怎么对应 12 季型；正文内链把权重分给专题页 / 落地页 / 测验 / 季型页 */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <SectionHeading title={t("aiDeepTitle")} />
          <p className="mx-auto mt-5 max-w-3xl text-center leading-relaxed text-muted-foreground">
            {t.rich("aiDeepIntro", { guide: inlineLink("/color-analysis") })}
          </p>
          {/* 四个维度：默认只露标题，点开看解释（和 FAQ 同一种折叠写法）；手机上不再是四大段连续的小字 */}
          <div className="mx-auto mt-8 max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card px-5">
            {AI_DIMENSIONS.map((dim) => (
              <details key={dim.titleKey} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-base font-semibold">{cg(dim.titleKey)}</h3>
                  <span aria-hidden="true" className="shrink-0 text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cg(dim.descKey)}</p>
              </details>
            ))}
          </div>

          <h3 className="mt-12 text-center font-serif text-2xl font-bold">{t("aiSeasonsTitle")}</h3>
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
      <section className="bg-muted/50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <SectionHeading title={t("compareTitle")} />
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
          <SectionHeading title={t("faqTitle")} />
          <div className="mt-8 divide-y divide-border">
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
      <section className="bg-gradient-to-br from-primary/10 to-gold/20 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">{t("ctaTitle")}</h2>
          <div className="section-ornament" aria-hidden="true">
            <span />
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-10 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
            >
              {t("ctaCta")}
            </Link>
          </div>
          {/* 原来的 ctaNote 是四项并列（免费预览 / 无需注册 / 60 秒 / 12 季型），后两项在首屏已经说过，
              且和首屏 heroNote 的说法、标点都不一致。这里直接复用 heroNote，两处口径相同（ctaNote 键保留不动） */}
          <p className="mt-4 text-sm text-muted-foreground">{t("heroNote")}</p>
        </div>
      </section>
    </>
  );
}

/** 首屏右侧的成品预览：一张自拍、一张该季型的色板卡片、一枚季型标签（示例，和下面「查看效果」里的示例报告同一人） */
function HeroPreview({
  cardAlt,
  selfieAlt,
  seasonName,
}: {
  cardAlt: string;
  selfieAlt: string;
  seasonName: string;
}) {
  return (
    <div className="relative mx-auto aspect-[6/7] w-full max-w-[22rem] sm:max-w-[26rem] lg:max-w-[27rem]">
      <div className="absolute right-0 top-0 w-[64%] rotate-[3deg]">
        <PaletteCardImage
          slug="autumn"
          alt={cardAlt}
          sizes="(min-width: 1024px) 300px, 60vw"
          priority
          rounded="rounded-xl"
          className="w-full shadow-2xl shadow-primary/25"
        />
      </div>
      <div className="absolute bottom-0 left-0 w-[47%] -rotate-[3deg]">
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-2xl border-[5px] border-white bg-card shadow-xl shadow-primary/20">
          <Image
            src="/images/showcase/before-color.webp"
            alt={selfieAlt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 200px, 45vw"
          />
        </div>
      </div>
      <div className="absolute left-[3%] top-[9%] flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-sm font-semibold text-foreground shadow-lg shadow-primary/15 ring-1 ring-primary/20">
        <svg className="h-4 w-4 text-gold-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
        {seasonName}
      </div>
    </div>
  );
}

/** 区块标题：衬线标题 + 金色装饰线。不放副标题：副标题基本是把标题再说一遍，手机上只会把内容往下推 */
function SectionHeading({ title }: { title: string }) {
  return (
    <div className="text-center">
      <h2 className="font-serif text-3xl font-bold sm:text-4xl">{title}</h2>
      <div className="section-ornament" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}

/** 三步里的一步：圆形序号 + 标题；序号两侧各半条连接线（第一步没有左半、最后一步没有右半），三列拼起来是一条贯穿的线 */
function StepCard({
  number,
  title,
  desc,
  first = false,
  last = false,
}: {
  number: string;
  title: string;
  desc: string;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <li className="relative px-1.5 text-center sm:px-4">
      {!first && (
        <span aria-hidden="true" className="absolute left-0 top-5 h-px w-1/2 bg-primary/30 sm:top-7" />
      )}
      {!last && (
        <span aria-hidden="true" className="absolute right-0 top-5 h-px w-1/2 bg-primary/30 sm:top-7" />
      )}
      <div className="relative mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold text-lg font-bold text-white shadow-md shadow-primary/20 sm:mb-4 sm:h-14 sm:w-14 sm:text-xl">
        {number}
      </div>
      <h3 className="font-serif text-sm font-semibold leading-snug sm:text-lg">{title}</h3>
      <p className="mt-2 hidden text-sm text-muted-foreground sm:block">{desc}</p>
    </li>
  );
}

// 首页展示的四页真实报告截图（public/images/examples/color_*.webp），key 对应 messages.colorPage.r<N>t。
// 选图标准：缩略尺寸下一眼能看懂、而且不能把人脸裁掉——第一张用完整的 hero（整脸 + 季型标题），
// 不用整页都是文字胶囊的妆容页；color_thumb_* 是专为缩略图重裁的文件（personal-color-analysis 页的整页长图仍用 color_season / color_avoid）
const HOME_REPORT_PAGES = [
  { key: "r1", image: "/images/examples/color_thumb_season.webp" },
  { key: "r3", image: "/images/examples/color_palette.webp" },
  { key: "r4", image: "/images/examples/color_thumb_avoid.webp" },
  { key: "r7", image: "/images/examples/color_lookbook.webp" },
] as const;

// 首页「全部分析类型」网格：色彩分析排第一（主打产品），其余沿用原来的先后顺序。
// 图片是专门为这个网格做的 explore_*.webp（4:3，AI 生成，图里不带文字所以 9 种语言通用）：
// 每张都直接画出该功能的「结果」——披色布做色彩诊断、面部网格扫描、同一个人三种发色、金 vs 银、前后对比、四种风格、红毯相似度。
// 旧的 card_*.webp 还被 /try 的工具选择卡使用，不要删
const ANALYSIS_TYPES = [
  { titleKey: "colorTitle", href: "/personal-color-analysis" as const, image: "/images/explore_color.webp" },
  { titleKey: "makeupTitle", href: "/makeup-analysis" as const, image: "/images/explore_makeup.webp" },
  { titleKey: "faceTitle", href: "/face-shape-analysis" as const, image: "/images/explore_face.webp" },
  { titleKey: "hairTitle", href: "/hair-color-analysis" as const, image: "/images/explore_hair.webp" },
  { titleKey: "outfitTitle", href: "/outfit-color-analysis" as const, image: "/images/explore_outfit.webp" },
  { titleKey: "glassesTitle", href: "/glasses-analysis" as const, image: "/images/explore_glasses.webp" },
  { titleKey: "occasionTitle", href: "/occasion-makeup" as const, image: "/images/explore_occasion.webp" },
  { titleKey: "jewelryTitle", href: "/jewelry-analysis" as const, image: "/images/explore_jewelry.webp" },
  { titleKey: "glowUpTitle", href: "/glow-up-report" as const, image: "/images/explore_glowup.webp" },
  { titleKey: "styleTitle", href: "/style-personality" as const, image: "/images/explore_style.webp" },
  { titleKey: "celebTitle", href: "/celebrity-match" as const, image: "/images/explore_celeb.webp" },
] as const;

// 复用专题页已翻译好的四个维度文案，不需要额外翻译
const AI_DIMENSIONS = [
  { titleKey: "dimUndertoneTitle", descKey: "dimUndertoneDesc" },
  { titleKey: "dimDepthTitle", descKey: "dimDepthDesc" },
  { titleKey: "dimChromaTitle", descKey: "dimChromaDesc" },
  { titleKey: "dimContrastTitle", descKey: "dimContrastDesc" },
] as const;

