"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout";
import { WEEKLY_INTRO_PRICE } from "@/lib/constants";

/**
 * 手机上的吸底购买栏：用户滚过主推的 Weekly 卡片后，购买按钮仍然在拇指范围内。
 * Weekly 卡片本身在视口里时不显示，避免和卡片里的按钮重复。
 */
export function PricingStickyBar({ targetId }: { targetId: string }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    // 极老的浏览器没有 IntersectionObserver：不显示吸底栏，页面里自带的购买按钮仍然可用
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetId]);

  const handleClick = async () => {
    trackEvent("pricing_cta_clicked", { product: "weekly", variant: "sticky_bar" });
    setLoading(true);
    setError(false);
    try {
      await startCheckout({
        product: "weekly",
        source: "pricing_sticky_bar",
        locale,
        onRestore: () => setLoading(false),
      });
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/25 transition active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
          </span>
        ) : (
          t("weeklyCta", { price: WEEKLY_INTRO_PRICE })
        )}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-center text-xs text-red-500">
          {t("checkoutError")}
        </p>
      )}
    </div>
  );
}
