import { NextRequest, NextResponse } from "next/server";
import { getWaffoClient } from "@/lib/waffo-client";
import { WAFFO_PRODUCTS, LOCALES, type ProductKey } from "@/lib/constants";
import { canonicalUrl } from "@/lib/seo";

/** 只接受短字符串、字符集受限的归因字段，避免把任意用户输入写进订单 metadata */
function safeValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().slice(0, 64);
  return v && /^[\w.\-/:~ ]+$/.test(v) ? v : undefined;
}

function buildMetadata(input: {
  userId: string;
  product: string;
  source?: string;
  attribution?: Record<string, unknown>;
  gaClientId?: string;
  gaSessionId?: string;
}): Record<string, string> {
  const metadata: Record<string, string> = { userId: input.userId, product: input.product };
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
    const safeLocale = LOCALES.includes(locale as (typeof LOCALES)[number]) ? locale : "en";

    // 注意：不要传 withTrial —— 首周优惠(试用天数 + 试用价)完全由 Waffo 后台的商品配置决定。
    // 必须保持 authenticated 结算(带 buyerIdentity)，平台的试用资格校验依赖买家身份。
    const result = await client.checkout.authenticated.create({
      productId: productDef.id,
      currency: "USD",
      buyerIdentity: userId,
      ...(email ? { buyerEmail: email } : {}),
      // 支付完成后用户点击 Done 才会跳转；必须是绝对 https 地址。回到 /try 后由前端轮询权益状态
      // 用规范 URL：默认语种 en 不带前缀，拼成 /en/try 会多一次 308 重定向，还产生重复 URL 信号
      successUrl: `${canonicalUrl(safeLocale ?? "en", "/try")}?checkout=success`,
      // metadata 会原样出现在 webhook 的 orderMetadata 里：除了 userId / product，
      // 还带上来源归因，webhook 据此给 GA4 补发带来源的服务端 purchase 事件
      metadata: buildMetadata({ userId, product, source, attribution, gaClientId, gaSessionId }),
    });

    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("Waffo checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
