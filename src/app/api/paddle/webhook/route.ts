import { NextRequest, NextResponse } from "next/server";
import { Paddle, Environment, EventName } from "@paddle/paddle-node-sdk";
import { CREDITS_MAP, SUBSCRIPTION_PRICES, determinePlan } from "@/lib/constants";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? Environment.sandbox : Environment.production,
});

const WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN!;
const FEISHU_WEBHOOK_URL =
  "https://open.feishu.cn/open-apis/bot/v2/hook/8bfecb84-d551-422e-b0c4-93a93651ed3a";

async function callBackend(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

const EVENT_LABELS: Record<string, string> = {
  [EventName.TransactionCompleted]: "💰 交易完成",
  [EventName.SubscriptionCreated]: "✅ 订阅创建",
  [EventName.SubscriptionUpdated]: "🔄 订阅更新",
  [EventName.SubscriptionCanceled]: "❌ 订阅取消",
  [EventName.SubscriptionPastDue]: "⚠️ 付款逾期",
  [EventName.SubscriptionPaused]: "⏸️ 订阅暂停",
  [EventName.SubscriptionResumed]: "▶️ 订阅恢复",
};

function extractPriceId(eventData: Record<string, unknown>): string | null {
  const items = eventData.items as Array<{ price?: { id?: string } }> | undefined;
  if (items && items.length > 0) {
    return items[0]?.price?.id || null;
  }
  return null;
}

function extractUserId(eventData: Record<string, unknown>): string | null {
  const customData = eventData.customData as Record<string, string> | undefined;
  return customData?.userId || null;
}

async function notifyFeishu(eventType: string, userId: string | null, eventData: Record<string, unknown>) {
  const label = EVENT_LABELS[eventType] || eventType;
  const priceId = extractPriceId(eventData);
  const plan = priceId ? determinePlan(priceId) : null;
  const status = (eventData.status as string) || "";

  const lines = [
    label,
    `用户: ${userId || "unknown"}`,
    `状态: ${status}`,
  ];
  if (plan && plan !== "unknown") {
    lines.push(`套餐: ${plan}`);
  }
  if (priceId) {
    lines.push(`Price: ${priceId}`);
  }
  const eventId = (eventData.id as string) || "";
  if (eventId) {
    lines.push(`事件: ${eventId}`);
  }
  lines.push(`时间: ${new Date().toISOString()}`);

  try {
    await fetch(FEISHU_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "text",
        content: { text: lines.join("\n") },
      }),
    });
  } catch (e) {
    console.error("Feishu notify failed:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature") || "";

    let event;
    try {
      event = await paddle.webhooks.unmarshal(rawBody, WEBHOOK_SECRET, signature);
    } catch {
      console.error("Paddle webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!event) {
      return NextResponse.json({ error: "Failed to parse event" }, { status: 400 });
    }

    const eventType = event.eventType;
    const eventData = event.data as unknown as Record<string, unknown>;
    const userId = extractUserId(eventData);
    const priceId = extractPriceId(eventData);
    const eventId = (event as unknown as Record<string, unknown>).eventId as string || event.eventType;

    if (!userId) {
      console.error("Paddle webhook missing userId in customData:", eventType, eventId);
      await notifyFeishu(eventType, null, eventData);
      return NextResponse.json({ received: true, warning: "no user id" });
    }

    switch (eventType) {
      case EventName.TransactionCompleted: {
        if (priceId && CREDITS_MAP[priceId]) {
          await callBackend("/common/v1/web/add-credits", {
            user_id: userId,
            credits: CREDITS_MAP[priceId],
            order_id: eventId,
          });
        } else if (priceId && SUBSCRIPTION_PRICES.has(priceId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(priceId),
            status: "active",
            order_id: eventId,
            reset_quota: true,
          });
        }
        break;
      }

      case EventName.SubscriptionCreated: {
        if (priceId && SUBSCRIPTION_PRICES.has(priceId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(priceId),
            status: "active",
            order_id: eventId,
            reset_quota: true,
          });
        }
        break;
      }

      case EventName.SubscriptionUpdated: {
        const status = eventData.status as string;
        if (status === "active" && priceId && SUBSCRIPTION_PRICES.has(priceId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(priceId),
            status: "active",
            order_id: eventId,
          });
        } else if (status === "canceled") {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: "none",
            status: "inactive",
            order_id: eventId,
          });
        } else if (status === "paused") {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(priceId || ""),
            status: "inactive",
            order_id: eventId,
          });
        }
        break;
      }

      case EventName.SubscriptionCanceled: {
        await callBackend("/common/v1/web/set-subscription", {
          user_id: userId,
          plan: "none",
          status: "inactive",
          order_id: eventId,
        });
        break;
      }

      case EventName.SubscriptionPastDue: {
        console.warn("Subscription past due:", userId, eventId);
        break;
      }

      case EventName.SubscriptionPaused: {
        await callBackend("/common/v1/web/set-subscription", {
          user_id: userId,
          plan: determinePlan(priceId || ""),
          status: "inactive",
          order_id: eventId,
        });
        break;
      }

      case EventName.SubscriptionResumed: {
        if (priceId && SUBSCRIPTION_PRICES.has(priceId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(priceId),
            status: "active",
            order_id: eventId,
            reset_quota: true,
          });
        }
        break;
      }
    }

    await notifyFeishu(eventType, userId, eventData);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Paddle webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
