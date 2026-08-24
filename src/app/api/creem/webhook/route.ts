import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET!;
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN!;
const FEISHU_WEBHOOK_URL =
  "https://open.feishu.cn/open-apis/bot/v2/hook/8bfecb84-d551-422e-b0c4-93a93651ed3a";

function verifySignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

interface WebhookEvent {
  id: string;
  eventType: string;
  created_at: number;
  object: {
    id: string;
    object: string;
    product?: {
      id: string;
      name: string;
      billing_type: string;
      billing_period: string;
    };
    customer?: {
      id: string;
      email: string;
      name: string;
    };
    order?: {
      id: string;
    };
    subscription?: {
      id: string;
      status: string;
    };
    metadata?: Record<string, string>;
    request_id?: string;
  };
}

const PRODUCT_CREDITS: Record<string, number> = {
  [process.env.CREEM_PRODUCT_5CREDITS!]: 5,
  [process.env.CREEM_PRODUCT_12CREDITS!]: 12,
};

const SUBSCRIPTION_PRODUCTS = new Set([
  process.env.CREEM_PRODUCT_MONTHLY!,
  process.env.CREEM_PRODUCT_YEARLY!,
]);

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
  "checkout.completed": "💰 购买完成",
  "subscription.active": "✅ 订阅激活",
  "subscription.trialing": "🆓 试用开始",
  "subscription.paid": "💳 续费成功",
  "subscription.canceled": "❌ 订阅取消",
  "subscription.expired": "⏰ 订阅过期",
  "subscription.past_due": "⚠️ 付款逾期",
  "subscription.scheduled_cancel": "📅 计划取消",
};

async function notifyFeishu(event: WebhookEvent) {
  const label = EVENT_LABELS[event.eventType] || event.eventType;
  const user = event.object.customer;
  const product = event.object.product;
  const userId =
    event.object.request_id ||
    event.object.metadata?.referenceId ||
    event.object.metadata?.google_user_id ||
    "unknown";

  const lines = [
    `${label}`,
    `用户: ${user?.name || "N/A"} (${user?.email || "N/A"})`,
    `ID: ${userId}`,
  ];
  if (product) {
    lines.push(`产品: ${product.name} (${product.billing_type}/${product.billing_period})`);
  }
  lines.push(`订单: ${event.object.order?.id || event.object.id}`);
  lines.push(`时间: ${new Date(event.created_at * 1000).toISOString()}`);

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

function extractUserId(event: WebhookEvent): string | null {
  return (
    event.object.request_id ||
    event.object.metadata?.referenceId ||
    event.object.metadata?.google_user_id ||
    null
  );
}

function extractProductId(event: WebhookEvent): string | null {
  return event.object.product?.id || null;
}

function determinePlan(productId: string | null): string {
  if (productId === process.env.CREEM_PRODUCT_MONTHLY) return "monthly";
  if (productId === process.env.CREEM_PRODUCT_YEARLY) return "yearly";
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("creem-signature") || "";

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: WebhookEvent = JSON.parse(rawBody);
    const { eventType } = event;
    const userId = extractUserId(event);

    if (!userId) {
      console.error("Webhook missing user identifier:", eventType, event.id);
      return NextResponse.json({ received: true, warning: "no user id" });
    }

    const productId = extractProductId(event);
    const orderId = event.object.order?.id || event.object.id;

    switch (eventType) {
      // 首次购买完成
      case "checkout.completed": {
        if (productId && PRODUCT_CREDITS[productId]) {
          await callBackend("/common/v1/web/add-credits", {
            user_id: userId,
            credits: PRODUCT_CREDITS[productId],
            order_id: orderId,
          });
        } else if (productId && SUBSCRIPTION_PRODUCTS.has(productId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(productId),
            status: "active",
            order_id: orderId,
          });
        }
        break;
      }

      // 订阅激活（首次或恢复）
      case "subscription.active":
      case "subscription.trialing": {
        if (productId && SUBSCRIPTION_PRODUCTS.has(productId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(productId),
            status: "active",
            order_id: orderId,
          });
        }
        break;
      }

      // 续订扣费成功 — 重置月度配额
      case "subscription.paid": {
        if (productId && SUBSCRIPTION_PRODUCTS.has(productId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(productId),
            status: "active",
            order_id: orderId,
          });
        }
        break;
      }

      // 取消/过期 — 移除订阅权益
      case "subscription.canceled":
      case "subscription.expired": {
        await callBackend("/common/v1/web/set-subscription", {
          user_id: userId,
          plan: "none",
          status: "inactive",
          order_id: orderId,
        });
        break;
      }

      // 付款失败（重试中）— 暂时不动，Creem 会自动重试
      case "subscription.past_due": {
        console.warn("Subscription past due:", userId, orderId);
        break;
      }

      // 用户请求取消但本期仍有效
      case "subscription.scheduled_cancel": {
        console.info("Subscription scheduled cancel:", userId);
        break;
      }
    }

    await notifyFeishu(event);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
