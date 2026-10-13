import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
