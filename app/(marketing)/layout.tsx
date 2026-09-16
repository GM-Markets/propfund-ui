import type { Metadata } from "next";

import { challengePackages, formatUsd, rulesSummary } from "@/components/propfund/site-data";

import "../propfund-marketing.css";

export const metadata: Metadata = {
  title: {
    default: "Propfund | One-Step Trading Challenges",
    template: "%s",
  },
  description:
    `One-step simulated trading challenges from ${formatUsd(challengePackages[0].fee)}. A ${rulesSummary.target} target, ${rulesSummary.dailyLoss} daily and ${rulesSummary.maxLoss} max loss limits, and an ${rulesSummary.traderSplit} payout split on the funded account.`,
  openGraph: {
    title: "Propfund | One-Step Trading Challenges",
    description: `Pass one challenge. Keep ${rulesSummary.traderSplit} of realized profit on your funded account.`,
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Propfund simulated trading challenges.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Propfund | One-Step Trading Challenges",
    description: `Pass one challenge. Keep ${rulesSummary.traderSplit} of realized profit on your funded account.`,
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
