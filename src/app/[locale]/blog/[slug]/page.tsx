import { notFound } from "next/navigation";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/constants";
import { canonicalUrl, buildAlternates, buildBreadcrumbJsonLd } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import { StickyBottomCta, InlineCta } from "@/components/BlogCtaBanner";

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
    title: post.title,
    description: post.description,
    alternates: buildAlternates(locale, `/blog/${slug}`),
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
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
  const post = getPostBySlug(locale, slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
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
      <BlogPostContent post={post} />
    </>
  );
}

function BlogPostContent({ post }: { post: { date: string; readingTime: string; title: string; tags: string[]; image: string; content: string } }) {
  const t = useTranslations("blog");
  const ft = useTranslations("features");

  const { before, after } = splitContentAtSecondH2(post.content);

  return (
    <article className="py-16">
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
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
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

        <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-bold prose-a:text-primary">
          <MarkdownContent content={before} />
        </div>

        {/* Inline CTA — inserted after the 2nd h2 section */}
        <InlineCta after={after} inlineCtaTitle={t("inlineCtaTitle")} inlineCtaDesc={t("inlineCtaDesc")} tryItFree={ft("tryItFree")} />

        {after && (
          <div className="prose prose-neutral max-w-none prose-headings:font-bold prose-a:text-primary">
            <MarkdownContent content={after} />
          </div>
        )}

        {/* Bottom CTA card */}
        <div className="mt-16 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-bold">
            {t("ctaTitle")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ctaDescription")}
          </p>
          <Link
            href="/try"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <StickyBottomCta />
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

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt || ""} className="rounded-lg" loading="lazy" />
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-primary hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
