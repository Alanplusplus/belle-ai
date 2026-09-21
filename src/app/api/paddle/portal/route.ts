import { NextResponse } from "next/server";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { auth } from "@/lib/auth";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? Environment.sandbox : Environment.production,
});

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const customers = paddle.customers.list({ email: [email] });
    const firstPage = await customers.next();

    if (!firstPage || firstPage.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customerId = firstPage[0].id;
    const authToken = await paddle.customers.generateAuthToken(customerId);

    const env = process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "sandbox" : "buyer-portal";
    const portalUrl = `https://${env}.paddle.com/subscriptions?auth_token=${authToken}`;

    return NextResponse.json({ portalUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal link failed";
    console.error("Paddle portal error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
