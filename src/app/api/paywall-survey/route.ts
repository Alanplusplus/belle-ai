import { NextRequest, NextResponse } from "next/server";
import { LOCALES } from "@/lib/constants";

/**
 * 付费弹窗退出调查 → 后端落库的服务端代理。
 * 后端要求 Bearer 令牌（只信这个代理），并校验 userId 是真实账号、同一用户同一天只留一条；
 * 这里只做字段形状校验：原因必须是四个固定选项之一，场景 / 方案只收短的受限字符串。
 */
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN;

const REASONS = ["price", "enough", "accuracy", "looking"];
const TAG_RE = /^[\w.\-/:+ ]{1,32}$/;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason : "";
  if (!userId || userId.length > 64 || !REASONS.includes(reason)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const source = typeof body.source === "string" && TAG_RE.test(body.source) ? body.source : null;
  const offer = typeof body.offer === "string" && TAG_RE.test(body.offer) ? body.offer : null;
  const locale = LOCALES.includes(body.locale as (typeof LOCALES)[number]) ? (body.locale as string) : "en";

  if (!API_TOKEN) {
    console.warn("BELLE_API_TOKEN not configured, paywall survey not saved");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    const res = await fetch(`${API_BASE}/common/v1/web/paywall-survey`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, reason, source, offer, locale }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as { code?: number };
    const ok = data.code === 200;
    return NextResponse.json({ ok }, { status: ok ? 200 : data.code === 404 || data.code === 400 ? 400 : 502 });
  } catch (err) {
    console.warn("save paywall survey failed:", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
