import { NextRequest, NextResponse } from "next/server";

/**
 * 前端结算事件 → 飞书通知的服务端中转。
 * 飞书机器人地址放在服务端环境变量里，不再打进前端 bundle；同时只允许白名单事件、限制字段长度，
 * 防止任何人拿这个接口向群里刷消息。
 */
const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL;

const ALLOWED_EVENTS: Record<string, { title: string; template: "green" | "orange" | "red" }> = {
  checkout_started: { title: "🛒 Checkout Started", template: "red" },
  checkout_completed: { title: "✅ Checkout Completed", template: "green" },
  checkout_failed: { title: "❌ Checkout Failed", template: "red" },
  checkout_cancelled: { title: "🚫 Checkout Cancelled", template: "orange" },
  // 结果页用户主动提交的评分与留言（不含照片）
  feedback_submitted: { title: "💬 Result Feedback", template: "green" },
};

const MAX_PARAMS = 12;
const MAX_VALUE_LEN = 120;

export async function POST(req: NextRequest) {
  try {
    const { event, params } = (await req.json()) as {
      event?: string;
      params?: Record<string, unknown>;
    };

    const meta = event ? ALLOWED_EVENTS[event] : undefined;
    if (!event || !meta) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // 未配置机器人地址时直接跳过，不在源码里留默认值
    if (!FEISHU_WEBHOOK_URL) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const lines = Object.entries(params ?? {})
      .filter(([, v]) => v !== undefined && v !== null && typeof v !== "object")
      .slice(0, MAX_PARAMS)
      .map(([k, v]) => `**${k.slice(0, 32)}:** ${String(v).slice(0, MAX_VALUE_LEN)}`)
      .join("\n");

    const time = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    const content = `**Event:** ${event}\n**Time:** ${time}\n${lines}`;

    await fetch(FEISHU_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "interactive",
        card: {
          header: { title: { content: meta.title, tag: "plain_text" }, template: meta.template },
          elements: [{ tag: "markdown", content }],
        },
      }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // 通知失败不应影响用户流程
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
