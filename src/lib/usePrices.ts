"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { isCurrencyCode, resolvePrice, type CurrencyCode, type PriceSpec } from "./currency";

/**
 * 访客看到的币种。服务端渲染和首次水合一律是 USD（静态页面里的价格，搜索引擎看到的也是它），
 * 挂载后向 /api/currency 取按国家决定的币种，再切换显示——和结账路由用的是同一个判断函数，所以显示什么就扣什么。
 * 模块级单例：整个页面只请求一次，所有价格组件共享。
 */
const STORAGE_KEY = "belle_currency";

let current: CurrencyCode = "USD";
let started = false;
const listeners = new Set<() => void>();

function setCurrent(next: CurrencyCode) {
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  // 先用本次会话里上次取到的结果，减少非 USD 访客换页后价格闪一下
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (isCurrencyCode(saved)) setCurrent(saved);
  } catch {
    /* sessionStorage 不可用时忽略 */
  }
  fetch("/api/currency", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { currency?: unknown } | null) => {
      if (!data || !isCurrencyCode(data.currency)) return;
      setCurrent(data.currency);
      try {
        sessionStorage.setItem(STORAGE_KEY, data.currency);
      } catch {
        /* 忽略 */
      }
    })
    .catch(() => {
      /* 取不到就保持 USD，不影响购买 */
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 非 Hook 场景（比如发起结算时上报 GA）读取当前展示币种 */
export function getCurrentCurrency(): CurrencyCode {
  return current;
}

export function useCurrency(): CurrencyCode {
  useEffect(() => {
    start();
  }, []);
  // 服务端快照恒为 USD：水合时和服务端 HTML 一致，不会触发不一致警告
  return useSyncExternalStore(subscribe, () => current, () => "USD" as CurrencyCode);
}

/** 当前币种下的价格格式化：money("weeklyIntro") → "$1.99" / "€2.19" / "¥350" */
export function usePrices() {
  const currency = useCurrency();
  return useMemo(() => ({ currency, money: (spec: PriceSpec) => resolvePrice(currency, spec) }), [currency]);
}
