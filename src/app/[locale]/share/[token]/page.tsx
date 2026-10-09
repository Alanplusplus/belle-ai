import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import { fetchSharedReport } from "@/lib/share";
import { ogLocale } from "@/lib/seo";
import { ShareCtaButton, ShareLandingTracker } from "./ShareLanding";

// 每次访问都要实时签名图片 URL，不能静态化 / 缓存
export const dynamic = "force-dynamic";

// generateMetadata 与页面本体共用同一次后端读取，避免重复计数
const getReport = cache((token: string) => fetchSharedReport(token));

function imageUrlFor(locale: string, token: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}/share/${token}/image`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale, token } = await params;
  const report = await getReport(token);
  // 分享页含用户个人报告：任何情况下都不让搜索引擎收录
  const robots = { index: false, follow: false } as const;
  if (!report) return { robots };

  const t = await getTranslations({ locale, namespace: "sharePage" });
  const image = imageUrlFor(locale, token);

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots,
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      locale: ogLocale(locale),
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [image],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const report = await getReport(token);
  if (!report) notFound();

  const t = await getTranslations({ locale, namespace: "sharePage" });

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-10 text-center sm:py-14">
      <ShareLandingTracker referralCode={report.referralCode} type={report.type} />

      <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">{t("heading")}</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("subheading")}</p>

      {/* 报告图是首屏主内容：高优先级加载，加载前先占一块浅色底，避免内容突然下推 */}
      <div className="mt-6 min-h-[22rem] w-full overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={report.imageUrls[0]}
          alt={t("imageAlt")}
          className="h-auto w-full"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <ShareCtaButton referralCode={report.referralCode} type={report.type}>
          {t("cta")}
        </ShareCtaButton>
        <p className="text-xs text-muted-foreground">{t("ctaNote")}</p>
      </div>

      <p className="mt-10 max-w-md text-xs leading-relaxed text-muted-foreground/80">{t("aiNote")}</p>
    </div>
  );
}
