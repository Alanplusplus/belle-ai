"use client";

import { useState } from "react";
import type { ProductKey } from "@/lib/constants";
import { trackEvent, trackCheckoutEvent } from "@/lib/analytics";
import { getCachedUserId, webInit } from "@/lib/api";

interface Props {
  product: ProductKey;
  variant: "primary" | "outline" | "small";
  label: string;
}

async function openCheckout(product: ProductKey, userId: string, email?: string) {
  const res = await fetch("/api/waffo/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product, userId, email }),
  });
  const data = await res.json();
  if (!res.ok || !data.checkoutUrl) {
    throw new Error(data.error || "Checkout failed");
  }
  window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
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

      await openCheckout(product, userId);
      trackCheckoutEvent("checkout_opened", { product, source: "pricing_page" });
    } catch {
      trackCheckoutEvent("checkout_failed", { product, error: "waffo_error" });
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
