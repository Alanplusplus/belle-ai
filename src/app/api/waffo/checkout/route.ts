import { NextRequest, NextResponse } from "next/server";
import { getWaffoClient } from "@/lib/waffo-client";
import { WAFFO_PRODUCTS, SITE_URL, type ProductKey } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { product, userId, email } = (await req.json()) as {
      product: ProductKey;
      userId?: string;
      email?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const productDef = WAFFO_PRODUCTS[product];
    if (!productDef?.id) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const client = getWaffoClient();

    const result = await client.checkout.authenticated.create({
      productId: productDef.id,
      currency: "USD",
      buyerIdentity: userId,
      ...(email ? { buyerEmail: email } : {}),
      successUrl: `${SITE_URL}/en/payment/success`,
      metadata: { userId, product },
    });

    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("Waffo checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
