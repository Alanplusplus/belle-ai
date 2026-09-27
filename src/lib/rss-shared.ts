import { SITE_URL } from "@/lib/constants";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function guessImageType(url: string): string {
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) return "image/jpeg";
  if (url.endsWith(".gif")) return "image/gif";
  if (url.endsWith(".svg")) return "image/svg+xml";
  if (url.endsWith(".webp")) return "image/webp";
  if (url.includes("opengraph-image")) return "image/png";
  return "image/webp";
}

export function absUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface RssFeedItem {
  title: string;
  link: string;
  /** Optional unique id; defaults to link */
  guid?: string;
  description: string;
  imageUrl?: string;
  imageType?: string;
  pubDate: string;
  category?: string;
}

export function buildRssFeed(opts: {
  title: string;
  link: string;
  description: string;
  selfHref: string;
  items: RssFeedItem[];
}): string {
  const xmlItems = opts.items
    .map((item) => {
      const imgUrl = item.imageUrl ? escapeXml(absUrl(item.imageUrl)) : "";
      const imgType = item.imageType || guessImageType(item.imageUrl || "");
      const imgTags = imgUrl
        ? `\n      <enclosure url="${imgUrl}" type="${imgType}" length="0"/>
      <media:content url="${imgUrl}" medium="image" type="${imgType}">
        <media:title type="plain">${escapeXml(item.title)}</media:title>
        <media:description type="plain">${escapeXml(item.description)}</media:description>
      </media:content>`
        : "";
      const catTag = item.category
        ? `\n      <category>${escapeXml(item.category)}</category>`
        : "";
      const guidVal = item.guid || item.link;
      const isPerma = !item.guid || item.guid === item.link;
      return `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="${isPerma ? "true" : "false"}">${escapeXml(guidVal)}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>${catTag}${imgTags}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(opts.title)}</title>
    <link>${escapeXml(opts.link)}</link>
    <description>${escapeXml(opts.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(opts.selfHref)}" rel="self" type="application/rss+xml"/>
${xmlItems}
  </channel>
</rss>`;
}

export function rssResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
