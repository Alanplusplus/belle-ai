import { SITE_URL } from "@/lib/constants";
import { exampleReportImage, sampleHref } from "@/lib/blogTools";
import { TRANSFORMATION_TOOL, type TransformationType } from "@/lib/transformation-data";
import type { RssFeedItem } from "@/lib/rss-shared";

/**
 * Build RSS items for one transformation type: a Before / After pair per example, plus one
 * "sample report" item per type.
 *
 * - Each item gets a unique, stable guid (`<page>#ex<idx>-<kind>`). Without this, every item
 *   in a type shares the page URL as guid and feed readers (Pinterest) de-duplicate them away.
 *   Examples are append-only, so the index is a stable identifier.
 * - pubDate comes from `example.date` (not `new Date()`), so a redeploy never re-dates old items.
 * - The old per-example infographic posters ("AI Report") are gone: the report people get now is the
 *   magazine-style one, and every example of a type would share that single image anyway, so it is
 *   emitted once per type and links straight to the sample demo (shortest path to seeing a result).
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
  });

  const tool = TRANSFORMATION_TOOL[t.slug];
  if (tool && t.examples.length > 0) {
    // 最早一个示例的日期：之后再追加示例也不会让这一条被重新「发布」
    const firstDate = t.examples.map((e) => e.date).sort()[0];
    items.push({
      title: `${t.name}: Sample Report`,
      link: `${SITE_URL}${sampleHref(tool)}`,
      guid: `${link}#sample-report`,
      description: `The answer: this is what a personalized ${t.name.toLowerCase()} report looks like. Open the full sample report and try it with a sample photo — free, no sign-up.`,
      imageUrl: exampleReportImage(tool),
      imageType: "image/webp",
      pubDate: new Date(`${firstDate}T12:00:00Z`).toUTCString(),
      category: t.name,
    });
  }

  return items;
}
