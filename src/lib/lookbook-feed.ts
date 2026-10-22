import { SITE_URL } from "@/lib/constants";
import { SEASON_PALETTES } from "@/lib/color-palette-data";
import { LOOKBOOK_DATA, isPinterestLookbookImage } from "@/lib/lookbook-data";
import { getDripItem, isDripReleased } from "@/lib/lookbook-drip";
import { getOriginalUrl } from "@/lib/lookbook-originals";
import type { RssFeedItem } from "@/lib/rss-shared";

/**
 * 基础 Lookbook 条目的固定 pubDate。
 * 以前用 `new Date()`，每次请求都会变；Pinterest 按 guid 去重，固定值更稳定也更符合 RSS 习惯。
 */
const BASE_PUBDATE = new Date("2026-09-01T00:00:00Z").toUTCString();

function dripLink(slug: string, key: string): string {
  const params = new URLSearchParams({
    utm_source: "pinterest",
    utm_medium: "social",
    utm_campaign: "lookbook-hair",
    utm_content: `${slug}-${key}`,
  });
  return `${SITE_URL}/lookbook/${slug}?${params.toString()}`;
}

/**
 * 某个季型当前应出现在 Pinterest feed 的条目：
 * - 基础图：只发发色 / 妆容 / 穿搭（见 lookbook-data.ts）
 * - 发色滴灌图：publishAt 已到的才输出，最新的排最前
 * 该函数必须在请求时调用（feed 路由为 force-dynamic），不能在模块加载时缓存结果。
 */
export function buildLookbookFeedItems(slug: string, category: string, now: number = Date.now()): RssFeedItem[] {
  const season = SEASON_PALETTES[slug];
  const lookbook = LOOKBOOK_DATA[slug];
  if (!season || !lookbook) return [];

  const name = season.name.split(" (")[0];
  const base: RssFeedItem[] = [];
  const drip: { publishAt: string; item: RssFeedItem }[] = [];

  for (const section of lookbook.sections) {
    for (const img of section.images) {
      if (!isPinterestLookbookImage(img.key)) continue;

      const dripItem = getDripItem(slug, img.key);
      if (dripItem) {
        if (!isDripReleased(dripItem, now)) continue;
        drip.push({
          publishAt: dripItem.publishAt,
          item: {
            title: dripItem.title,
            link: dripLink(slug, img.key),
            guid: `${SITE_URL}/lookbook/${slug}#${img.key}`,
            description: dripItem.description,
            imageUrl: dripItem.imageUrl,
            imageType: "image/png",
            pubDate: new Date(dripItem.publishAt).toUTCString(),
            category,
          },
        });
        continue;
      }

      const originalUrl = getOriginalUrl(slug, img.key);
      if (!originalUrl) continue;
      base.push({
        title: `${name} — ${section.title}: ${img.alt}`,
        link: `${SITE_URL}/lookbook/${slug}`,
        guid: `${SITE_URL}/lookbook/${slug}#${img.key}`,
        description: `${section.description} — ${img.alt}`,
        imageUrl: originalUrl,
        imageType: "image/png",
        pubDate: BASE_PUBDATE,
        category,
      });
    }
  }

  drip.sort((a, b) => b.publishAt.localeCompare(a.publishAt));
  return [...drip.map((d) => d.item), ...base];
}
