"use client";

import { useSyncExternalStore } from "react";
import { DEV_UNLOCK_COOKIE } from "@/lib/dev-unlock";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function isOn() {
  return document.cookie.split("; ").includes(`${DEV_UNLOCK_COOKIE}=1`);
}

function DevToggle() {
  const on = useSyncExternalStore(subscribe, isOn, () => false);

  const toggle = () => {
    document.cookie = on
      ? `${DEV_UNLOCK_COOKIE}=; path=/; max-age=0; samesite=lax`
      : `${DEV_UNLOCK_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    listeners.forEach((l) => l());
    // 已经拿到的报告是按旧状态返回的，刷新一次重新取
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="仅本地开发可见。需要后端用 DEV_UNLOCK_REPORTS=1 启动。"
      className={`fixed bottom-4 left-16 z-[60] flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg transition ${
        on ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-border bg-white text-muted-foreground"
      }`}
    >
      <span className="rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">DEV</span>
      完整报告
      <span className={`relative h-4 w-7 rounded-full transition ${on ? "bg-emerald-500" : "bg-foreground/20"}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${on ? "left-3.5" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/** 只在 next dev 里渲染；生产构建里整个组件什么都不输出 */
export function DevUnlockToggle() {
  if (process.env.NODE_ENV !== "development") return null;
  return <DevToggle />;
}
