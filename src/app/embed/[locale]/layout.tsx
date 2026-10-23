import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import type { Metadata, Viewport } from "next";

/**
 * 可嵌入测验的根布局（/embed/<语种>/<测验>）。
 *
 * 和 [locale]/layout.tsx 的区别：没有页眉页脚、登录、Google One Tap、GA 和任何其他第三方脚本。
 * 这个页面会出现在别人的网站上，所以刻意保持最小：不写 cookie、不做统计，答案只在访客的浏览器里计算。
 * 因此这里不要加 GA、AuthProvider 之类的东西；也不在 proxy 的 matcher 里（next-intl 会写 NEXT_LOCALE cookie）。
 */
const inter = localFont({
  src: "../../fonts/Inter-latin-variable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFF9F5",
};

// 嵌入页本身不收录：要被收录和引用的是站内的 /tools/<测验> 和 /tools/embed
// 嵌入页不继承 [locale]/layout.tsx 的 metadata：根目录的文件式 opengraph-image 会被解析成 localhost，
// 所以和主站一样显式写绝对地址
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: true },
  openGraph: { images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`${SITE_URL}/opengraph-image`] },
};

// 客户端组件用到的命名空间：三个测验 + 结果页卡片（quiz、embed）
const CLIENT_NAMESPACES = ["quiz", "colorQuiz", "faceQuiz", "undertoneTest", "embed"] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function EmbedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = (await getMessages({ locale })) as Record<string, unknown>;
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.filter((ns) => ns in messages).map((ns) => [ns, messages[ns]]),
  );

  return (
    <html
      lang={locale}
      dir="ltr"
      className={`${inter.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
