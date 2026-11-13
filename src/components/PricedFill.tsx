"use client";

import { fillTemplate } from "@/lib/fill-template";
import { usePrices } from "@/lib/usePrices";
import type { PriceSpec } from "@/lib/currency";

/**
 * 一段带价格占位符的文案（服务端用 t.raw() 取出原文传进来）。
 * prices：占位符名 → 价格规格，渲染时换成当前币种的价格（服务端渲染和首次水合是 USD）；
 * values：不随币种变化的占位符，比如积分数、天数。
 * 和 PricedText 的区别：PricedText 只能读 kit 命名空间，并且要求客户端已有这份文案；
 * 这个组件只吃字符串，所以文案可以放在只在服务端用的命名空间里，不会撑大每个页面的客户端文案。
 */
export function PricedFill({
  template,
  prices,
  values,
}: {
  template: string;
  prices?: Record<string, PriceSpec>;
  values?: Record<string, string | number>;
}) {
  const { money } = usePrices();
  const resolved = Object.fromEntries(Object.entries(prices ?? {}).map(([name, spec]) => [name, money(spec)]));
  return <>{fillTemplate(template, { ...values, ...resolved })}</>;
}
