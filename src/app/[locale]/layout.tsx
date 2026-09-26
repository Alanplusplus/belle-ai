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
import { SITE_URL } from "@/lib/constants";
import Script from "next/script";
import type { Metadata } from "next";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
      dir={locale === "ar" ? "rtl" : "ltr"}
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
        src="https://www.googletagmanager.com/gtag/js?id=G-H526RRVE9N"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-H526RRVE9N');
        `}
      </Script>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <GoogleOneTap />
          <PageViewTracker />
          <NextIntlClientProvider messages={messages}>
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
