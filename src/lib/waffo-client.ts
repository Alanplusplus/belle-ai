import { WaffoPancake } from "@waffo/pancake-ts";

let client: WaffoPancake | null = null;

export function getWaffoClient(): WaffoPancake {
  if (!client) {
    client = new WaffoPancake({
      merchantId: process.env.WAFFO_MERCHANT_ID!,
      privateKey: process.env.WAFFO_PRIVATE_KEY!,
    });
  }
  return client;
}
