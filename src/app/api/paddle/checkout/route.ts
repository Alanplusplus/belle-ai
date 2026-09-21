import { NextRequest, NextResponse } from "next/server";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { PADDLE_PRICES, SITE_URL, type PaddlePriceKey } from "@/lib/constants";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? Environment.sandbox : Environment.production,
});

export async function POST(req: NextRequest) {
  try {
    const { product, userId, email } = (await req.json()) as {
      product: PaddlePriceKey;
      userId?: string;
      email?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const priceId = PADDLE_PRICES[product];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { userId },
      ...(email ? { customerEmail: email } : {}),
    });

    return NextResponse.json({
      transactionId: transaction.id,
      priceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("Paddle checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
