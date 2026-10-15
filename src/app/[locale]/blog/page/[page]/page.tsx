import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAllPosts } from "@/lib/blog";
import { routing } from "@/i18n/routing";
import {
  buildAlternatesForLocales,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { BlogList, BLOG_PAGE_SIZE } from "@/components/BlogList";
import type { Metadata } from "next";

function pageCount(locale: string): number {
  return Math.max(1, Math.ceil(getAllPosts(locale).length / BLOG_PAGE_SIZE));
}

/** 只给「确实有这一页」的语种生成 hreflang，避免指向 404 */
function localesWithPage(page: number): string[] {
  return routing.locales.filter((l) => pageCount(l) >= page);
}

export function generateStaticParams() {
  const params: { locale: string; page: string }[] = [];
  for (const locale of routing.locales) {
    const total = pageCount(locale);
    for (let page = 2; page <= total; page++) {
      params.push({ locale, page: String(page) });
    }
  }
  return params;
}

function parsePage(raw: string, locale: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const page = Number(raw);
  if (page < 2 || page > pageCount(locale)) return null;
  return page;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale, page: rawPage } = await params;
  const page = parsePage(rawPage, locale);
  if (!page) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const pageLabel = String(messages.blog.pageLabel)
    .replace("{page}", String(page))
    .replace("{total}", String(pageCount(locale)));
  const title = `${messages.meta.blogTitle} – ${pageLabel}`;
  const alternates = buildAlternatesForLocales(locale, `/blog/page/${page}`, localesWithPage(page));

  return {
    title,
    description: messages.meta.blogDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title,
      description: messages.meta.blogDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title,
      description: messages.meta.blogDescription,
    },
  };
}

export default async function BlogPaginatedPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page: rawPage } = await params;
  setRequestLocale(locale);
  const page = parsePage(rawPage, locale);
  if (!page) notFound();

  const allPosts = getAllPosts(locale);
  const totalPages = pageCount(locale);
  const posts = allPosts.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Blog", path: "/blog" },
    { name: `${page}`, path: `/blog/page/${page}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogList posts={posts} page={page} totalPages={totalPages} />
    </>
  );
}
