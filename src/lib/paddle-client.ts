"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | null = null;
let paddlePromise: Promise<Paddle | null> | null = null;

export function getPaddle(): Promise<Paddle | null> {
  if (paddleInstance) return Promise.resolve(paddleInstance);
  if (paddlePromise) return paddlePromise;

  paddlePromise = initializePaddle({
    token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "sandbox" : "production",
  }).then((p) => {
    paddleInstance = p ?? null;
    return paddleInstance;
  });

  return paddlePromise;
}
