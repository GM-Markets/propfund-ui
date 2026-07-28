import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") || "https";
  const metadataBase = host ? new URL(`${protocol}://${host}`) : new URL("https://propfund.example");

  return {
    metadataBase,
    title: "Propfund | One-Step Trading Evaluations",
    description: "One-step simulated trading evaluations with a 100% reward split, weekly rewards, and scaling up to $2.5M.",
    openGraph: {
      title: "Propfund | One-Step Trading Evaluations",
      description: "Pass one evaluation. Keep 100% of eligible rewards.",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Propfund simulated trading evaluations." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Propfund | One-Step Trading Evaluations",
      description: "Pass one evaluation. Keep 100% of eligible rewards.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
