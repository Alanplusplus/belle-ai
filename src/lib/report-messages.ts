"use client";

import { useEffect, useState } from "react";
import { localeOfReportLang } from "./color-report";

/** 季型文案（messages 的 sd.<slug>）：名称、标语、特征、化妆 / 发色 / 饰品条目、搭配建议 */
export type SeasonText = Record<string, string>;

export interface ReportMessages {
  locale: string;
  /** messages 的 report 命名空间：报告页自己的界面文案 */
  ui: Record<string, string>;
  /** messages 的 sd 命名空间：12 个季型的静态内容 */
  seasons: Record<string, SeasonText>;
}

/**
 * 报告的语言可以和网站语言不同（用户在报告里单独选语言），所以季型内容和界面文案不走 next-intl 的 provider
 * （provider 只带了页面语言的少数命名空间，sd 太大不适合塞进每个页面），而是按报告语言懒加载对应的语言包。
 * 显式写出每个 import，打包器才能拆成独立的懒加载分块。
 */
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
  ja: () => import("@/messages/ja.json"),
  ko: () => import("@/messages/ko.json"),
  es: () => import("@/messages/es.json"),
  fr: () => import("@/messages/fr.json"),
  de: () => import("@/messages/de.json"),
  ru: () => import("@/messages/ru.json"),
  tr: () => import("@/messages/tr.json"),
};

const cache = new Map<string, ReportMessages>();
const pending = new Map<string, Promise<ReportMessages>>();

export function loadReportMessages(locale: string): Promise<ReportMessages> {
  const key = LOADERS[locale] ? locale : "en";
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(key);
  if (inflight) return inflight;
  const promise = LOADERS[key]().then((mod) => {
    const all = mod.default as { report?: Record<string, string>; sd?: Record<string, SeasonText> };
    const loaded: ReportMessages = { locale: key, ui: all.report ?? {}, seasons: all.sd ?? {} };
    cache.set(key, loaded);
    pending.delete(key);
    return loaded;
  });
  pending.set(key, promise);
  return promise;
}

/** 按报告语言取文案；加载期间返回上一次的语言包（切换语言时界面不闪空白），首次加载返回 null */
export function useReportMessages(lang: string): ReportMessages | null {
  const locale = localeOfReportLang(lang);
  const [messages, setMessages] = useState<ReportMessages | null>(() => cache.get(locale) ?? null);

  useEffect(() => {
    let cancelled = false;
    loadReportMessages(locale).then((loaded) => {
      if (!cancelled) setMessages(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return messages;
}

/** 把 "{count} left" 里的占位符替换掉 */
export function fmt(template: string | undefined, vars: Record<string, string | number> = {}): string {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}

/** 季型里按顺序排列的条目（lips / eyes / blush / jewelry 是用顿号或逗号分隔的一句话） */
export function splitItems(text: string | undefined): string[] {
  if (!text) return [];
  // 括号里的逗号不算分隔符：「vivid gemstones (emerald, sapphire)」是一个条目
  const items: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(" || ch === "（") depth++;
    else if ((ch === ")" || ch === "）") && depth > 0) depth--;
    if (depth === 0 && /[,，、;；]/.test(ch)) {
      items.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  items.push(current);
  return items.map((s) => s.trim()).filter(Boolean);
}
