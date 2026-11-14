import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@waffo/pancake-ts";
import { GA_MEASUREMENT_ID, packCreditsFor, reportCreditsFor } from "@/lib/constants";

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

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toNumber(value: unknown): number {
  const n = parseFloat(str(value));
  return Number.isFinite(n) ? n : 0;
}

/**
 * 服务端 GA4 purchase：用户在 Waffo 支付页付款后不会可靠地回到站点，浏览器端拿不到真实付费数据。
 * 这里用 Measurement Protocol 补发，并带上结算时保存的 client_id / session_id / UTM，
 * 让 GA 能把收入归到真实的流量渠道。需要配置环境变量 GA_API_SECRET；
 * 没配置时不再静默：写一条 warn 日志（部署平台的 Logs 里能搜到 GA_API_SECRET），方便发现「购买一直没上报」。
 *
 * 排查用：设置环境变量 GA_MP_DEBUG=1，会改走 GA 的校验接口 /debug/mp/collect（只校验、不入库），
 * 把 validationMessages 打到日志里；校验没有报错后再去掉它，才会真正写入 GA。
 */
async function sendGaPurchase(
  eventKey: string,
  userId: string,
  product: string | null,
  data: Record<string, unknown>,
  metadata: Record<string, string>,
  mode: string,
) {
  // Waffo 测试环境的订单不进 GA：否则测试付款会混进真实收入
  if (mode === "test") {
    console.log("GA purchase skipped: Waffo test-mode order", eventKey);
    return;
  }

  const apiSecret = process.env.GA_API_SECRET;
  if (!apiSecret) {
    console.warn("GA_API_SECRET is not configured: purchase NOT reported to GA", eventKey);
    return;
  }

  // chargedAmount 是实际扣款；渠道没返回时缺失，此时用 amount（Waffo 保证它回退到应收金额）
  const value = toNumber(data.chargedAmount) || toNumber(data.amount);
  if (value <= 0) {
    console.warn("GA purchase skipped: no positive charged amount", eventKey);
    return;
  }

  const currency = str(data.currency) || "USD";
  const sessionId = metadata.ga_sid ? Number(metadata.ga_sid) : undefined;
  const debug = process.env.GA_MP_DEBUG === "1";

  try {
    const res = await fetch(
      `https://www.google-analytics.com/${debug ? "debug/" : ""}mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${apiSecret}`,
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
                    item_id: product || "unknown",
                    item_name: str(data.productName) || product || "unknown",
                    price: value,
                    quantity: 1,
                  },
                ],
                plan: product || undefined,
                entry_source: metadata.source,
                campaign_source: metadata.utm_source,
                campaign_medium: metadata.utm_medium,
                campaign_name: metadata.utm_campaign,
                campaign_content: metadata.utm_content,
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
    // 正式接口不论成败都回 204，只有校验接口会返回详细问题；HTTP 层面失败（密钥错误等）也要留下痕迹
    if (!res.ok) {
      console.error("GA purchase HTTP error:", res.status, eventKey);
    } else if (debug) {
      console.log("GA purchase validation (GA_MP_DEBUG=1, not recorded):", eventKey, await res.text());
    } else {
      console.log("GA purchase sent:", eventKey, currency, value);
    }
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
 * 一次性积分商品订单：结算时 metadata.product 记为 "kit" / "addon"（停售前下的单还可能是 single / pack / pack30），
 * 到账后按商品给用户发放积分包积分（数量见 packCreditsFor）和报告额度（色彩报告单独购买，数量见 reportCreditsFor）。
 * 幂等由后端按 order_id 保证；后端异常返回 500 让 Waffo 重试，避免付了钱没到账。
 * metadata 是我们自己的结算接口写入的（客户端改不了），所以商品可以信任它。
 */
async function handlePackOrder(
  eventType: string,
  eventKey: string,
  userId: string | null,
  orderId: string,
  product: string,
  packCredits: number,
  reportCredits: number,
  data: Record<string, unknown>,
  metadata: Record<string, string>,
  mode: string,
): Promise<Response> {
  if (!userId || !orderId) {
    console.error("Waffo pack order missing userId/orderId:", orderId);
    await notifyFeishu(eventType, null, data, ["⚠️ 积分包订单缺少 userId 或 orderId,未发放积分,需人工核对"]);
    return NextResponse.json({ received: true, warning: "no user id" });
  }

  const result = await callBackend("/common/v1/web/add-credits", {
    user_id: userId,
    credits: packCredits,
    report_credits: reportCredits,
    order_id: orderId,
    // 买的是哪个商品：后端记在订单上，解锁报告时据此判断只买过单份报告还是买过套装
    product,
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
      `积分包: +${packCredits} 积分${reportCredits > 0 ? `, +${reportCredits} 份色彩报告` : ""}`,
      ...(attributionNote ? [`来源: ${attributionNote}`] : []),
    ]);
    await sendGaPurchase(eventKey, userId, product, data, metadata, mode);
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

    // 一次性商品（套装 / 加购包，停售前的单份 / 积分包）：按 metadata.product 发放积分和报告额度
    const packCredits = packCreditsFor(metadata.product);
    if (eventType === "order.completed" && packCredits != null) {
      return handlePackOrder(eventType, `${eventType}:${event.eventId || event.id}`, userId, orderId, metadata.product, packCredits, reportCreditsFor(metadata.product), data, metadata, event.mode);
    }

    // 网站已经没有订阅，也不再按退款回收权益：其余事件只发飞书通知，回 200 让 Waffo 不再重试。
    // Waffo 后台里如果还有没取消的老订阅，扣款事件会在这里露出来，需要人工去取消 / 退款
    await notifyFeishu(
      eventType,
      userId,
      data,
      eventType.startsWith("subscription.") ? ["⚠️ 网站已下线订阅，这个订阅没有对应的权益，请到 Waffo 后台确认是否需要取消 / 退款"] : [],
    );
    return new Response("OK");
  } catch (err) {
    console.error("Waffo webhook error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
