import { setRequestLocale } from "next-intl/server";
import { getAllPosts } from "@/lib/blog";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { BlogList, BLOG_PAGE_SIZE } from "@/components/BlogList";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/blog");
  return {
    title: messages.meta.blogTitle,
    description: messages.meta.blogDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.blogTitle,
      description: messages.meta.blogDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.blogTitle,
      description: messages.meta.blogDescription,
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const allPosts = getAllPosts(locale);
  const totalPages = Math.max(1, Math.ceil(allPosts.length / BLOG_PAGE_SIZE));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Blog", path: "/blog" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogList posts={allPosts.slice(0, BLOG_PAGE_SIZE)} page={1} totalPages={totalPages} />
    </>
  );
}
