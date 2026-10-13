import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getAllSlugs,
  getRelatedPosts,
  slugifyTag,
  getAvailableLocales,
  type BlogPost,
} from "@/lib/blog";
import { detectToolType, getComplementaryTools, toolHref } from "@/lib/blogTools";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/constants";
import { canonicalUrl, buildAlternatesForLocales, buildBreadcrumbJsonLd } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import { StickyBottomCta, InlineCta, BottomCta } from "@/components/BlogCtaBanner";

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

  return {
    title: post.seoTitle || post.title,
    description: post.description,
    alternates: buildAlternatesForLocales(
      locale,
      `/blog/${slug}`,
      getAvailableLocales(slug, routing.locales),
    ),
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: `${post.date}T00:00:00+00:00`,
      ...(post.image ? { images: [{ url: post.image }] } : {}),
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
    dateModified: `${post.date}T00:00:00+00:00`,
    author: {
      "@type": "Organization",
      name: "Belle AI",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Belle AI",
      url: SITE_URL,
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
  post: { date: string; readingTime: string; title: string; tags: string[]; image: string; content: string };
  slug: string;
  related: BlogPost[];
}) {
  const t = useTranslations("blog");
  const ft = useTranslations("features");
  const tt = useTranslations("tryPage");

  // CTA 按文章主题直达对应工具（/try?type=...），而不是一律落到默认工具
  const toolType = detectToolType(slug);
  const target = { href: toolHref(toolType), postSlug: slug, toolType };
  const toolLabel = tt(`type_${toolType}`);
  const complementaryTools = getComplementaryTools(toolType);

  const { before, after } = splitContentAtSecondH2(post.content);

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
            <time>{post.date}</time>
            <span>·</span>
            <span>{post.readingTime} {t("minRead")}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{post.title}</h1>
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

        <div className="prose prose-neutral mt-10 max-w-none break-words prose-headings:font-bold prose-a:text-primary prose-img:h-auto prose-img:max-w-full">
          <MarkdownContent content={before} toolType={toolType} />
        </div>

        {/* Inline CTA — inserted after the 2nd h2 section */}
        <InlineCta
          after={after}
          inlineCtaTitle={t("inlineCtaTitle")}
          inlineCtaDesc={t("inlineCtaDesc")}
          tryItFree={ft("tryItFree")}
          toolLabel={toolLabel}
          target={target}
        />

        {after && (
          <div className="prose prose-neutral max-w-none break-words prose-headings:font-bold prose-a:text-primary prose-img:h-auto prose-img:max-w-full">
            <MarkdownContent content={after} toolType={toolType} />
          </div>
        )}

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

      {/* Sticky bottom bar */}
      <StickyBottomCta target={target} />
    </article>
  );
}

function splitContentAtSecondH2(content: string): { before: string; after: string | null } {
  const lines = content.split("\n");
  let h2Count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      h2Count++;
      if (h2Count === 3) {
        return {
          before: lines.slice(0, i).join("\n"),
          after: lines.slice(i).join("\n"),
        };
      }
    }
  }
  // If fewer than 3 h2s, split at ~40% of the content
  const splitPoint = Math.floor(lines.length * 0.4);
  if (lines.length > 20) {
    return {
      before: lines.slice(0, splitPoint).join("\n"),
      after: lines.slice(splitPoint).join("\n"),
    };
  }
  return { before: content, after: null };
}

/** 文章正文里写死的 `/try` 链接（含 /de/try 这类带语言前缀的）统一改成直达本文对应的工具 */
function rewriteTryLink(href: string | undefined, toolType: string): string | undefined {
  if (!href) return href;
  const match = href.match(/^((?:\/[a-z]{2})?)\/try\/?$/);
  return match ? `${match[1]}/try?type=${toolType}` : href;
}

function MarkdownContent({ content, toolType }: { content: string; toolType: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
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
          <a href={rewriteTryLink(href, toolType)} className="text-primary hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
