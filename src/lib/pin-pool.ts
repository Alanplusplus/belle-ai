import raw from "@/content/pins.json";
import { SITE_URL } from "@/lib/constants";
import { absUrl, type RssFeedItem } from "@/lib/rss-shared";

/**
 * 独立 Pin 池：与网站内容（博客 / 画册 / 变身案例）无关、专门为 Pinterest 做的图。
 * 数据由 social-automation/scripts/pins/* 写入（batch 计划 → 出图 → 审核），这里只负责：
 *  - 按「已审核通过 + 到了发布时间」决定哪些 Pin 出现在 feed 里（Pinterest 靠 feed 自动建 Pin）；
 *  - 给每个 Pin 的落地链接带上 UTM（utm_content = Pin 编号），GA4 里可以直接按 Pin / 风格 / 钩子看效果。
 */

export type PinStatus = "pending" | "approved" | "rejected";

export interface PinEntry {
  /** 全局唯一编号，同时作为 utm_content，例如 20261016-0003-palette-question */
  id: string;
  batch: string;
  /** 主题（例如 warm-spring-colors），用作 utm_campaign */
  concept: string;
  /** 画板 slug，对应 /feed/pins/<board>.xml */
  board: string;
  /** 图片风格（实验维度 1） */
  style: string;
  /** 标题钩子类型（实验维度 2） */
  hook: string;
  /** 烤进图片里的大标题 */
  headline: string;
  /** Pin 标题（SEO） */
  title: string;
  /** Pin 描述（SEO） */
  description: string;
  /** 永久 CDN 原图地址（不能是临时地址） */
  imageUrl: string;
  /** 站内落地页，不带 UTM，例如 /try?type=color_analysis */
  destination: string;
  /** 计划发布时间（ISO，UTC）：到点之前不会出现在 feed 里 */
  publishAt: string;
  status: PinStatus;
}

export interface PinBoard {
  name: string;
  description: string;
}

interface PinData {
  boards: Record<string, PinBoard>;
  pins: PinEntry[];
}

const DATA = raw as PinData;

/** feed 里最多放最近多少条：Pinterest 已处理过的旧条目靠 guid 去重，没必要无限增长 */
export const PIN_FEED_LIMIT = 150;

export function getPinBoards(): Record<string, PinBoard> {
  return DATA.boards;
}

/** 已审核通过、且到了发布时间的 Pin，新 → 旧 */
export function getReleasedPins(board?: string, now: number = Date.now()): PinEntry[] {
  return DATA.pins
    .filter((p) => p.status === "approved")
    .filter((p) => !board || p.board === board)
    .filter((p) => Date.parse(p.publishAt) <= now)
    .sort((a, b) => Date.parse(b.publishAt) - Date.parse(a.publishAt))
    .slice(0, PIN_FEED_LIMIT);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 站内落地链接 + UTM。规范域名带 www、英文无 /en 前缀；已有 query 时用 & 连接。 */
export function pinLink(pin: PinEntry): string {
  const sep = pin.destination.includes("?") ? "&" : "?";
  const utm = new URLSearchParams({
    utm_source: "pinterest",
    utm_medium: "social",
    utm_campaign: `pin-${slugify(pin.concept)}`,
    utm_content: pin.id,
  });
  return `${SITE_URL}${pin.destination}${sep}${utm.toString()}`;
}

function imageTypeOf(url: string): string {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  return "image/png";
}

export function pinToFeedItem(pin: PinEntry, boardName?: string): RssFeedItem {
  return {
    title: pin.title,
    link: pinLink(pin),
    // guid 必须永远不变：Pinterest 靠它判断「这条已经建过 Pin」
    guid: `belle-pin:${pin.id}`,
    description: pin.description,
    imageUrl: absUrl(pin.imageUrl),
    imageType: imageTypeOf(pin.imageUrl),
    // 固定为计划发布时间：不要用 new Date()，否则每次请求所有旧条目都像新内容
    pubDate: new Date(pin.publishAt).toUTCString(),
    category: boardName,
  };
}
