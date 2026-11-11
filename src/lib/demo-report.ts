"use client";

import { useEffect, useState } from "react";
import type { ColorReportData } from "./color-report";
import { personaBase, type DemoPersonaId } from "./demo-personas";

/**
 * 示例人物的色彩报告（public/demo/personas/<id>/report.json，9 种语言的文案都带了）。
 * 按需读取并缓存：6 位人物的报告不打进页面脚本里，只取当前要展示的这一份。
 */
const cache = new Map<DemoPersonaId, Promise<ColorReportData | null>>();

export function loadDemoReport(id: DemoPersonaId): Promise<ColorReportData | null> {
  let pending = cache.get(id);
  if (!pending) {
    pending = fetch(`${personaBase(id)}/report.json`)
      .then((res) => (res.ok ? (res.json() as Promise<ColorReportData>) : null))
      .catch(() => null);
    cache.set(id, pending);
    // 失败不缓存，下次还能再试
    pending.then((report) => {
      if (!report) cache.delete(id);
    });
  }
  return pending;
}

export interface DemoPersonaData {
  id: DemoPersonaId;
  report: ColorReportData;
}

/**
 * 读取示例人物的报告。换人时新报告到之前继续返回上一位的数据（id 跟着数据走），
 * 页面不会闪成空白；用返回的 id 去取头像 / 自拍，图文就始终是同一个人。
 */
export function useDemoPersonaData(id: DemoPersonaId): DemoPersonaData | null {
  const [data, setData] = useState<DemoPersonaData | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDemoReport(id).then((report) => {
      if (!cancelled && report) setData({ id, report });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return data;
}
