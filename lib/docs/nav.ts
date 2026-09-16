/** Navigation for the trader help center at /help (PRD §11). */

export type HelpArticle = {
  slug: string;
  href: string;
  label: string;
  description: string;
};

export type HelpNavGroup = { title: string; items: HelpArticle[] };

function article(slug: string, label: string, description: string): HelpArticle {
  return { slug, href: `/help/${slug}`, label, description };
}

export const HELP_NAV: HelpNavGroup[] = [
  {
    title: "Start here",
    items: [
      article("getting-started", "Getting started", "How Propfund works, from signing in to your first payout."),
      article("sign-in-and-wallet", "Sign-in and wallet", "Signing in with email, Google or a wallet, and your Propfund wallet."),
      article("paying-for-a-challenge", "Paying for a challenge", "Supported chains and tokens, confirmations and paying by card."),
    ],
  },
  {
    title: "Your account",
    items: [
      article("challenge-rules", "Challenge rules", "The target, the daily and max loss limits, and what happens on a breach."),
      article("funded-account", "Funded account", "Graduation, the funded account and how limits work after you pass."),
      article("payouts-and-identity-verification", "Payouts and identity verification", "Requesting a payout, the 7-day review and the one-time identity check."),
      article("violations", "Violations", "The eight account violations and what happens if one is confirmed."),
    ],
  },
  {
    title: "Answers",
    items: [article("faq", "FAQ", "Short answers to the questions traders ask most.")],
  },
];

export const HELP_ARTICLES: HelpArticle[] = HELP_NAV.flatMap((group) => group.items);

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((item) => item.slug === slug);
}

/** Previous and next articles in reading order, for the article footer. */
export function getAdjacentArticles(slug: string): { previous?: HelpArticle; next?: HelpArticle } {
  const index = HELP_ARTICLES.findIndex((item) => item.slug === slug);
  if (index === -1) return {};
  return { previous: HELP_ARTICLES[index - 1], next: HELP_ARTICLES[index + 1] };
}

/** Maps a dashboard route to its help article (for in-app "Help" links). */
export const HELP_FOR_ROUTE: Record<string, string> = {
  "/dashboard": "/help/getting-started",
  "/dashboard/challenges": "/help/paying-for-a-challenge",
  "/dashboard/terminal": "/help/challenge-rules",
  "/dashboard/payouts": "/help/payouts-and-identity-verification",
  "/dashboard/wallet": "/help/sign-in-and-wallet",
  "/dashboard/history": "/help/funded-account",
};
