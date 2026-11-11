"use client";

import { useEffect, useState } from "react";
import type { LookbookData, LookbookSheetKey } from "./lookbook";
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
