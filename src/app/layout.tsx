import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  // 没有 metadataBase 时，根布局下的路由（全局 404 等）的分享图地址会被解析成 http://localhost:3000
  metadataBase: new URL(SITE_URL),
  title: "Belle AI",
  description: "Free AI Color Analysis – Find Your Best Colors in 60 Seconds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
