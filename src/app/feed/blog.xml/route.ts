import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import { buildRssFeed, rssResponse, absUrl, type RssFeedItem } from "@/lib/rss-shared";

export async function GET() {
  const posts = getAllPosts("en");
  const items: RssFeedItem[] = posts
    .filter((p) => p.image)
    .map((post) => ({
      title: post.title,
      link: `${SITE_URL}/blog/${post.slug}`,
      description: post.description,
      imageUrl: absUrl(post.image),
      pubDate: new Date(post.date).toUTCString(),
      category: post.tags[0] || "Blog",
    }));

  return rssResponse(
    buildRssFeed({
      title: "Belle AI Blog",
      link: `${SITE_URL}/blog`,
      description: "AI-powered personal color analysis tips, guides, and insights.",
      selfHref: `${SITE_URL}/feed/blog.xml`,
      items,
    }),
  );
}
