import { NextRequest, NextResponse } from "next/server";
import { resolveBuyerCurrency } from "@/lib/currency-server";

/**
 * 当前访客该看哪种币种的价格（按 IP 国家）。
 * 价格页是静态页面（2300+ 页的站点不能在页面里读请求头把它变成动态渲染），所以由客户端挂载后来这里取。
 * 结果因人而异，绝不能被 CDN / 浏览器共享缓存。
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { currency: resolveBuyerCurrency(req.headers) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
