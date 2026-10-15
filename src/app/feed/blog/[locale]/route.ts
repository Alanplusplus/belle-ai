import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/lib/blog";
import { canonicalUrl } from "@/lib/seo";
import { buildRssFeed, rssResponse, absUrl, type RssFeedItem } from "@/lib/rss-shared";

/** 按语种拆分的博客 RSS：/feed/blog/zh.xml、/feed/blog/ja.xml …（英文仍用 /feed/blog.xml） */
export function generateStaticParams() {
  // 参数带 .xml 后缀：既是习惯的 feed 地址，也让 proxy 的 matcher（排除带点路径）放行，不被 next-intl 当页面路由改写
  return routing.locales.map((locale) => ({ locale: `${locale}.xml` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw.replace(/\.xml$/, "");
  if (!(routing.locales as readonly string[]).includes(locale)) return new Response("Not found", { status: 404 });

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const items: RssFeedItem[] = getAllPosts(locale)
    .filter((p) => p.image)
    .map((post) => ({
      title: post.title,
      link: canonicalUrl(locale, `/blog/${post.slug}`),
      description: post.description,
      imageUrl: absUrl(post.image),
      pubDate: new Date(post.date).toUTCString(),
      category: post.tags[0] || "Blog",
    }));

  return rssResponse(
    buildRssFeed({
      title: messages.meta.blogTitle,
      link: canonicalUrl(locale, "/blog"),
      description: messages.meta.blogDescription,
      selfHref: canonicalUrl("en", `/feed/blog/${locale}.xml`),
      language: locale,
      items,
    }),
  );
}
