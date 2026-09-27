import { SITE_URL } from "@/lib/constants";
import { TRANSFORMATION_TYPES, TRANSFORMATION_SLUGS } from "@/lib/transformation-data";
import { buildRssFeed, rssResponse, type RssFeedItem } from "@/lib/rss-shared";
import { NextRequest } from "next/server";

export function generateStaticParams() {
  return TRANSFORMATION_SLUGS.map((slug) => ({ type: `${slug}.xml` }));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type: raw } = await params;
  const type = raw.replace(/\.xml$/, "");
  const t = TRANSFORMATION_TYPES.find((t) => t.slug === type);
  if (!t) {
    return new Response("Not found", { status: 404 });
  }

  const items: RssFeedItem[] = [];

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
