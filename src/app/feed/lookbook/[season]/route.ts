import { SITE_URL } from "@/lib/constants";
import { SEASON_PALETTES, SEASON_SLUGS } from "@/lib/color-palette-data";
import { LOOKBOOK_DATA } from "@/lib/lookbook-data";
import { getOriginalUrl } from "@/lib/lookbook-originals";
import { buildRssFeed, rssResponse, type RssFeedItem } from "@/lib/rss-shared";
import { NextRequest } from "next/server";

export function generateStaticParams() {
  return SEASON_SLUGS.map((slug) => ({ season: `${slug}.xml` }));
}

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
  const items: RssFeedItem[] = [];

  for (const section of lookbook.sections) {
    for (const img of section.images) {
      const originalUrl = getOriginalUrl(slug, img.key);
      if (!originalUrl) continue;

      items.push({
        title: `${name} — ${section.title}: ${img.alt}`,
        link: `${SITE_URL}/lookbook/${slug}`,
        guid: `${SITE_URL}/lookbook/${slug}#${img.key}`,
        description: `${section.description} — ${img.alt}`,
        imageUrl: originalUrl,
        imageType: "image/png",
        pubDate: new Date().toUTCString(),
        category: name,
      });
    }
  }

  return rssResponse(
    buildRssFeed({
      title: `Belle AI — ${name} Lookbook`,
      link: `${SITE_URL}/lookbook/${slug}`,
      description: `Visual style inspiration for ${name} color season: outfits, makeup, hair, jewelry, and palette guidance.`,
      selfHref: `${SITE_URL}/feed/lookbook/${slug}.xml`,
      items,
    }),
  );
}
