"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import type { CreemProductKey } from "@/lib/constants";

interface Props {
  product: CreemProductKey;
  variant: "primary" | "outline" | "small";
  label: string;
}

export function PricingButtons({ product, variant, label }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (status !== "authenticated") {
      signIn("google");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Failed to create checkout");
      }
    } catch {
      alert("Network error. Please try again.");
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
