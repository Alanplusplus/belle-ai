import { SITE_URL } from "@/lib/constants";
import type { TransformationType } from "@/lib/transformation-data";
import type { RssFeedItem } from "@/lib/rss-shared";

/**
 * Build RSS items (Before / After / Report) for one transformation type.
 *
 * - Each item gets a unique, stable guid (`<page>#ex<idx>-<kind>`). Without this, every item
 *   in a type shares the page URL as guid and feed readers (Pinterest) de-duplicate them away.
 *   Examples are append-only, so the index is a stable identifier.
 * - pubDate comes from `example.date` (not `new Date()`), so a redeploy never re-dates old items.
 */
export function buildTransformationItems(t: TransformationType): RssFeedItem[] {
  const link = `${SITE_URL}/transformations/${t.slug}`;
  const items: RssFeedItem[] = [];

  t.examples.forEach((example, idx) => {
    const pubDate = new Date(`${example.date}T12:00:00Z`).toUTCString();

    items.push({
      title: `${t.name}: Before — ${example.label}`,
      link,
      guid: `${link}#ex${idx}-before`,
      description: `The problem: ${example.description}`,
      imageUrl: example.originalBefore,
      imageType: "image/png",
      pubDate,
      category: t.name,
    });

    items.push({
      title: `${t.name}: After — ${example.label}`,
      link,
      guid: `${link}#ex${idx}-after`,
      description: `The transformation: ${example.description}${example.details ? ` ${example.details}` : ""}`,
      imageUrl: example.originalAfter,
      imageType: "image/png",
      pubDate,
      category: t.name,
    });

    items.push({
      title: `${t.name}: AI Report — ${example.label}`,
      link,
      guid: `${link}#ex${idx}-report`,
      description: `The answer: AI analyzed her features and created a personalized ${t.name.toLowerCase()} report. ${example.details || ""}`.trim(),
      imageUrl: example.originalReport,
      imageType: "image/png",
      pubDate,
      category: t.name,
    });
  });

  return items;
}
