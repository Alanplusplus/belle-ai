import { SITE_URL } from "@/lib/constants";
import { TRANSFORMATION_TYPES, TRANSFORMATION_SLUGS } from "@/lib/transformation-data";
import { buildTransformationItems } from "@/lib/transformation-rss";
import { buildRssFeed, rssResponse } from "@/lib/rss-shared";
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

  const items = buildTransformationItems(t);

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
