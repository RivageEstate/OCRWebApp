import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import Header from "./components/Header";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OCRWebApp",
  description: "物件概要書 OCR 解析ツール",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${shipporiMincho.variable}`}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
