import { NextRequest, NextResponse } from "next/server";
import { Creem } from "creem";
import { auth } from "@/lib/auth";
import { CREEM_PRODUCTS, SITE_URL, type CreemProductKey } from "@/lib/constants";

const creem = new Creem({ apiKey: process.env.CREEM_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleId = (session?.user as any)?.googleId;
    if (!googleId || !session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { product } = (await req.json()) as { product: CreemProductKey };

    const productId = CREEM_PRODUCTS[product];
    if (!productId) {
      return NextResponse.json(
        { error: "Invalid product" },
        { status: 400 }
      );
    }

    const checkout = await creem.checkouts.create({
      productId,
      successUrl: `${SITE_URL}/en/payment/success`,
      requestId: googleId,
    });

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
