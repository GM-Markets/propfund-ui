import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} · One-step prop trading challenge`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "Pass a one-step challenge, trade a funded account and keep 80% of your realized profit, paid in USDC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
