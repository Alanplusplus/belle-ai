import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/Header";
import { ReferralBanner } from "@/components/ReferralBanner";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import { GoogleOneTap } from "@/components/GoogleOneTap";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buildAlternates, ogLocale } from "@/lib/seo";
import { SITE_URL, GA_MEASUREMENT_ID } from "@/lib/constants";
import Script from "next/script";
import type { Metadata, Viewport } from "next";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// 手机浏览器地址栏/状态栏颜色与页面底色一致（manifest.json 里的 theme_color 保持同一个值）
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFF9F5",
};

// 客户端组件（"use client"）实际用到的文案命名空间。
// 只把这些传给 NextIntlClientProvider：服务端组件的文案走 getRequestConfig，不依赖这里。
// 若传整份语言包（约 260KB），它会被复制进每个页面的 .html / .rsc / 预取分段，
// 2300+ 个静态页面的构建产物膨胀到近 3GB，Vercel 部署时间主要耗在处理和上传这些产物上。
// 新增或修改客户端组件时，如果 useTranslations("xxx") 用了新的命名空间，必须同步加到这里，
// 否则该组件在客户端会取不到文案。
const CLIENT_NAMESPACES = [
  "nav",
  "footer",
  "inApp",
  "blog",
  "features",
  "pricing",
  "referral",
  "tryPage",
  "quiz",
  "colorQuiz",
  "faceQuiz",
] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const meta = messages.meta;

  return {
    title: {
      default: `${meta.homeTitle} | ${meta.siteName}`,
      template: "%s",
    },
    description: meta.homeDescription,
    metadataBase: new URL(SITE_URL),
    icons: {
      icon: [
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    alternates: buildAlternates(locale, ""),
    other: {
      "application/rss+xml": `${SITE_URL}/feed.xml`,
      "pinterest-rss": `${SITE_URL}/pinterest-feed.xml`,
    },
    manifest: "/manifest.json",
    openGraph: {
      title: meta.homeTitle,
      description: meta.homeDescription,
      siteName: meta.siteName,
      locale: ogLocale(locale),
      type: "website",
      url: buildAlternates(locale, "").canonical,
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.homeTitle,
      description: meta.homeDescription,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const meta = (messages as Record<string, Record<string, string>>).meta;
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.filter((ns) => ns in messages).map((ns) => [ns, messages[ns]])
  );

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Belle AI",
    url: SITE_URL,
    description: meta?.homeDescription ?? "Free AI-powered personal color analysis.",
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Belle AI",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-full.webp`,
    sameAs: [
      "https://www.instagram.com/belleaicoloranalysis",
      "https://x.com/BelleAIcolor",
      "https://www.youtube.com/@coloranalysisbelleai",
      "https://www.pinterest.com/coloranalysisbelleai",
      "https://medium.com/@belleai",
    ],
    description: meta?.homeDescription ?? "AI-powered personal color analysis app.",
  };

  return (
    <html
      lang={locale}
      dir="ltr"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <GoogleOneTap />
          <PageViewTracker />
          <NextIntlClientProvider messages={clientMessages}>
            <ReferralBanner />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
