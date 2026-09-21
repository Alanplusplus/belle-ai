"use client";

import { useState } from "react";
import type { PaddlePriceKey } from "@/lib/constants";
import { PADDLE_PRICES } from "@/lib/constants";
import { trackEvent, trackCheckoutEvent } from "@/lib/analytics";
import { getCachedUserId, webInit } from "@/lib/api";
import { getPaddle } from "@/lib/paddle-client";

interface Props {
  product: PaddlePriceKey;
  variant: "primary" | "outline" | "small";
  label: string;
}

export function PricingButtons({ product, variant, label }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    trackEvent("pricing_cta_clicked", { product, variant });
    trackCheckoutEvent("checkout_started", { product, source: "pricing_page" });
    setLoading(true);
    try {
      let userId = getCachedUserId();
      if (!userId) {
        const initRes = await webInit();
        if (initRes.code === 200 && initRes.data) {
          userId = initRes.data.user_id;
        }
      }
      if (!userId) {
        alert("Please try again.");
        return;
      }

      const paddle = await getPaddle();
      if (!paddle) {
        alert("Payment system loading, please try again.");
        return;
      }

      const priceId = PADDLE_PRICES[product];
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { userId },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          successUrl: `${window.location.origin}/en/payment/success`,
        },
      });

      trackCheckoutEvent("checkout_opened", { product, source: "pricing_page" });
    } catch {
      trackCheckoutEvent("checkout_failed", { product, error: "paddle_error" });
      alert("Failed to open checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "primary") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="mt-6 block w-full rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
      >
        {loading ? <LoadingDots /> : label}
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="mt-6 block w-full rounded-full border border-primary py-2.5 text-center text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
      >
        {loading ? <LoadingDots /> : label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
    >
      {loading ? <LoadingDots /> : label}
    </button>
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
