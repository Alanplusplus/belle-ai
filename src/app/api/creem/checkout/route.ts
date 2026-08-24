import { NextRequest, NextResponse } from "next/server";
import { Creem } from "creem";
import { CREEM_PRODUCTS, FIRST_MONTH_DISCOUNT_CODE, CREDITS5_FIRST_BUY_DISCOUNT_CODE, SITE_URL, type CreemProductKey } from "@/lib/constants";

const creem = new Creem({ apiKey: process.env.CREEM_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { product, discountCode, userId } = (await req.json()) as {
      product: CreemProductKey;
      discountCode?: string;
      userId?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const productId = CREEM_PRODUCTS[product];
    if (!productId) {
      return NextResponse.json(
        { error: "Invalid product" },
        { status: 400 }
      );
    }

    const checkoutParams: Parameters<typeof creem.checkouts.create>[0] = {
      productId,
      successUrl: `${SITE_URL}/en/payment/success`,
      requestId: userId,
    };

    if (discountCode) {
      checkoutParams.discountCode = discountCode;
    } else if (product === "monthly") {
      checkoutParams.discountCode = FIRST_MONTH_DISCOUNT_CODE;
    } else if (product === "credits5") {
      checkoutParams.discountCode = CREDITS5_FIRST_BUY_DISCOUNT_CODE;
    }

    const checkout = await creem.checkouts.create(checkoutParams);

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
