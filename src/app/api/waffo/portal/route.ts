import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWaffoClient } from "@/lib/waffo-client";

const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN;

/**
 * Waffo 官方客户门户的公共入口：用付款邮箱收一封登录链接（Magic Link）就能看到该邮箱下的订阅并取消。
 * 它按邮箱匹配订单，不依赖我们这边的账号，所以未登录 / 匿名付款 / 账号合并过的用户都能用，是最后的兜底。
 */
const PUBLIC_PORTAL_LOGIN_URL = "https://pancake.waffo.ai/consumer/portal/login";

/** 会话 token 不带环境，访问客户接口时必须显式指定；和 API Key 所属环境保持一致 */
const WAFFO_ENVIRONMENT = process.env.WAFFO_ENV === "test" ? "test" : "prod";

/**
 * 取出结算时用的 buyerIdentity。
 * 结算（/api/waffo/checkout）传给 Waffo 的 buyerIdentity 是 Belle 账号的 user_id，不是邮箱，
 * 而且只能来自服务端会话里的 googleId，不能信任浏览器传来的任何值（谁控制了它，谁就能进对方的门户）。
 */
async function fetchBuyerIdentity(googleId: string, email?: string | null): Promise<string | null> {
  if (!API_TOKEN) return null;
  const res = await fetch(`${API_BASE}/common/v1/web/google-signin`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ google_user_id: googleId, ...(email ? { email } : {}) }),
    signal: AbortSignal.timeout(5000),
  });
  const json = (await res.json()) as { code?: number; data?: { user_id?: string } };
  return json.code === 200 && json.data?.user_id ? json.data.user_id : null;
}

/**
 * 这个 identity 下在 Waffo 有没有订阅订单。
 * 先匿名付款、后来用已有的 Google 账号登录并合并时，账号 user_id 会变，但 Waffo 订单仍挂在旧的匿名 user_id 上，
 * 这时直接进门户只会看到空列表。查不到订阅就改走邮箱登录入口，别把用户送进一个空门户。
 * 返回 null 表示没查成功（网络 / 接口异常），调用方照常尝试直达。
 *
 * 注意：SDK 文档里示例的 `orders` 字段在客户 GraphQL 里并不存在，订阅订单要用 `subscriptionOrders`（已实测）。
 */
async function hasSubscriptionOrders(buyerIdentity: string): Promise<boolean | null> {
  try {
    const storeId = process.env.WAFFO_STORE_ID!;
    const client = getWaffoClient();
    const { token } = await client.auth.issueSessionToken({ storeId, buyerIdentity });
    const result = await client
      .customer(token, { environment: WAFFO_ENVIRONMENT })
      .graphql.query<{ subscriptionOrders: { id: string }[] }>({
        query: "query ($storeId: String!) { subscriptionOrders(storeId: $storeId, limit: 1) { id } }",
        variables: { storeId },
      });
    if (result.errors?.length || !result.data) {
      console.warn("Waffo portal: subscription lookup returned errors", result.errors?.map((e) => e.message));
      return null;
    }
    return result.data.subscriptionOrders.length > 0;
  } catch (err) {
    console.warn("Waffo portal: subscription lookup failed", err);
    return null;
  }
}

/** 解析要跳转的门户地址。任何一步出问题都退回公共登录入口，保证用户一定有地方取消订阅 */
async function resolvePortalUrl(): Promise<string> {
  try {
    const session = await auth();
    const user = session?.user as { googleId?: string; email?: string | null } | undefined;
    if (!user?.googleId) return PUBLIC_PORTAL_LOGIN_URL;

    const buyerIdentity = await fetchBuyerIdentity(user.googleId, user.email);
    if (!buyerIdentity) return PUBLIC_PORTAL_LOGIN_URL;

    if ((await hasSubscriptionOrders(buyerIdentity)) === false) return PUBLIC_PORTAL_LOGIN_URL;

    const { portalUrl } = await getWaffoClient().auth.createCustomerPortalLink({
      storeId: process.env.WAFFO_STORE_ID!,
      buyerIdentity,
    });
    return portalUrl;
  } catch (err) {
    // 只记错误，绝不能把 portalUrl 写进日志：它带的 #token 等同密码
    console.error("Waffo portal link failed, falling back to public login:", err);
    return PUBLIC_PORTAL_LOGIN_URL;
  }
}

/**
 * 「管理订阅」入口：跳到 Waffo Pancake 客户门户（查看订阅、取消、恢复）。
 * 已登录用户直接免验证进入自己的门户；其余用户进邮箱登录页。
 * 链接要在每次点击时现生成，所以页面上必须用普通 <a> 指向这里，不能用 next/link（预取会白白生成链接）。
 */
export async function GET() {
  const response = NextResponse.redirect(await resolvePortalUrl(), 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
