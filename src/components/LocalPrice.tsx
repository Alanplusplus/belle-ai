"use client";

import { useTranslations } from "next-intl";
import { usePrices } from "@/lib/usePrices";
import type { PriceSpec } from "@/lib/currency";

/** 一个价格（随访客所在地换币种）。服务端渲染出 USD，客户端挂载后按国家切换 */
export function LocalPrice({ spec }: { spec: PriceSpec }) {
  const { money } = usePrices();
  return <>{money(spec)}</>;
}

/**
 * 带价格的文案。prices 里每项是「占位符名 → 价格规格」，会先换成当前币种的格式化字符串再填进文案；
 * values 是不随币种变化的占位符（比如 credits）。
 * 给服务端组件（价格页）用：服务端组件自己拿不到访客币种，价格相关的文案交给它来渲染。
 */
export function PricedText({
  k,
  prices,
  values,
  namespace = "pricing",
}: {
  k: string;
  prices: Record<string, PriceSpec>;
  values?: Record<string, string | number>;
  namespace?: "pricing" | "tryPage";
}) {
  const t = useTranslations(namespace);
  const { money } = usePrices();
  const resolved = Object.fromEntries(Object.entries(prices).map(([name, spec]) => [name, money(spec)]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <>{(t as any)(k, { ...values, ...resolved })}</>;
}
