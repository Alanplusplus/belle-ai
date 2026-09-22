import { NextRequest, NextResponse } from "next/server";
import { getWaffoClient } from "@/lib/waffo-client";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { action, orderId } = (await req.json()) as {
      action: "cancel" | "reactivate";
      orderId: string;
    };

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const client = getWaffoClient();
    const { token } = await client.auth.issueSessionToken({
      storeId: process.env.WAFFO_STORE_ID!,
      buyerIdentity: email,
    });

    const customer = client.customer(token);

    if (action === "cancel") {
      const result = await customer.cancelSubscription({ orderId });
      return NextResponse.json({ status: result.status });
    } else if (action === "reactivate") {
      await customer.reactivateSubscription({ orderId });
      return NextResponse.json({ status: "reactivated" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal action failed";
    console.error("Waffo portal error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
