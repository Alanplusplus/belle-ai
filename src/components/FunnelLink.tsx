"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";

/**
 * 内容页（对比 / 季型 / 名人 / 脸型 / 引流页）通往 /try 的按钮：行为和普通站内链接一样，
 * 只是多记一条 funnel_cta_click，之后在 GA 里能按「哪一类页面、哪个入口（上传 / 先看示例）」看导流效果。
 */
export function FunnelLink({
  href,
  from,
  tool,
  kind,
  className,
  children,
}: {
  href: string;
  /** 来源页面类型，例如 compare / palette / celebrity */
  from: string;
  /** 目标工具类型 */
  tool: string;
  /** try = 直接去上传；sample = 先看示例 */
  kind: "try" | "sample";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent("funnel_cta_click", { from_page: from, tool, kind })}
    >
      {children}
    </Link>
  );
}
