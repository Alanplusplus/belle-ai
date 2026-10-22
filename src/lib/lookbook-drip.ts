import raw from "@/data/lookbook-drip.json";

/**
 * Lookbook 发色「滴灌」图：每个季型每天放出 1 张新发色图（Pinterest 数据里转化最好的内容类型）。
 *
 * - 数据由 social-automation/scripts/lookbook-drip.ts 生成并写入 `src/data/lookbook-drip.json`
 * - 图片文件：`public/images/lookbook/<season>/<key>.webp`（网页展示），`imageUrl` 是永久 CDN PNG（RSS 用）
 * - 页面 / sitemap 通过 lookbook-data.ts 展示全部 approved 图片；
 *   Pinterest RSS 按 `publishAt` 在请求时过滤（feed 路由是动态的），到点才会进 feed，从而每天只放 1 张。
 * - status 为 rejected 的条目既不展示也不进 feed（人工抽检淘汰用）。
 */
export interface LookbookDripItem {
  season: string;
  /** 图片 key，形如 hair-4，沿用 hair-<n> 前缀才能通过 Pinterest feed 的类型过滤 */
  key: string;
  shade: string;
  style: string;
  title: string;
  alt: string;
  description: string;
  imageUrl: string;
  /** ISO 时间，到点后才会出现在 Pinterest feed */
  publishAt: string;
  status: "approved" | "rejected";
}

/** 网页上每个季型最多展示的发色滴灌图数量（取最新的），避免页面无限变长 */
export const LOOKBOOK_DRIP_PAGE_LIMIT = 24;

const ALL_ITEMS = (raw as { items: LookbookDripItem[] }).items;

export function getDripItems(season: string): LookbookDripItem[] {
  return ALL_ITEMS.filter((item) => item.season === season && item.status === "approved").sort(
    (a, b) => a.publishAt.localeCompare(b.publishAt),
  );
}

export function getDripItem(season: string, key: string): LookbookDripItem | undefined {
  return getDripItems(season).find((item) => item.key === key);
}

export function isDripReleased(item: LookbookDripItem, now: number = Date.now()): boolean {
  return Date.parse(item.publishAt) <= now;
}
