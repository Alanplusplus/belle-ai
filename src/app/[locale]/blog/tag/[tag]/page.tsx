import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import {
  decodeTagParam,
  getAllTags,
  getPostsByTag,
  slugifyTag,
  type BlogPost,
} from "@/lib/blog";
import {
  buildBreadcrumbJsonLd,
  canonicalUrl,
  ogLocale,
} from "@/lib/seo";

export function generateStaticParams() {
  const params: { locale: string; tag: string }[] = [];
  for (const locale of routing.locales) {
    const tags = getAllTags(locale);
    for (const { slug } of tags) {
      params.push({ locale, tag: slug });
    }
  }
  return params;
}

function getTagDisplayName(posts: BlogPost[], tagSlug: string): string {
  for (const post of posts) {
    const match = post.tags.find((t) => slugifyTag(t) === tagSlug);
    if (match) return match;
  }
  return tagSlug.replace(/-/g, " ");
}

// 规范地址里的 slug 要百分号编码（中日韩俄标签是非 ASCII）；纯 ASCII 标签编码后不变
const tagPath = (tagSlug: string) => `/blog/tag/${encodeURIComponent(tagSlug)}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag: rawSlug } = await params;
  const tagSlug = decodeTagParam(rawSlug);
  const posts = getPostsByTag(locale, tagSlug);
  if (posts.length === 0) return {};

  const tagName = getTagDisplayName(posts, tagSlug);
  const title = `${tagName} – Blog`;
  const canonical = canonicalUrl(locale, tagPath(tagSlug));

  return {
    title,
    description: `Browse ${posts.length} articles tagged with ${tagName}.`,
    // 标签页只做内部导航，不参与搜索收录：统一 noindex（保留 follow 让链接权重继续传递），
    // 也不输出 hreflang —— 各语种的标签 slug 不同，互指的地址大多不存在
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description: `Browse ${posts.length} articles tagged with ${tagName}.`,
      type: "website",
      locale: ogLocale(locale),
      url: canonical,
    },
    twitter: {
      card: "summary",
      title,
      description: `Browse ${posts.length} articles tagged with ${tagName}.`,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag: rawSlug } = await params;
  setRequestLocale(locale);
  const tagSlug = decodeTagParam(rawSlug);
  const posts = getPostsByTag(locale, tagSlug);
  if (posts.length === 0) notFound();

  const tagName = getTagDisplayName(posts, tagSlug);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Blog", path: "/blog" },
    { name: `Tag: ${tagName}`, path: tagPath(tagSlug) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TagPostList posts={posts} tagName={tagName} />
    </>
  );
}

function TagPostList({
  posts,
  tagName,
}: {
  posts: BlogPost[];
  tagName: string;
}) {
  const t = useTranslations("blog");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; {t("backToBlog")}
        </Link>

        <h1 className="mt-6 text-4xl font-bold capitalize">{tagName}</h1>

        <div className="mt-12 space-y-4">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
            >
              <div
                className={`grid ${post.image ? "sm:grid-cols-[17rem_1fr]" : ""}`}
              >
                {post.image && (
                  // 封面都是 16:9：容器固定 16:9，图片完整显示；不再按卡片高度拉伸后左右被裁掉
                  <Link
                    href={`/blog/${post.slug}`}
                    className="relative m-3 hidden aspect-video self-center overflow-hidden rounded-lg sm:block"
                  >
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="248px"
                    />
                  </Link>
                )}
                <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <time>{post.date}</time>
                      <span>·</span>
                      <span>
                        {post.readingTime} {t("minRead")}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-base font-semibold leading-snug group-hover:text-primary sm:text-lg">
                      {post.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {post.description}
                    </p>
                  </Link>
                  {post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.tags.map((tag: string) => (
                        <Link
                          key={tag}
                          href={`/blog/tag/${slugifyTag(tag)}`}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
