import { NextRequest, NextResponse } from "next/server";
import { LOCALES } from "@/lib/constants";
import { getBuyerCountry } from "@/lib/currency-server";

/**
 * 结果页的评分 / 留言 → 后端落库的服务端代理。
 * 后端要求 Bearer 令牌（只信这个代理），并会校验 userId 确实拥有这份已生成成功的报告，
 * 所以这里只做字段形状校验和长度限制；国家取自 IP（粗粒度），且只在用户勾选「允许展示」时才随请求发给后端。
 */
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN;

const COMMENT_MAX = 500;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const taskId = typeof body.taskId === "string" ? body.taskId.trim() : "";
  const rating = body.rating;
  if (!userId || userId.length > 64 || !taskId || taskId.length > 128 || !Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, COMMENT_MAX) : "";
  const allowDisplay = body.allowDisplay === true && comment.length > 0;
  const locale = LOCALES.includes(body.locale as (typeof LOCALES)[number]) ? (body.locale as string) : "en";

  if (!API_TOKEN) {
    console.warn("BELLE_API_TOKEN not configured, feedback not saved");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    const res = await fetch(`${API_BASE}/common/v1/web/feedback`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        task_id: taskId,
        rating,
        comment: comment || null,
        allow_display: allowDisplay,
        locale,
        country: allowDisplay ? getBuyerCountry(req.headers) : null,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as { code?: number };
    // 404 = 这份报告不属于该用户 / 还没生成成功：不是服务故障，让前端当作被拒绝
    const ok = data.code === 200;
    return NextResponse.json({ ok }, { status: ok ? 200 : data.code === 404 || data.code === 400 ? 400 : 502 });
  } catch (err) {
    console.warn("save feedback failed:", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
