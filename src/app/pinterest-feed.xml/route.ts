import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import { SEASON_PALETTES, SEASON_SLUGS } from "@/lib/color-palette-data";
import { LOOKBOOK_DATA } from "@/lib/lookbook-data";
import { TRANSFORMATION_TYPES } from "@/lib/transformation-data";
import { GUIDE_TOPICS } from "@/lib/guide-data";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

interface FeedItem {
  title: string;
  link: string;
  description: string;
  imageUrl: string;
  pubDate: string;
  category: string;
}

export async function GET() {
  const items: FeedItem[] = [];

  const posts = getAllPosts("en");
  for (const post of posts) {
    if (!post.image) continue;
    items.push({
      title: post.title,
      link: `${SITE_URL}/blog/${post.slug}`,
      description: post.description,
      imageUrl: absUrl(post.image),
      pubDate: new Date(post.date).toUTCString(),
      category: "Blog",
    });
  }

  for (const slug of SEASON_SLUGS) {
    const season = SEASON_PALETTES[slug];
    if (!season) continue;
    const lookbook = LOOKBOOK_DATA[slug];
    if (lookbook) {
      for (const section of lookbook.sections) {
        for (const img of section.images) {
          items.push({
            title: `${season.name} ${section.title} — ${img.alt}`,
            link: `${SITE_URL}/lookbook/${slug}`,
            description: `${season.name} lookbook: ${section.title.toLowerCase()} inspiration. ${img.alt}`,
            imageUrl: absUrl(img.src),
            pubDate: new Date().toUTCString(),
            category: "Lookbook",
          });
        }
      }
    }
  }

  for (const t of TRANSFORMATION_TYPES) {
    for (const example of t.examples) {
      items.push({
        title: `${t.name} Transformation — ${example.label}`,
        link: `${SITE_URL}/transformations/${t.slug}`,
        description: example.description,
        imageUrl: absUrl(example.after),
        pubDate: new Date().toUTCString(),
        category: "Transformations",
      });
    }
  }

  for (const guide of GUIDE_TOPICS) {
    for (const section of guide.sections) {
      if (section.image) {
        items.push({
          title: `${guide.name} — ${section.title}`,
          link: `${SITE_URL}/guides/${guide.slug}`,
          description: section.description,
          imageUrl: absUrl(section.image),
          pubDate: new Date().toUTCString(),
          category: "Guides",
        });
      }
    }
  }

  const now = new Date().toUTCString();

  const xmlItems = items
    .map(
      (item) => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="false">${escapeXml(item.link)}#${escapeXml(item.imageUrl)}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <category>${escapeXml(item.category)}</category>
      <enclosure url="${escapeXml(item.imageUrl)}" type="image/webp" length="0"/>
      <media:content url="${escapeXml(item.imageUrl)}" medium="image" type="image/webp">
        <media:title type="plain">${escapeXml(item.title)}</media:title>
        <media:description type="plain">${escapeXml(item.description)}</media:description>
      </media:content>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Belle AI — Color Analysis Inspiration</title>
    <link>${SITE_URL}</link>
    <description>AI-powered personal color analysis: seasonal palettes, lookbooks, makeup guides, and before/after transformations.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/pinterest-feed.xml" rel="self" type="application/rss+xml"/>
${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
