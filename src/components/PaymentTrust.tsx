"use client";

import { useTranslations } from "next-intl";

/**
 * 付款前最后一眼的支付信任信息，放在购买按钮附近（价格页卡片下方、价格弹窗里）。
 * 只写可核实的事实：结账在 Waffo 托管页面完成，卡号不经过本站；
 * Visa / Mastercard / Apple Pay / Google Pay 是 Waffo 文档列出的买家支付方式，具体可用项取决于设备和地区。
 */
export function PaymentTrust({ className = "" }: { className?: string }) {
  const t = useTranslations("pricing");
  return (
    <div className={`flex flex-col items-center gap-1 text-center ${className}`}>
      <p className="text-xs font-medium text-foreground">
        {/* 图标和文字同行内联：窄屏换行后图标仍跟着第一行文字，不会孤零零贴在最左边 */}
        <svg className="mr-1.5 inline-block h-3.5 w-3.5 align-[-2px] text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <span>{t("payTrustSecure")}</span>
      </p>
      <p className="text-xs text-muted-foreground">{t("payTrustMethods")}</p>
    </div>
  );
}
