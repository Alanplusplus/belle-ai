"use client";

import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";
import type { ReactNode } from "react";

// 给个别页面补充客户端文案命名空间。
// layout 里的 CLIENT_NAMESPACES 会被复制进全站每一个静态页面，只有少数页面才用到的命名空间
// （报告、买前扫一扫）放在这里按页面注入，避免撑大 2300+ 个页面的构建产物。
export function ExtraMessages({
  messages,
  children,
}: {
  messages: Record<string, unknown>;
  children: ReactNode;
}) {
  const parent = useMessages();
  const locale = useLocale();
  return (
    <NextIntlClientProvider locale={locale} messages={{ ...parent, ...messages }}>
      {children}
    </NextIntlClientProvider>
  );
}
