"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * 「近期顾客选择了哪个方案」的真实统计（见 /api/plan-share）：{ plan, percent }，没有足够数据时为 null。
 * 模块级单例：整个页面只请求一次，弹窗反复打开也不会重复请求；只在 enabled 时才发起请求，
 * 所以没打开付费弹窗的访客不会多一次网络请求。
 */
export type PlanShareKey = "weekly" | "yearly" | "pack" | "pack30";
export type PlanShare = { plan: PlanShareKey; percent: number } | null;

let current: PlanShare = null;
let started = false;
const listeners = new Set<() => void>();

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  fetch("/api/plan-share")
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { plan?: PlanShareKey | null; percent?: number } | null) => {
      if (!data || !data.plan || typeof data.percent !== "number") return;
      current = { plan: data.plan, percent: data.percent };
      listeners.forEach((listener) => listener());
    })
    .catch(() => {
      /* 取不到就不展示，不影响购买；下次刷新页面再试 */
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePlanShare(enabled: boolean): PlanShare {
  useEffect(() => {
    if (enabled) start();
  }, [enabled]);
  return useSyncExternalStore(subscribe, () => current, () => null);
}
