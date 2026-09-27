import { SITE_URL } from "@/lib/constants";
import { TRANSFORMATION_TYPES } from "@/lib/transformation-data";
import { buildRssFeed, rssResponse, type RssFeedItem } from "@/lib/rss-shared";

export async function GET() {
  const items: RssFeedItem[] = [];

  for (const t of TRANSFORMATION_TYPES) {
    for (const example of t.examples) {
      const link = `${SITE_URL}/transformations/${t.slug}`;

      items.push({
        title: `${t.name}: Before — ${example.label}`,
        link,
        description: `The problem: ${example.description}`,
        imageUrl: example.originalBefore,
        imageType: "image/png",
        pubDate: new Date().toUTCString(),
        category: t.name,
      });

      items.push({
        title: `${t.name}: After — ${example.label}`,
        link,
        description: `The transformation: ${example.description}${example.details ? ` ${example.details}` : ""}`,
        imageUrl: example.originalAfter,
        imageType: "image/png",
        pubDate: new Date().toUTCString(),
        category: t.name,
      });

      items.push({
        title: `${t.name}: AI Report — ${example.label}`,
        link,
        description: `The answer: AI analyzed her features and created a personalized ${t.name.toLowerCase()} report. ${example.details || ""}`.trim(),
        imageUrl: example.originalReport,
        imageType: "image/png",
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
