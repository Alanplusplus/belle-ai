import { SITE_URL } from "@/lib/constants";
import { SEASON_PALETTES } from "@/lib/color-palette-data";
import { LOOKBOOK_DATA } from "@/lib/lookbook-data";
import { buildLookbookFeedItems } from "@/lib/lookbook-feed";
import { buildRssFeed, rssResponse } from "@/lib/rss-shared";
import { NextRequest } from "next/server";

// 发色图按 publishAt 到点才进 feed（每天 1 张），必须在请求时计算，不能静态化
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ season: string }> },
) {
  const { season: raw } = await params;
  const slug = raw.replace(/\.xml$/, "");
  const season = SEASON_PALETTES[slug];
  const lookbook = LOOKBOOK_DATA[slug];

  if (!season || !lookbook) {
    return new Response("Not found", { status: 404 });
  }

  const name = season.name.split(" (")[0];

  return rssResponse(
    buildRssFeed({
      title: `Belle AI — ${name} Lookbook`,
      link: `${SITE_URL}/lookbook/${slug}`,
      description: `Visual style inspiration for ${name} color season: hair color, makeup and outfit ideas.`,
      selfHref: `${SITE_URL}/feed/lookbook/${slug}.xml`,
      items: buildLookbookFeedItems(slug, name),
    }),
  );
}
