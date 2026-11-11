import { setRequestLocale } from "next-intl/server";
import {
  buildAlternates,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import type { Metadata } from "next";
import { ExtraMessages } from "@/components/ExtraMessages";
import { TryClient } from "./TryClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const title = messages.meta.tryTitle || "Try AI Analysis – Free";
  const description = messages.meta.tryDescription || messages.meta.homeDescription;
  const alternates = buildAlternates(locale, "/try");
  // 不写 openGraph / twitter 的话会整体继承 layout 的首页文案，分享出去的标题和 <title> 对不上
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
      images: OG_IMAGES,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: TWITTER_IMAGES,
    },
  };
}

export default async function TryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; sample?: string; persona?: string }>;
}) {
  const { locale } = await params;
  const { type, sample, persona } = await searchParams;
  setRequestLocale(locale);
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    // kit：付费弹窗 / 报告页里套装相关的文案（TryClient、ReportPanel、PricingModal 都在客户端取）。
    // 只在 /try 注入，不放进 layout 的 CLIENT_NAMESPACES（那个会被复制进全站每个静态页）
    <ExtraMessages messages={{ report: messages.report, kit: messages.kit }}>
      <TryClient locale={locale} initialType={type} initialPersona={persona} autoSample={sample === "1"} />
    </ExtraMessages>
  );
}
