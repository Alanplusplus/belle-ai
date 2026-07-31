import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET!;
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN!;

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

function extractGoogleUserId(event: WebhookEvent): string | null {
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
    const googleUserId = extractGoogleUserId(event);

    if (!googleUserId) {
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
            google_user_id: googleUserId,
            credits: PRODUCT_CREDITS[productId],
            order_id: orderId,
          });
        } else if (productId && SUBSCRIPTION_PRODUCTS.has(productId)) {
          await callBackend("/common/v1/web/set-subscription", {
            google_user_id: googleUserId,
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
            google_user_id: googleUserId,
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
            google_user_id: googleUserId,
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
          google_user_id: googleUserId,
          plan: "none",
          status: "inactive",
          order_id: orderId,
        });
        break;
      }

      // 付款失败（重试中）— 暂时不动，Creem 会自动重试
      case "subscription.past_due": {
        console.warn("Subscription past due:", googleUserId, orderId);
        break;
      }

      // 用户请求取消但本期仍有效
      case "subscription.scheduled_cancel": {
        console.info("Subscription scheduled cancel:", googleUserId);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
