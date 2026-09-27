import { SITE_URL } from "@/lib/constants";
import { TRANSFORMATION_TYPES, TRANSFORMATION_SLUGS } from "@/lib/transformation-data";
import { buildRssFeed, rssResponse, type RssFeedItem } from "@/lib/rss-shared";
import { NextRequest } from "next/server";

export function generateStaticParams() {
  return TRANSFORMATION_SLUGS.map((type) => ({ type }));
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { type } = (await context.params) as { type: string };
  const t = TRANSFORMATION_TYPES.find((t) => t.slug === type);
  if (!t) {
    return new Response("Not found", { status: 404 });
  }

  const items: RssFeedItem[] = [];

  for (const example of t.examples) {
    const parts: string[] = [example.description];
    if (example.details) parts.push(example.details);

    items.push({
      title: `${t.name} — ${example.label}`,
      link: `${SITE_URL}/transformations/${t.slug}`,
      description: parts.join(" "),
      imageUrl: example.originalReport,
      imageType: "image/png",
      pubDate: new Date().toUTCString(),
      category: t.name,
    });
  }

  return rssResponse(
    buildRssFeed({
      title: `Belle AI — ${t.name} Transformations`,
      link: `${SITE_URL}/transformations/${t.slug}`,
      description: t.description,
      selfHref: `${SITE_URL}/feed/transformations/${type}.xml`,
      items,
    }),
  );
}
