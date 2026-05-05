import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FB Ads Analyzer — Ido Segal Studio",
  description: "Upload your Facebook Ads CSV and get a beautiful campaign performance dashboard with PDF export.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
