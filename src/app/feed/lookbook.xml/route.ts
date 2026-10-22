import { SITE_URL } from "@/lib/constants";
import { SEASON_PALETTES, SEASON_SLUGS } from "@/lib/color-palette-data";
import { buildLookbookFeedItems } from "@/lib/lookbook-feed";
import { buildRssFeed, rssResponse, type RssFeedItem } from "@/lib/rss-shared";

// 发色图按 publishAt 到点才进 feed（每天 1 张），必须在请求时计算，不能静态化
export const dynamic = "force-dynamic";

export async function GET() {
  const items: RssFeedItem[] = [];

  for (const slug of SEASON_SLUGS) {
    const season = SEASON_PALETTES[slug];
    if (!season) continue;

    const parentCat =
      season.parentSeason.charAt(0).toUpperCase() +
      season.parentSeason.slice(1);

    items.push(...buildLookbookFeedItems(slug, parentCat));
  }

  return rssResponse(
    buildRssFeed({
      title: "Belle AI — Seasonal Lookbooks",
      link: `${SITE_URL}/lookbook`,
      description:
        "Visual inspiration boards for all 12 color seasons: hair color, makeup and outfit ideas.",
      selfHref: `${SITE_URL}/feed/lookbook.xml`,
      items,
    }),
  );
}
