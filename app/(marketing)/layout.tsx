import type { Metadata } from "next";

import "../propfund-marketing.css";

export const metadata: Metadata = {
  title: {
    default: "Propfund | Simulated Trading Evaluations",
    template: "%s",
  },
  description:
    "Complete one simulated trading evaluation, move to a scaled account, and request eligible rewards after every seven trading days.",
  openGraph: {
    title: "Propfund | Simulated Trading Evaluations",
    description: "One evaluation phase, no deadline, weekly eligible reward requests, and simulated account scaling up to $2.5M.",
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
    title: "Propfund | Simulated Trading Evaluations",
    description: "One evaluation phase, no deadline, weekly eligible reward requests, and simulated account scaling up to $2.5M.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/brand/propfund-mark-dark.svg",
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="propfund-site">{children}</div>;
}
