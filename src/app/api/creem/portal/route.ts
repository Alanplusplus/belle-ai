import { NextResponse } from "next/server";
import { Creem } from "creem";
import { auth } from "@/lib/auth";

const creem = new Creem({ apiKey: process.env.CREEM_API_KEY! });

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const customer = await creem.customers.retrieve(undefined, email);
    const links = await creem.customers.generateBillingLinks({
      customerId: customer.id,
    });

    return NextResponse.json({ portalUrl: links.customerPortalLink });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal link failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
