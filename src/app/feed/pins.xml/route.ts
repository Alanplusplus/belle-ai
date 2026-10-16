import { SITE_URL } from "@/lib/constants";
import { getPinBoards, getReleasedPins, pinToFeedItem } from "@/lib/pin-pool";
import { buildRssFeed, rssResponse } from "@/lib/rss-shared";

// 按「当前时间」决定哪些 Pin 已到发布时间，必须在请求时计算，不能在构建时固化
export const dynamic = "force-dynamic";

/** 所有画板的独立 Pin 汇总 feed；Pinterest 画板建议各自订阅 /feed/pins/<board>.xml */
export async function GET() {
  const boards = getPinBoards();
  const items = getReleasedPins().map((pin) => pinToFeedItem(pin, boards[pin.board]?.name));

  return rssResponse(
    buildRssFeed({
      title: "Belle AI — Color Analysis Pins",
      link: SITE_URL,
      description: "Pinterest-first visuals: seasonal palettes, makeup looks, hair colors and outfit ideas from Belle AI.",
      selfHref: `${SITE_URL}/feed/pins.xml`,
      items,
    }),
  );
}
