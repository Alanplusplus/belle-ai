import { NextResponse } from "next/server";

/**
 * 付费弹窗里「近期顾客选择了哪个方案」的真实统计代理。
 * 数字全部来自后端对真实购买记录的统计（样本量不够、占比不高时后端返回 plan = null，前端就什么都不显示），
 * 这里只负责带上令牌转发、校验返回值的形状，并做一层短缓存，避免每个访客打开弹窗都去查后端。
 */
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN;

const CACHE_MS = 10 * 60 * 1000;
const PLANS = ["weekly", "yearly", "pack", "pack30"] as const;
type PlanKey = (typeof PLANS)[number];
type PlanShare = { plan: PlanKey; percent: number } | { plan: null };

let cached: { at: number; value: PlanShare } | null = null;

function parse(data: unknown): PlanShare {
  const d = (data ?? {}) as { plan?: unknown; percent?: unknown };
  if (
    typeof d.plan === "string" &&
    (PLANS as readonly string[]).includes(d.plan) &&
    typeof d.percent === "number" &&
    Number.isInteger(d.percent) &&
    d.percent >= 1 &&
    d.percent <= 100
  ) {
    return { plan: d.plan as PlanKey, percent: d.percent };
  }
  return { plan: null };
}

export async function GET() {
  const headers = { "Cache-Control": "public, max-age=300" };
  if (cached && Date.now() - cached.at < CACHE_MS) return NextResponse.json(cached.value, { headers });
  if (!API_TOKEN) return NextResponse.json({ plan: null }, { headers });

  try {
    const res = await fetch(`${API_BASE}/common/v1/web/plan-share`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const json = (await res.json()) as { code?: number; data?: unknown };
    const value = json.code === 200 ? parse(json.data) : ({ plan: null } as PlanShare);
    cached = { at: Date.now(), value };
    return NextResponse.json(value, { headers });
  } catch (err) {
    console.warn("plan-share fetch failed:", err);
    // 取不到就不展示（不缓存失败结果，下次再试）
    return NextResponse.json({ plan: null }, { headers });
  }
}
