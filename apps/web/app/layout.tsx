import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "OCRWebApp",
  description: "Phase 0 foundation"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
