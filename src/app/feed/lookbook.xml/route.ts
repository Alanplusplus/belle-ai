import { SITE_URL } from "@/lib/constants";
import { SEASON_PALETTES, SEASON_SLUGS } from "@/lib/color-palette-data";
import { LOOKBOOK_DATA } from "@/lib/lookbook-data";
import { buildRssFeed, rssResponse, type RssFeedItem } from "@/lib/rss-shared";

export async function GET() {
  const items: RssFeedItem[] = [];

  for (const slug of SEASON_SLUGS) {
    const season = SEASON_PALETTES[slug];
    const lookbook = LOOKBOOK_DATA[slug];
    if (!season || !lookbook) continue;

    const name = season.name.split(" (")[0];
    const parentCat = season.parentSeason.charAt(0).toUpperCase() + season.parentSeason.slice(1);

    const sectionSummary = lookbook.sections.map((s) => s.title).join(", ");

    items.push({
      title: `${name} Lookbook — Visual Style Inspiration`,
      link: `${SITE_URL}/lookbook/${slug}`,
      description: `${lookbook.heroDescription} Includes: ${sectionSummary}.`,
      imageUrl: `${SITE_URL}/lookbook/${slug}/opengraph-image`,
      imageType: "image/png",
      pubDate: new Date().toUTCString(),
      category: parentCat,
    });
  }

  return rssResponse(
    buildRssFeed({
      title: "Belle AI — Seasonal Lookbooks",
      link: `${SITE_URL}/lookbook`,
      description: "Visual inspiration boards for all 12 color seasons: outfits, makeup, hair, and accessories.",
      selfHref: `${SITE_URL}/feed/lookbook.xml`,
      items,
    }),
  );
}
