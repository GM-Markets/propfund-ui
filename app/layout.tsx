import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
        default: `${BRAND_NAME} | Simulated Trading Evaluations`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "Complete one simulated trading evaluation, move to a scaled account, and request eligible rewards after every seven trading days.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
