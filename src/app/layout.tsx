import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#E5E2DB",
};

export const metadata: Metadata = {
  title: "Teller | 個人命理決策系統",
  description: "結合紫微斗數與八字曆法，提供每日能量指引。精確計算流日命宮與四化，助您掌握先機。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Teller",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Navbar />
      </body>
    </html>
  );
}
