"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PURCHASE_RESTORED_EVENT } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

/**
 * 「购买已找回」提示：用户在内置浏览器（Instagram / TikTok 等）里付款后，换到 Safari / Chrome 用同一个邮箱的
 * Google 账号登录，后端会把那次购买合并进当前账号（见 api.ts 的 restored_purchases）。
 * 登录后的第一个页面不一定是 /try，所以做成全局组件，在任何页面都能告诉用户「购买回来了」。
 */
export function PurchaseRestoredToast() {
  const t = useTranslations("pricing");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: number | undefined;
    const onRestored = (e: Event) => {
      const count = Number((e as CustomEvent<number>).detail) || 0;
      if (count <= 0) return;
      trackEvent("purchase_restored", { accounts: count });
      setVisible(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setVisible(false), 8000);
    };
    window.addEventListener(PURCHASE_RESTORED_EVENT, onRestored);
    return () => {
      window.removeEventListener(PURCHASE_RESTORED_EVENT, onRestored);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[300] mx-auto max-w-md rounded-xl border border-primary/30 bg-background px-4 py-3 text-sm font-medium shadow-xl"
    >
      {t("purchaseRestored")}
    </div>
  );
}
