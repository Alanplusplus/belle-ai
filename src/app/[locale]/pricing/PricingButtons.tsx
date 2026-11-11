"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ProductKey } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout";
import { InAppCheckoutEmailStep } from "@/components/InAppBrowserNotice";
import { detectInAppBrowser } from "@/lib/inAppBrowser";

/** /pricing 页的付费漏斗第一步：进入定价页记一次 view_pricing */
export function PricingViewTracker() {
  useEffect(() => {
    trackEvent("view_pricing", { source: "pricing_page", surface: "page", offer: "kit" });
  }, []);
  return null;
}

interface Props {
  product: ProductKey;
  /** 按钮文案。价格会随访客所在地换币种，所以由服务端传一个会自己取币种的节点，而不是写死的字符串 */
  label: ReactNode;
  /** primary：整页主推的实心按钮；outline：次要商品（积分包）的描边按钮，别和主推抢视线 */
  variant?: "primary" | "outline";
}

const BUTTON_STYLE = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  outline: "border border-primary bg-transparent text-primary hover:bg-primary/5",
} as const;

export function PricingButtons({ product, label, variant = "primary" }: Props) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [inAppWarn, setInAppWarn] = useState(false);

  const handleClick = async (confirmedInApp = false, email?: string) => {
    // 「保存购买」步骤里点继续会再调一次本函数，这次不重复记点击
    if (!confirmedInApp) trackEvent("pricing_cta_clicked", { product });
    // 在 Instagram / TikTok 等内置浏览器里付款，回到系统浏览器后可能看不到已购内容：
    // 先出「保存购买」步骤（填邮箱，可跳过），之后用同一个邮箱的 Google 账号登录就能找回
    const inApp = detectInAppBrowser();
    if (inApp && !confirmedInApp) {
      trackEvent("inapp_checkout_warned", { product, source: "pricing_page", app: inApp });
      setInAppWarn(true);
      return;
    }
    setInAppWarn(false);
    setLoading(true);
    setError(false);
    try {
      await startCheckout({
        product,
        source: "pricing_page",
        locale,
        ...(email ? { email } : {}),
        onRestore: () => setLoading(false),
      });
      // 成功后页面会整页跳转到支付页，保持 loading 状态
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => handleClick()}
        disabled={loading}
        className={`mt-6 block min-h-12 w-full rounded-full py-3 text-center text-sm font-semibold transition disabled:opacity-50 ${BUTTON_STYLE[variant]}`}
      >
        {loading ? <LoadingDots /> : label}
      </button>
      {inAppWarn && <InAppCheckoutEmailStep onContinue={(email) => handleClick(true, email)} />}
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-red-500">
          {t("checkoutError")}
        </p>
      )}
    </>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}
