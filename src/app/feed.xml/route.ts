import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";

export async function GET() {
  const posts = getAllPosts("en");
  const latestDate = posts[0]?.date || new Date().toISOString().split("T")[0];

  const items = posts
    .slice(0, 30)
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Belle AI Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>AI-powered personal color analysis tips, guides, and insights.</description>
    <language>en</language>
    <lastBuildDate>${new Date(latestDate).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
