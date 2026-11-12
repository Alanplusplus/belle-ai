"use client";

import { useEffect, useState } from "react";
import { OCCASION_LOOKS, SELECTABLE_OCCASIONS, type LookbookData, type LookbookItem, type LookbookSheetKey, type LookbookTile } from "./lookbook";
import { personaBase, type DemoPersonaId } from "./demo-personas";

/**
 * 示例页用的完整 Lookbook：用示例人物的自拍真实生成好的一整套（10 章 39 张小图 + 风格档案），
 * 小图放在 /demo/personas/<id>/，每种语言一份 JSON（文字档案已经译好）。示例不请求后端、不扣额度，所以什么都是解锁的。
 */
const DEMO_LANGS = new Set(["en", "zh-Hans", "ja", "ko", "es", "fr", "de", "ru", "tr"]);
const cache = new Map<string, Promise<LookbookData | null>>();

function load(lang: string, persona: DemoPersonaId): Promise<LookbookData | null> {
  const code = DEMO_LANGS.has(lang) ? lang : "en";
  const key = `${persona}/${code}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(`${personaBase(persona)}/${code}.json`)
      .then((res) => (res.ok ? (res.json() as Promise<LookbookData>) : null))
      .catch(() => null);
    cache.set(key, pending);
    // 失败不缓存，下次还能再试
    pending.then((data) => {
      if (!data) cache.delete(key);
    });
  }
  return pending;
}

/** 独立工具的示例：整套里只取它自己那一章，版式和真实的「分析 + 试戴」结果页一致（试戴已完成） */
function forLens(data: LookbookData, lens: LookbookSheetKey): LookbookData {
  return { ...data, mode: "lens", lens, total: 1, done: 1, sheets: data.sheets.filter((sheet) => sheet.key === lens) };
}

/** 整套 Lookbook 里原有的 3 张场合图（work / date / evening）对应「场景妆容」可选的哪个场合：它们是这三个场合的第 1 套造型 */
const BASE_OCCASIONS: Record<string, string> = { work: "office", date: "date_night", evening: "evening_gala" };

/**
 * 「场景妆容」的示例：选了哪个场合，3 张都是这个场合，是 3 种不同风格的造型（和真实结果一致）。
 * 每位示例人物用自己的自拍为每个场合生成了 3 张（tiles/occasion_<场合>_<0|1|2>.webp）；其中办公 / 约会之夜 / 晚宴的
 * 第 1 张沿用整套里原有的图文（针对这位人物写的），其余的文案不针对具体人物，在 report 命名空间的
 * lbOccDemo_<场合>_<0|1|2>_t / _n 里（text 取文案）。素材缺了就原样返回，不影响页面。
 */
export function withOccasionExample(
  data: LookbookData,
  persona: DemoPersonaId,
  occasion: string,
  text: (key: string) => string,
): LookbookData {
  const sheet = data.sheets.find((s) => s.key === "occasion");
  if (!sheet || !(SELECTABLE_OCCASIONS as readonly string[]).includes(occasion)) return data;
  const own = sheet.items.findIndex((item) => BASE_OCCASIONS[item.occasion ?? ""] === occasion);
  const tiles: LookbookTile[] = [];
  const items: LookbookItem[] = [];
  for (let variant = 0; variant < OCCASION_LOOKS; variant++) {
    if (variant === 0 && own >= 0 && sheet.tiles[own]) {
      tiles.push(sheet.tiles[own]);
      items.push({ ...sheet.items[own], occasion });
      continue;
    }
    tiles.push({ url: `${personaBase(persona)}/tiles/occasion_${occasion}_${variant}.webp`, locked: false });
    items.push({ title: text(`lbOccDemo_${occasion}_${variant}_t`), note: text(`lbOccDemo_${occasion}_${variant}_n`), occasion });
  }
  if (tiles.length !== sheet.tiles.length) return data;
  const next = { ...sheet, tiles, items };
  return { ...data, sheets: data.sheets.map((s) => (s === sheet ? next : s)) };
}

/** 读取示例 Lookbook；lang 传 null 表示不需要（不是示例）。读取失败返回 null，页面直接不展示这一块 */
export function useDemoLookbook(
  lang: string | null,
  persona: DemoPersonaId,
  lens?: LookbookSheetKey,
): { data: LookbookData | null; loading: boolean } {
  const [state, setState] = useState<{ lang: string; persona: DemoPersonaId; data: LookbookData | null } | null>(null);

  useEffect(() => {
    if (!lang) return;
    let cancelled = false;
    load(lang, persona).then((data) => {
      if (!cancelled) setState({ lang, persona, data });
    });
    return () => {
      cancelled = true;
    };
  }, [lang, persona]);

  if (!lang) return { data: null, loading: false };
  if (!state || state.lang !== lang || state.persona !== persona) return { data: null, loading: true };
  return { data: state.data && lens ? forLens(state.data, lens) : state.data, loading: false };
}
