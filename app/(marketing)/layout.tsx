import type { Metadata } from "next";

import "../propfund-marketing.css";

export const metadata: Metadata = {
  title: {
    default: "Propfund | One-Step Trading Evaluations",
    template: "%s",
  },
  description:
    "One-step simulated trading evaluations with a 100% reward split, weekly rewards, and scaling up to $2.5M.",
  openGraph: {
    title: "Propfund | One-Step Trading Evaluations",
    description: "Pass one evaluation. Keep 100% of eligible rewards.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Propfund simulated trading evaluations.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Propfund | One-Step Trading Evaluations",
    description: "Pass one evaluation. Keep 100% of eligible rewards.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="propfund-site">{children}</div>;
}
