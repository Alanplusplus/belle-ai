import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * 锁定的色彩报告上「把结果发到我的邮箱」→ 后端发预览邮件的服务端代理。
 * 后端要求 Bearer 令牌（只信这个代理，否则任何人都能让我们往任意邮箱发信），并会校验 userId 确实拥有这份已生成的报告、
 * 报告确实还锁着，邮件内容只取锁定状态下用户本来就能看到的部分；频率限制（每个邮箱 / 每个用户）也在后端。
 * 这里只做字段形状校验，并判定邮箱来源：只有和服务端校验过的 Google 登录邮箱一致的才算 signed_in。
 */
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 报告语言代码（和 color-report 的 REPORT_LANGUAGES 一致），决定整封邮件用哪种语言 */
const LANGUAGES = ["en", "zh-Hans", "ja", "ko", "es", "fr", "de", "ru", "tr"];

async function resolveEmailSource(email: string): Promise<"signed_in" | "user_supplied"> {
  try {
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verified = (session?.user as any)?.verifiedEmail as string | undefined;
    return verified && verified.toLowerCase() === email.toLowerCase() ? "signed_in" : "user_supplied";
  } catch {
    return "user_supplied";
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const taskId = typeof body.taskId === "string" ? body.taskId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const language = typeof body.language === "string" && LANGUAGES.includes(body.language) ? body.language : "en";
  if (!userId || userId.length > 64 || !taskId || taskId.length > 128 || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  if (!API_TOKEN) {
    console.warn("BELLE_API_TOKEN not configured, report email not sent");
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }

  try {
    const res = await fetch(`${API_BASE}/common/v1/web/email/report-preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        task_id: taskId,
        email,
        email_source: await resolveEmailSource(email),
        language,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as { code?: number; data?: { status?: string } };
    switch (data.code) {
      case 200:
        return NextResponse.json({ ok: true, status: data.data?.status ?? "sent" });
      case 409:
        // 这份报告已经解锁：不需要预览邮件
        return NextResponse.json({ ok: false, reason: "unlocked" }, { status: 409 });
      case 429:
        return NextResponse.json({ ok: false, reason: "limit" }, { status: 429 });
      case 400:
      case 404:
        return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
      case 503:
        return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
      default:
        return NextResponse.json({ ok: false, reason: "error" }, { status: 502 });
    }
  } catch (err) {
    console.warn("send report email failed:", err);
    return NextResponse.json({ ok: false, reason: "error" }, { status: 502 });
  }
}
