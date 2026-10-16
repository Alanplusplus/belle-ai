import { SITE_URL } from "@/lib/constants";
import { getPinBoards, getReleasedPins, pinToFeedItem } from "@/lib/pin-pool";
import { buildRssFeed, rssResponse } from "@/lib/rss-shared";
import { NextRequest } from "next/server";

// 按「当前时间」决定哪些 Pin 已到发布时间，必须在请求时计算，不能在构建时固化
export const dynamic = "force-dynamic";

/**
 * 单个画板的独立 Pin feed：/feed/pins/<board>.xml（一个画板订阅一个 feed）。
 * 带 .xml 后缀是因为 proxy 的 matcher 会跳过带点的路径，否则会被 next-intl 当成语言路径改写。
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ board: string }> },
) {
  const { board: raw } = await params;
  const slug = raw.replace(/\.xml$/, "");
  const board = getPinBoards()[slug];

  if (!board) {
    return new Response("Not found", { status: 404 });
  }

  // 画板存在但还没有到点的 Pin 时返回合法的空 feed，Pinterest 订阅时才不会报错
  const items = getReleasedPins(slug).map((pin) => pinToFeedItem(pin, board.name));

  return rssResponse(
    buildRssFeed({
      title: `Belle AI — ${board.name}`,
      link: SITE_URL,
      description: board.description,
      selfHref: `${SITE_URL}/feed/pins/${slug}.xml`,
      items,
    }),
  );
}
