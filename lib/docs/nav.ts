export type DocsNavItem = { href: string; label: string };
export type DocsNavGroup = { title: string; items: DocsNavItem[] };

export const DOCS_NAV: DocsNavGroup[] = [
  {
    title: "Getting started",
    items: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/quickstart", label: "Quickstart" },
      { href: "/docs/authentication", label: "Authentication" },
    ],
  },
  {
    title: "Flows",
    items: [
      { href: "/docs/kyc", label: "Identity / KYC" },
      { href: "/docs/checkout", label: "Checkout & accounts" },
      { href: "/docs/trading", label: "Trading" },
      { href: "/docs/payouts", label: "Payouts & Connect" },
      { href: "/docs/api-keys", label: "API keys" },
      { href: "/docs/webhooks", label: "Webhooks" },
      { href: "/docs/agreements", label: "Agreements" },
      { href: "/docs/lifecycle", label: "Lifecycle" },
      { href: "/docs/notifications", label: "Notifications" },
    ],
  },
  {
    title: "Reference",
    items: [{ href: "/docs/api-reference", label: "Full API reference" }],
  },
];

/** Maps a dashboard route to its docs page (for in-app "View docs" links). */
export const DOCS_FOR_ROUTE: Record<string, string> = {
  "/dashboard": "/docs",
  "/dashboard/kyc": "/docs/kyc",
  "/dashboard/checkout": "/docs/checkout",
  "/dashboard/trading": "/docs/trading",
  "/dashboard/payouts": "/docs/payouts",
  "/dashboard/api-keys": "/docs/api-keys",
  "/dashboard/webhooks": "/docs/webhooks",
};
