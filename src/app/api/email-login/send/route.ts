import { NextRequest, NextResponse } from "next/server";

/**
 * 邮箱验证码登录 → 让后端给这个邮箱发一封 6 位验证码的服务端代理。
 * 后端只认 Bearer 令牌（否则任何人都能让我们往任意邮箱发信），并负责所有限频（同一邮箱冷却 / 每小时上限、每 IP 上限、全站上限）。
 * 这里只做字段形状校验，并把访客 IP 带给后端用来限频（取自服务端收到的请求头，不是客户端自己传的）。
 * 验证码的校验不在这里：它在 NextAuth 的 email-code provider（lib/auth.ts）里，校验通过才会建立登录会话。
 */
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALES = ["en", "zh", "ja", "ko", "es", "fr", "de", "ru", "tr"];

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const locale = typeof body.locale === "string" && LOCALES.includes(body.locale) ? body.locale : "en";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  if (!API_TOKEN) {
    console.warn("BELLE_API_TOKEN not configured, login code not sent");
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }

  try {
    const res = await fetch(`${API_BASE}/common/v1/web/email/login-code`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale, client_ip: clientIp(req) }),
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
    const data = (await res.json().catch(() => ({}))) as { code?: number; data?: { retry_after?: number } };
    switch (data.code) {
      case 200:
        return NextResponse.json({ ok: true });
      case 400:
        return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
      case 429:
        return NextResponse.json(
          { ok: false, reason: "limit", retryAfter: data.data?.retry_after ?? null },
          { status: 429 },
        );
      case 503:
        return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
      default:
        return NextResponse.json({ ok: false, reason: "error" }, { status: 502 });
    }
  } catch (err) {
    console.warn("send login code failed:", err);
    return NextResponse.json({ ok: false, reason: "error" }, { status: 502 });
  }
}
