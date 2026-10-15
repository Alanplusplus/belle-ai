import { permanentRedirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// 目前没有 App 下载页：旧地址永久（308）跳回对应语种的首页，保住已有外链的权重
export default async function DownloadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(locale === routing.defaultLocale ? "/" : `/${locale}`);
}
