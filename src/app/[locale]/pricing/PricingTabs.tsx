"use client";

import { useState } from "react";

interface Props {
  labels: [string, string];
  children: [React.ReactNode, React.ReactNode];
}

export function PricingTabs({ labels, children }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-muted/50 p-1">
          {labels.map((label, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                active === i
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8">
        {children[active]}
      </div>
    </div>
  );
}
