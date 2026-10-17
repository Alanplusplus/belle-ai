import { after, NextRequest, NextResponse } from "next/server";
import type { CashierLanguage } from "@waffo/pancake-ts";
import { auth } from "@/lib/auth";
import { getWaffoClient } from "@/lib/waffo-client";
import { WAFFO_PRODUCTS, LOCALES, type ProductKey } from "@/lib/constants";
import { resolveBuyerCurrency } from "@/lib/currency-server";
import { canonicalUrl } from "@/lib/seo";

const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN;

/**
 * 站点语种 → Waffo 结账页默认语言。Waffo 暂不支持 fr / de，这两个不传，由支付服务商按浏览器推断。
 * 结账页上用户仍可自己切换语言。
 * 注意：Waffo 文档写明「语言与币种不匹配会被支付服务商拒绝」，所以下面创建会话时失败会自动去掉 language 重试，
 * 不会因为语言配置问题让整单付不了款。币种按买家国家选（resolveBuyerCurrency），见 createSession。
 */
const CASHIER_LANGUAGE: Partial<Record<(typeof LOCALES)[number], CashierLanguage>> = {
  en: "en",
  zh: "zh-Hans",
  ja: "ja-JP",
  ko: "ko-KR",
  es: "es-MX",
  ru: "ru-RU",
  tr: "tr-TR",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 只接受格式合法的邮箱：用来预填付款页，同时让 webhook 带回邮箱，用于跨浏览器找回购买 */
function safeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v.length <= 254 && EMAIL_RE.test(v) ? v : undefined;
}

/** 只接受短字符串、字符集受限的归因字段，避免把任意用户输入写进订单 metadata */
function safeValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().slice(0, 64);
  return v && /^[\w.\-/:~ ]+$/.test(v) ? v : undefined;
}

/**
 * 邮箱来源：只有和「服务端校验过的 Google 登录邮箱」一致的才算 signed_in，其余（内置浏览器步骤里用户填的、
 * 浏览器里记住的）一律是 user_supplied。不信任客户端自己声明的来源。
 */
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

/**
 * 把「发起了一次结账」记到后端，供弃单提醒邮件使用（后端只对「发起后一段时间仍没付款」的记录发信）。
 * 在响应之后执行，不拖慢用户跳转到支付页；失败只记日志，绝不影响结账。
 */
async function reportCheckoutAttempt(payload: {
  sessionKey: string;
  userId: string;
  email: string;
  product: string;
  locale: string;
}): Promise<void> {
  if (!API_TOKEN) return;
  try {
    const emailSource = await resolveEmailSource(payload.email);
    const res = await fetch(`${API_BASE}/common/v1/web/email/checkout-started`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        session_key: payload.sessionKey,
        user_id: payload.userId,
        email: payload.email,
        email_source: emailSource,
        product: payload.product,
        locale: payload.locale,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn("report checkout attempt failed:", res.status);
  } catch (err) {
    console.warn("report checkout attempt error:", err);
  }
}

function buildMetadata(input: {
  userId: string;
  product: string;
  locale: string;
  source?: string;
  attribution?: Record<string, unknown>;
  gaClientId?: string;
  gaSessionId?: string;
}): Record<string, string> {
  // locale：webhook 把它转给后端，用来决定付款后邮件的语言
  const metadata: Record<string, string> = { userId: input.userId, product: input.product, locale: input.locale };
  const optional: Record<string, string | undefined> = {
    source: safeValue(input.source),
    utm_source: safeValue(input.attribution?.utm_source),
    utm_medium: safeValue(input.attribution?.utm_medium),
    utm_campaign: safeValue(input.attribution?.utm_campaign),
    utm_content: safeValue(input.attribution?.utm_content),
    ref: safeValue(input.attribution?.ref),
    referrer_host: safeValue(input.attribution?.referrer_host),
    landing: safeValue(input.attribution?.landing),
    // GA4 client_id 形如 1234567890.1700000000
    ga_cid: typeof input.gaClientId === "string" && /^\d{4,12}\.\d{4,12}$/.test(input.gaClientId) ? input.gaClientId : undefined,
    ga_sid: typeof input.gaSessionId === "string" && /^\d{6,12}$/.test(input.gaSessionId) ? input.gaSessionId : undefined,
  };
  for (const [key, value] of Object.entries(optional)) {
    if (value) metadata[key] = value;
  }
  return metadata;
}

export async function POST(req: NextRequest) {
  try {
    const { product, userId, email, locale, source, attribution, gaClientId, gaSessionId } = (await req.json()) as {
      product: ProductKey;
      userId?: string;
      email?: string;
      locale?: string;
      source?: string;
      attribution?: Record<string, unknown>;
      gaClientId?: string;
      gaSessionId?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const productDef = WAFFO_PRODUCTS[product];
    if (!productDef?.id) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const client = getWaffoClient();
    const safeLocale = (LOCALES.includes(locale as (typeof LOCALES)[number]) ? locale : "en") as (typeof LOCALES)[number];
    const buyerEmail = safeEmail(email);
    const language = CASHIER_LANGUAGE[safeLocale];
    // 按买家国家选币种：和价格页展示用的是同一个函数（/api/currency），显示什么币种就按什么币种扣款。
    // 只有环境变量 WAFFO_LOCAL_CURRENCIES 里列出的币种才会启用（Waffo 后台配好价格之前一律 USD）
    const currency = resolveBuyerCurrency(req.headers);

    // 注意：不要传 withTrial —— 首周优惠(试用天数 + 试用价)完全由 Waffo 后台的商品配置决定。
    // 必须保持 authenticated 结算(带 buyerIdentity)，平台的试用资格校验依赖买家身份。
    const baseParams = {
      productId: productDef.id,
      buyerIdentity: userId,
      // 预填付款页邮箱；付款后 webhook 的 buyerEmail 会带回来，后端据此支持跨浏览器找回购买
      ...(buyerEmail ? { buyerEmail } : {}),
      // 支付完成后用户点击 Done 才会跳转；必须是绝对 https 地址。回到 /try 后由前端轮询权益状态
      // 用规范 URL：默认语种 en 不带前缀，拼成 /en/try 会多一次 308 重定向，还产生重复 URL 信号
      successUrl: `${canonicalUrl(safeLocale, "/try")}?checkout=success`,
      // metadata 会原样出现在 webhook 的 orderMetadata 里：除了 userId / product，
      // 还带上来源归因，webhook 据此给 GA4 补发带来源的服务端 purchase 事件
      metadata: buildMetadata({ userId, product, locale: safeLocale, source, attribution, gaClientId, gaSessionId }),
    };

    // 创建会话的尝试顺序（失败就试下一个，宁可降级也不能让用户付不了款）：
    //   本地币种 + 语言 → 本地币种 → USD + 语言 → USD
    // 语言和币种不匹配会被拒；本地币种在商品上没配价格也会被拒（配置遗漏），此时退回 USD 并大声报错。
    const attempts: { currency: string; language?: CashierLanguage }[] = [];
    if (language) attempts.push({ currency, language });
    attempts.push({ currency });
    if (currency !== "USD") {
      if (language) attempts.push({ currency: "USD", language });
      attempts.push({ currency: "USD" });
    }

    let result: Awaited<ReturnType<typeof client.checkout.authenticated.create>> | undefined;
    let lastError: unknown;
    for (const attempt of attempts) {
      try {
        result = await client.checkout.authenticated.create({
          ...baseParams,
          currency: attempt.currency,
          ...(attempt.language ? { language: attempt.language } : {}),
        });
        if (attempt.currency !== currency) {
          console.error(
            `Waffo checkout fell back to ${attempt.currency}: ${currency} price missing on product ${product}? (WAFFO_LOCAL_CURRENCIES enabled it)`,
          );
        }
        break;
      } catch (err) {
        lastError = err;
        console.warn("Waffo checkout attempt failed, trying next:", attempt, err);
      }
    }
    if (!result) throw lastError ?? new Error("Checkout failed");

    // 只有拿到邮箱才有意义：没有邮箱就没法发提醒
    if (buyerEmail) {
      const sessionId = result.sessionId;
      after(() =>
        reportCheckoutAttempt({ sessionKey: sessionId, userId, email: buyerEmail, product, locale: safeLocale }),
      );
    }

    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("Waffo checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
