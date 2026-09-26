import { SITE_URL } from "@/lib/constants";
import { SEASON_PALETTES, SEASON_SLUGS } from "@/lib/color-palette-data";
import { LOOKBOOK_DATA } from "@/lib/lookbook-data";
import { buildRssFeed, rssResponse, absUrl, type RssFeedItem } from "@/lib/rss-shared";

export async function GET() {
  const items: RssFeedItem[] = [];

  for (const slug of SEASON_SLUGS) {
    const season = SEASON_PALETTES[slug];
    const lookbook = LOOKBOOK_DATA[slug];
    if (!season || !lookbook) continue;

    const name = season.name.split(" (")[0];

    items.push({
      title: `${name} Lookbook — Visual Style Inspiration`,
      link: `${SITE_URL}/lookbook/${slug}`,
      description: lookbook.heroDescription,
      imageUrl: `${SITE_URL}/lookbook/${slug}/opengraph-image`,
      pubDate: new Date().toUTCString(),
      category: season.parentSeason.charAt(0).toUpperCase() + season.parentSeason.slice(1),
    });

    for (const section of lookbook.sections) {
      for (const img of section.images) {
        items.push({
          title: `${name} ${section.title} — ${img.alt}`,
          link: `${SITE_URL}/lookbook/${slug}`,
          description: `${name} lookbook: ${section.title.toLowerCase()} inspiration. ${img.alt}`,
          imageUrl: absUrl(img.src),
          pubDate: new Date().toUTCString(),
          category: season.parentSeason.charAt(0).toUpperCase() + season.parentSeason.slice(1),
        });
      }
    }
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
