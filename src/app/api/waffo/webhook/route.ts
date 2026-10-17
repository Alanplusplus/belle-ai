import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@waffo/pancake-ts";
import { SUBSCRIPTION_PRODUCT_IDS, GA_MEASUREMENT_ID, CREDIT_PACKS, determinePlan, isPackProduct, type PackKey } from "@/lib/constants";

const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN!;
// 飞书机器人地址只从环境变量读取，不再在源码里留默认值；未配置时仅跳过通知，不影响权益同步
const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL;

type BackendResult = { code?: number; message?: string };

async function callBackend(path: string, body: unknown): Promise<BackendResult> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return { code: res.status, message: `HTTP ${res.status}` };
  }
  return (await res.json()) as BackendResult;
}

const EVENT_LABELS: Record<string, string> = {
  "order.completed": "💰 订单完成",
  "subscription.activated": "✅ 订阅激活",
  "subscription.payment_succeeded": "💳 订阅扣款成功",
  "subscription.renewed": "🔄 订阅续期",
  "subscription.recovered": "🩹 逾期已恢复",
  "subscription.canceling": "⏳ 订阅取消中(到期不续)",
  "subscription.uncanceled": "↩️ 取消已撤回",
  "subscription.canceled": "❌ 订阅已终止",
  "subscription.past_due": "⚠️ 付款逾期",
  "refund.succeeded": "💸 退款成功",
  "refund.failed": "❗ 退款失败",
};

/** 需要同步到后端权益系统的事件；其余事件只做飞书通知 */
const SYNCED_EVENTS = new Set([
  "subscription.activated",
  "subscription.payment_succeeded",
  "subscription.renewed",
  "subscription.recovered",
  "subscription.canceling",
  "subscription.uncanceled",
  "subscription.canceled",
  "subscription.past_due",
  "refund.succeeded",
]);

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toNumber(value: unknown): number {
  const n = parseFloat(str(value));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Waffo 的 webhook 载荷里没有 productId，所以套餐只能从下面几处推断：
 * 结算时写入的 orderMetadata.product → 载荷里的 productId(若有) → billingPeriod。
 */
function resolvePlan(data: Record<string, unknown>, metadata: Record<string, string>): string | null {
  if (metadata.product === "weekly" || metadata.product === "yearly") return metadata.product;

  const productId = str(data.productId);
  if (productId && SUBSCRIPTION_PRODUCT_IDS.has(productId)) {
    const plan = determinePlan(productId);
    if (plan !== "unknown") return plan;
  }

  const billingPeriod = str(data.billingPeriod);
  if (billingPeriod === "weekly" || billingPeriod === "yearly") return billingPeriod;
  return null;
}

/**
 * 服务端 GA4 purchase：用户在 Waffo 支付页付款后不会可靠地回到站点，浏览器端拿不到真实付费数据。
 * 这里用 Measurement Protocol 补发，并带上结算时保存的 client_id / session_id / UTM，
 * 让 GA 能把收入归到真实的流量渠道。需要配置环境变量 GA_API_SECRET，未配置时静默跳过。
 */
async function sendGaPurchase(
  eventKey: string,
  userId: string,
  plan: string | null,
  data: Record<string, unknown>,
  metadata: Record<string, string>,
) {
  const apiSecret = process.env.GA_API_SECRET;
  if (!apiSecret) return;

  const value = toNumber(data.chargedAmount);
  if (value <= 0) return;

  const currency = str(data.currency) || "USD";
  const sessionId = metadata.ga_sid ? Number(metadata.ga_sid) : undefined;

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${apiSecret}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: metadata.ga_cid || `server.${userId}`,
          user_id: userId,
          events: [
            {
              name: "purchase",
              params: {
                transaction_id: str(data.paymentId) || eventKey,
                value,
                currency,
                items: [
                  {
                    item_id: plan || "subscription",
                    item_name: str(data.productName) || plan || "subscription",
                    price: value,
                    quantity: 1,
                  },
                ],
                period_number: typeof data.periodNumber === "number" ? data.periodNumber : undefined,
                plan: plan || undefined,
                entry_source: metadata.source,
                campaign_source: metadata.utm_source,
                campaign_medium: metadata.utm_medium,
                campaign_name: metadata.utm_campaign,
                campaign_content: metadata.utm_content,
                referral_code: metadata.ref,
                // 没带 UTM 的自然流量（Pinterest、搜索、社媒）靠来源域名和落地页归因；
                // 需要在 GA4 里把这两个参数注册为事件级自定义维度才能在报表里按它们拆分
                referrer_host: metadata.referrer_host,
                landing_page: metadata.landing,
                ...(sessionId ? { session_id: sessionId, engagement_time_msec: 1 } : {}),
              },
            },
          ],
        }),
      },
    );
  } catch (e) {
    console.error("GA purchase send failed:", e);
  }
}

async function notifyFeishu(
  eventType: string,
  userId: string | null,
  data: Record<string, unknown>,
  extra: string[] = [],
) {
  const label = EVENT_LABELS[eventType] || eventType;
  const productName = str(data.productName);
  const charged = str(data.chargedAmount) || str(data.refundedAmount) || str(data.amount);
  const currency = str(data.currency);
  const periodNumber = data.periodNumber != null ? `第 ${str(data.periodNumber)} 期` : "";

  const lines = [
    label,
    `用户: ${userId || "unknown"}`,
    productName ? `商品: ${productName}` : null,
    charged ? `金额: ${currency} ${charged}` : null,
    periodNumber ? `周期: ${periodNumber}` : null,
    data.currentPeriodEnd ? `权益至: ${str(data.currentPeriodEnd)}` : null,
    ...extra,
    `时间: ${new Date().toISOString()}`,
  ].filter(Boolean) as string[];

  if (!FEISHU_WEBHOOK_URL) {
    console.warn("FEISHU_WEBHOOK_URL not configured, skip Feishu notify");
    return;
  }

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

/**
 * 一次性积分包订单：结算时 metadata.product 记为 "pack" / "pack30"，到账后按对应档位给用户发放积分包积分。
 * 幂等由后端按 order_id 保证；后端异常返回 500 让 Waffo 重试，避免付了钱没到账。
 * metadata 是我们自己的结算接口写入的（客户端改不了），所以档位可以信任它。
 */
async function handlePackOrder(
  eventType: string,
  eventKey: string,
  userId: string | null,
  orderId: string,
  packKey: PackKey,
  data: Record<string, unknown>,
  metadata: Record<string, string>,
): Promise<Response> {
  const packCredits = CREDIT_PACKS[packKey].credits;
  if (!userId || !orderId) {
    console.error("Waffo pack order missing userId/orderId:", orderId);
    await notifyFeishu(eventType, null, data, ["⚠️ 积分包订单缺少 userId 或 orderId,未发放积分,需人工核对"]);
    return NextResponse.json({ received: true, warning: "no user id" });
  }

  const result = await callBackend("/common/v1/web/add-credits", {
    user_id: userId,
    credits: packCredits,
    order_id: orderId,
    // 付款邮箱：后端记下，用户之后在系统浏览器用同一邮箱登录 Google 时可以找回购买
    buyer_email: str(data.buyerEmail) || null,
    // 下单时的站点语种：后端据此选付款后邮件的语言
    locale: metadata.locale || null,
  });
  const code = result.code ?? 500;

  if (code >= 500 || code === 403) {
    console.error("Backend add-credits failed:", orderId, result);
    await notifyFeishu(eventType, userId, data, [`❗ 积分包发放失败(将由 Waffo 重试): ${result.message || code}`]);
    return new Response("Backend processing failed", { status: 500 });
  }

  if (code === 404) {
    console.error("Backend add-credits: user not found", userId, orderId);
    await notifyFeishu(eventType, userId, data, ["⚠️ 后端找不到该用户,积分包未发放,需人工核对"]);
    return NextResponse.json({ received: true, warning: "user not found" });
  }

  if (result.message !== "Order already processed") {
    const attributionNote = [metadata.utm_source, metadata.utm_medium, metadata.utm_campaign, metadata.utm_content, metadata.source, metadata.referrer_host]
      .filter(Boolean)
      .join(" / ");
    await notifyFeishu(eventType, userId, data, [
      `积分包: +${packCredits} 积分`,
      ...(attributionNote ? [`来源: ${attributionNote}`] : []),
    ]);
    await sendGaPurchase(eventKey, userId, packKey, data, metadata);
  }
  return new Response("OK");
}

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

    const eventType = event.eventType;
    const data = event.data as unknown as Record<string, unknown>;
    const metadata = (data.orderMetadata ?? data.metadata ?? {}) as Record<string, string>;
    const userId = metadata.userId || str(data.merchantProvidedBuyerIdentity) || null;
    const orderId = str(data.orderId);

    // 一次性积分包：订阅链路之外单独处理（订阅首单也会触发 order.completed，所以必须看 metadata.product）
    if (eventType === "order.completed" && isPackProduct(metadata.product)) {
      return handlePackOrder(eventType, `${eventType}:${event.eventId || event.id}`, userId, orderId, metadata.product, data, metadata);
    }

    // 幂等由后端按 eventType:eventId 落库保证（多实例 / 重启都安全），这里不再用内存 Set
    if (!SYNCED_EVENTS.has(eventType)) {
      await notifyFeishu(eventType, userId, data);
      return new Response("OK");
    }

    if (!userId || !orderId) {
      console.error("Waffo webhook missing userId/orderId:", eventType, orderId);
      await notifyFeishu(eventType, null, data, ["⚠️ 缺少 userId 或 orderId,未同步权益,需人工核对"]);
      return NextResponse.json({ received: true, warning: "no user id" });
    }

    const refundedAmount = toNumber(data.refundedAmount);
    const originalCharged = toNumber(data.originalChargedAmount);

    const result = await callBackend("/common/v1/web/subscription-event", {
      event_key: `${eventType}:${event.eventId || event.id}`,
      event_type: eventType,
      user_id: userId,
      order_id: orderId,
      plan: resolvePlan(data, metadata),
      event_time: event.timestamp,
      period_start: str(data.currentPeriodStart) || null,
      period_end: str(data.currentPeriodEnd) || null,
      period_number: typeof data.periodNumber === "number" ? data.periodNumber : null,
      payment_id: str(data.paymentId) || null,
      charged_amount: str(data.chargedAmount) || null,
      refund_full: originalCharged > 0 && refundedAmount >= originalCharged,
      // 付款邮箱：后端记下，用户之后在系统浏览器用同一邮箱登录 Google 时可以找回购买
      buyer_email: str(data.buyerEmail) || null,
      // 下单时的站点语种：后端据此选付款后邮件的语言
      locale: metadata.locale || null,
    });

    const code = result.code ?? 500;

    // 后端异常 / 鉴权失败：返回 500 让 Waffo 重试，避免权益丢失
    if (code >= 500 || code === 403) {
      console.error("Backend subscription-event failed:", eventType, orderId, result);
      await notifyFeishu(eventType, userId, data, [`❗ 后端处理失败(将由 Waffo 重试): ${result.message || code}`]);
      return new Response("Backend processing failed", { status: 500 });
    }

    if (code === 404) {
      // 用户不存在：重试也不会成功，记录并通知人工处理
      console.error("Backend subscription-event: user not found", eventType, userId, orderId);
      await notifyFeishu(eventType, userId, data, ["⚠️ 后端找不到该用户,权益未同步,需人工核对"]);
      return NextResponse.json({ received: true, warning: "user not found" });
    }

    // 重复投递不再重复通知 / 重复上报
    if (result.message !== "Event already processed") {
      const attributionNote = [metadata.utm_source, metadata.utm_medium, metadata.utm_campaign, metadata.utm_content, metadata.source, metadata.referrer_host]
        .filter(Boolean)
        .join(" / ");
      await notifyFeishu(eventType, userId, data, [
        ...(result.message ? [`处理结果: ${result.message}`] : []),
        ...(attributionNote ? [`来源: ${attributionNote}`] : []),
      ]);

      if (eventType === "subscription.payment_succeeded") {
        await sendGaPurchase(
          `${eventType}:${event.eventId || event.id}`,
          userId,
          resolvePlan(data, metadata),
          data,
          metadata,
        );
      }
    }

    return new Response("OK");
  } catch (err) {
    console.error("Waffo webhook error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
