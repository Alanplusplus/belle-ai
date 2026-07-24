import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import { SITE_URL, APP_STORE_ID } from "@/lib/constants";
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

  const isDefault = locale === routing.defaultLocale;
  const canonicalPath = isDefault ? SITE_URL : `${SITE_URL}/${locale}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = l === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${l}`;
  }
  languages["x-default"] = SITE_URL;

  return {
    title: {
      default: meta.homeTitle,
      template: `%s | ${meta.siteName}`,
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
    alternates: {
      canonical: canonicalPath,
      languages,
    },
    openGraph: {
      title: meta.homeTitle,
      description: meta.homeDescription,
      siteName: meta.siteName,
      locale,
      type: "website",
      url: canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.homeTitle,
      description: meta.homeDescription,
    },
    other: APP_STORE_ID
      ? { "apple-itunes-app": `app-id=${APP_STORE_ID}` }
      : undefined,
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

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Belle AI - Free AI Color Analysis",
    url: SITE_URL,
    description:
      "Free AI-powered personal color analysis. Upload a photo and discover your seasonal color type, best color palette, and styling recommendations in 60 seconds.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Belle AI",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
    description:
      "AI-powered personal color analysis app. Find your seasonal color type, best colors for makeup, fashion, and hair with advanced computer vision.",
  };

  return (
    <html
      lang={locale}
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
          <NextIntlClientProvider messages={messages}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
