import { SITE_URL } from "@/lib/constants";
import { TRANSFORMATION_TYPES } from "@/lib/transformation-data";
import { buildTransformationItems } from "@/lib/transformation-rss";
import { buildRssFeed, rssResponse } from "@/lib/rss-shared";

export async function GET() {
  const items = TRANSFORMATION_TYPES.flatMap((t) => buildTransformationItems(t));

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
