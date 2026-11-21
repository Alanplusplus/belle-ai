import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { HandoffClient } from "./HandoffClient";

// 令牌页：每个令牌都是一次性的动态页面，不静态化
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ for?: string | string[] }>;

/** ?for=item：从买前扫一扫发起的接力，手机上拍的是单品而不是自拍；其余一律按自拍处理 */
async function kindFrom(searchParams: SearchParams): Promise<"selfie" | "item"> {
  const { for: target } = await searchParams;
  return target === "item" ? "item" : "selfie";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const kind = await kindFrom(searchParams);
  const messages = (await import(`@/messages/${locale}.json`)).default;
  // 手机接力页是临时的个人页面：不让搜索引擎收录
  return {
    title: kind === "item" ? messages.tryPage.handoffItemPageTitle : messages.tryPage.handoffPageTitle,
    robots: { index: false, follow: false },
  };
}

export default async function HandoffPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: SearchParams;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  return <HandoffClient token={token} kind={await kindFrom(searchParams)} />;
}
