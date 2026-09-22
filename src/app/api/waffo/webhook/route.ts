import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@waffo/pancake-ts";
import { CREDITS_MAP, SUBSCRIPTION_PRODUCT_IDS, determinePlan } from "@/lib/constants";

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
  "order.completed": "💰 订单完成",
  "subscription.activated": "✅ 订阅激活",
  "subscription.payment_succeeded": "🔄 订阅续费成功",
  "subscription.canceling": "⏳ 订阅取消中",
  "subscription.uncanceled": "↩️ 取消已撤回",
  "subscription.updated": "🔄 订阅更新",
  "subscription.canceled": "❌ 订阅已取消",
  "subscription.past_due": "⚠️ 付款逾期",
  "refund.succeeded": "💸 退款成功",
  "refund.failed": "❗ 退款失败",
};

async function notifyFeishu(eventType: string, userId: string | null, data: Record<string, unknown>) {
  const label = EVENT_LABELS[eventType] || eventType;
  const productName = (data.productName as string) || "";
  const amount = data.amount ?? data.total ?? "";
  const currency = (data.currency as string) || "";

  const lines = [
    label,
    `用户: ${userId || "unknown"}`,
    productName ? `商品: ${productName}` : null,
    amount ? `金额: ${currency} ${amount}` : null,
    `时间: ${new Date().toISOString()}`,
  ].filter(Boolean) as string[];

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

const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("x-waffo-signature");

    let event;
    try {
      event = verifyWebhook(body, sig, {
        ...(process.env.WAFFO_WEBHOOK_PUBLIC_KEY
          ? { publicKey: process.env.WAFFO_WEBHOOK_PUBLIC_KEY }
          : {}),
      });
    } catch {
      console.error("Waffo webhook signature verification failed");
      return new Response("Invalid signature", { status: 401 });
    }

    if (processedEvents.has(event.id)) {
      return new Response("OK");
    }
    processedEvents.add(event.id);
    if (processedEvents.size > 10000) {
      const first = processedEvents.values().next().value;
      if (first) processedEvents.delete(first);
    }

    const eventType = event.eventType;
    const data = event.data as Record<string, unknown>;
    const metadata = (data.orderMetadata ?? data.metadata ?? {}) as Record<string, string>;
    const userId = metadata.userId || null;
    const orderId = (data.orderId as string) || event.eventId || "";
    const productId = (data.productId as string) || "";

    if (!userId) {
      console.error("Waffo webhook missing userId in metadata:", eventType, orderId);
      await notifyFeishu(eventType, null, data);
      return NextResponse.json({ received: true, warning: "no user id" });
    }

    switch (eventType) {
      case "order.completed": {
        if (productId && CREDITS_MAP[productId]) {
          await callBackend("/common/v1/web/add-credits", {
            user_id: userId,
            credits: CREDITS_MAP[productId],
            order_id: orderId,
          });
        } else if (productId && SUBSCRIPTION_PRODUCT_IDS.has(productId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(productId),
            status: "active",
            order_id: orderId,
            reset_quota: true,
          });
        }
        break;
      }

      case "subscription.activated": {
        if (productId && SUBSCRIPTION_PRODUCT_IDS.has(productId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(productId),
            status: "active",
            order_id: orderId,
            reset_quota: true,
          });
        }
        break;
      }

      case "subscription.payment_succeeded": {
        if (productId && SUBSCRIPTION_PRODUCT_IDS.has(productId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(productId),
            status: "active",
            order_id: orderId,
            reset_quota: true,
          });
        }
        break;
      }

      case "subscription.updated": {
        if (productId && SUBSCRIPTION_PRODUCT_IDS.has(productId)) {
          await callBackend("/common/v1/web/set-subscription", {
            user_id: userId,
            plan: determinePlan(productId),
            status: "active",
            order_id: orderId,
          });
        }
        break;
      }

      case "subscription.canceling": {
        break;
      }

      case "subscription.canceled": {
        await callBackend("/common/v1/web/set-subscription", {
          user_id: userId,
          plan: "none",
          status: "inactive",
          order_id: orderId,
        });
        break;
      }

      case "subscription.past_due": {
        console.warn("Subscription past due:", userId, orderId);
        break;
      }
    }

    await notifyFeishu(eventType, userId, data);

    return new Response("OK");
  } catch (err) {
    console.error("Waffo webhook error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
