import { SITE_URL } from "@/lib/constants";
import { TRANSFORMATION_TYPES } from "@/lib/transformation-data";
import { buildRssFeed, rssResponse, absUrl, type RssFeedItem } from "@/lib/rss-shared";

export async function GET() {
  const items: RssFeedItem[] = [];

  for (const t of TRANSFORMATION_TYPES) {
    for (const example of t.examples) {
      items.push({
        title: `${t.name} Transformation — ${example.label}`,
        link: `${SITE_URL}/transformations/${t.slug}`,
        description: example.description,
        imageUrl: absUrl(example.after),
        pubDate: new Date().toUTCString(),
        category: t.name,
      });
    }
  }

  return rssResponse(
    buildRssFeed({
      title: "Belle AI — Before & After Transformations",
      link: `${SITE_URL}/transformations`,
      description: "Real before-and-after results from AI-powered color analysis, makeup, and styling.",
      selfHref: `${SITE_URL}/feed/transformations.xml`,
      items,
    }),
  );
}
