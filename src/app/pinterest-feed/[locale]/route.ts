import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/lib/blog";
import { canonicalUrl } from "@/lib/seo";
import { buildRssFeed, rssResponse, absUrl, type RssFeedItem } from "@/lib/rss-shared";

/**
 * 按语种拆分的 Pinterest RSS（只含该语种的博客文章，链接指向对应语种页面）：
 * /pinterest-feed/zh.xml、/pinterest-feed/ja.xml …（英文仍用 /pinterest-feed.xml，内容更全）
 * 给不同语种的 Pinterest 账号 / 画板各自认领对应 feed，Pin 的描述和落地页语言才一致。
 */
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
    .slice(0, 30)
    .map((post) => ({
      title: post.title,
      link: canonicalUrl(locale, `/blog/${post.slug}`),
      description: post.description,
      imageUrl: absUrl(post.image),
      pubDate: new Date(post.date).toUTCString(),
      category: "Blog",
    }));

  return rssResponse(
    buildRssFeed({
      title: messages.meta.siteName,
      link: canonicalUrl(locale, ""),
      description: messages.meta.homeDescription,
      selfHref: canonicalUrl("en", `/pinterest-feed/${locale}.xml`),
      language: locale,
      items,
    }),
  );
}
