import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getAllSlugs,
  getRelatedPosts,
  slugifyTag,
  getAvailableLocales,
  type BlogPost,
} from "@/lib/blog";
import { detectToolType, exampleReportImage, getComplementaryTools, toolHref } from "@/lib/blogTools";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/constants";
import {
  canonicalUrl,
  buildAlternatesForLocales,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import { StickyBottomCta, TopCta, BottomCta } from "@/components/BlogCtaBanner";
import { VideoSection } from "@/components/VideoEmbed";
import { getVideoForBlog } from "@/lib/videos";

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    const slugs = getAllSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale, slug);
  if (!post) return {};

  const alternates = buildAlternatesForLocales(
    locale,
    `/blog/${slug}`,
    getAvailableLocales(slug, routing.locales),
  );
  const imageUrl = post.image
    ? post.image.startsWith("http") ? post.image : `${SITE_URL}${post.image}`
    : null;

  return {
    title: post.seoTitle || post.title,
    description: post.description,
    alternates,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: ogLocale(locale),
      url: alternates.canonical,
      publishedTime: `${post.date}T00:00:00+00:00`,
      modifiedTime: `${post.updated}T00:00:00+00:00`,
      // 没有头图的文章回退到全站默认分享图，避免分享时没有预览
      images: imageUrl ? [{ url: imageUrl }] : OG_IMAGES,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: imageUrl ? [imageUrl] : TWITTER_IMAGES,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPostBySlug(locale, slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: `${post.date}T00:00:00+00:00`,
    dateModified: `${post.updated}T00:00:00+00:00`,
    author: {
      "@type": "Organization",
      name: "Belle AI",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Belle AI",
      url: SITE_URL,
      // Article 富结果要求 publisher 带 logo
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl(locale, `/blog/${slug}`),
    },
    inLanguage: locale,
    ...(post.image ? { image: post.image.startsWith("http") ? post.image : `${SITE_URL}${post.image}` } : {}),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${slug}` },
  ]);

  const faqJsonLd =
    post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <BlogPostContent
        post={post}
        slug={slug}
        related={getRelatedPosts(locale, slug, 4)}
      />
    </>
  );
}

function BlogPostContent({
  post,
  slug,
  related,
}: {
  post: { date: string; updated: string; readingTime: string; title: string; tags: string[]; image: string; content: string };
  slug: string;
  related: BlogPost[];
}) {
  const locale = useLocale();
  const t = useTranslations("blog");
  const ft = useTranslations("features");
  const tt = useTranslations("tryPage");

  // CTA 按文章主题直达对应工具（/try?type=...），而不是一律落到默认工具
  const toolType = detectToolType(slug);
  const target = { href: toolHref(toolType), postSlug: slug, toolType };
  const toolLabel = tt(`type_${toolType}`);
  const complementaryTools = getComplementaryTools(toolType);
  const headings = extractH2Headings(post.content);
  const video = getVideoForBlog(slug);

  return (
    <article className="py-10 pb-28 sm:py-16 sm:pb-16">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; {t("backToBlog")}
        </Link>

        <header className="mt-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={post.date}>{post.date}</time>
            {post.updated !== post.date && (
              <>
                <span>·</span>
                <span>
                  {t("updatedOn")} <time dateTime={post.updated}>{post.updated}</time>
                </span>
              </>
            )}
            <span>·</span>
            <span>{post.readingTime} {t("minRead")}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{post.title}</h1>
          {/* 顶部 CTA：直接搜索 / 社媒进来的读者首屏就能看到入口 */}
          <TopCta
            title={t("topCtaTitle")}
            description={tt(`out_${toolType}`)}
            note={t("sidebarCtaFree")}
            tryItFree={ft("tryItFree")}
            toolLabel={toolLabel}
            image={exampleReportImage(toolType)}
            target={target}
          />
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${slugifyTag(tag)}`}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {post.image && (
          <div className="mt-8 overflow-hidden rounded-2xl">
            <Image
              src={post.image}
              alt={post.title}
              width={768}
              height={432}
              className="w-full"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        {/* 长文目录：5 个以上二级标题才出现；用原生 <details>，手机上默认收起，不占首屏 */}
        {headings.length >= 5 && (
          <details className="group mt-8 rounded-2xl border border-gold/40 bg-white/70 px-5 py-3 open:pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
              <span>
                {t("toc")} <span className="font-normal text-muted-foreground">· {headings.length}</span>
              </span>
              <svg
                className="h-4 w-4 shrink-0 text-gold-deep transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <ol className="mt-3 space-y-2 border-t border-gold/30 pt-3 text-sm">
              {headings.map((text, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-5 shrink-0 text-right tabular-nums text-gold-deep">{i + 1}.</span>
                  <a href={`#${headingId(i)}`} className="text-foreground/85 hover:text-primary hover:underline">
                    {text}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {/* 有配套 YouTube 视频的文章：正文之前给一个视频版入口（点击才加载播放器，不影响首屏） */}
        {video && <VideoSection video={video} page={`blog:${slug}`} className="mt-8" />}

        <div className="prose prose-neutral mt-10 max-w-none break-words prose-headings:font-bold prose-a:text-primary prose-img:h-auto prose-img:max-w-full">
          <MarkdownContent content={post.content} toolType={toolType} locale={locale} />
        </div>

        {/* Bottom CTA card */}
        <BottomCta
          title={t("ctaTitle")}
          description={t("ctaDescription")}
          tryItFree={ft("tryItFree")}
          toolLabel={toolLabel}
          target={target}
        />

        {/* 相关文章：同主题簇 / 标签相近的文章互相链接，给长尾文章补内链 */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-bold">{t("relatedPosts")}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/blog/${item.slug}`}
                    className="block h-full rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold leading-snug">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 相关工具：读完文章后的下一步，直达互补的分析类型 */}
        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("relatedTools")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {complementaryTools.map((type) => (
              <Link
                key={type}
                href={toolHref(type)}
                className="rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
              >
                {tt(`type_${type}`)} →
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* 底部吸附条：顶部 CTA 滚出视口后接力 */}
      <StickyBottomCta target={target} />
    </article>
  );
}

/**
 * 文章正文里的站内链接统一处理：
 * 1. 没写语种前缀的站内链接（如德语文章里的 `/try`、`/tools/color-quiz`）补上当前语种，
 *    否则读者会被带到英文页面，内链权重也流向了错误语种的 URL（默认语种 en 本来就不带前缀）。
 * 2. `/try`（含 /de/try 这类带语言前缀的）改成直达本文对应的工具 `/try?type=...`。
 * 静态资源、外链和锚点保持原样。
 */
function localizeHref(href: string | undefined, locale: string, toolType: string): string | undefined {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return href;

  const hasLocalePrefix = routing.locales.some(
    (l) =>
      href === `/${l}` ||
      href.startsWith(`/${l}/`) ||
      href.startsWith(`/${l}?`) ||
      href.startsWith(`/${l}#`),
  );
  const isAsset = /^\/(images|_next|feed|api)\b/.test(href) || /\.[a-z0-9]+$/i.test(href);

  let path = href;
  if (!hasLocalePrefix && !isAsset && locale !== routing.defaultLocale) {
    // 根路径 "/" 在非默认语种下是 /de，而不是 /de/
    path = href === "/" ? `/${locale}` : `/${locale}${href}`;
  }

  const match = path.match(/^((?:\/[a-z]{2})?)\/try\/?$/);
  return match ? `${match[1]}/try?type=${toolType}` : path;
}

/** 目录和正文标题按「第几个二级标题」对号入座，比按标题文字生成锚点稳（各语种、带符号的标题都不会对不上） */
function headingId(index: number): string {
  return `section-${index + 1}`;
}

/** 取正文里的二级标题文字（跳过代码块），去掉行内的 markdown 标记 */
function extractH2Headings(content: string): string[] {
  const result: string[] = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    result.push(
      match[1]
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[*_`~]/g, "")
        .trim(),
    );
  }
  return result;
}

function MarkdownContent({ content, toolType, locale }: { content: string; toolType: string; locale: string }) {
  let h2Count = 0;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => <h2 id={headingId(h2Count++)} className="scroll-mt-24">{children}</h2>,
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt || ""} className="h-auto max-w-full rounded-lg" loading="lazy" decoding="async" />
        ),
        // 宽表格在手机上横向滚动，不撑破页面宽度
        table: ({ children }) => (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table>{children}</table>
          </div>
        ),
        a: ({ href, children }) => (
          <a href={localizeHref(href, locale, toolType)} className="text-primary hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
