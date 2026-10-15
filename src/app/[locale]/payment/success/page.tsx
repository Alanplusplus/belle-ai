import { permanentRedirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// 结算成功后 Waffo 实际回到 /try?checkout=success，由 /try 轮询权益到账状态。
// 这个独立的成功页没有任何入口，保留路由只是为了让旧地址不 404，直接永久跳到 /try。
export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(locale === routing.defaultLocale ? "/try" : `/${locale}/try`);
}
