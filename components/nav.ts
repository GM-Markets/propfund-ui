import {
  Banknote,
  CandlestickChart,
  History,
  LayoutDashboard,
  LineChart,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/**
 * App navigation (PRD §10): Overview · Challenges · Terminal · Payouts · Wallet · History.
 * Identity verification is not a destination: it is the first step of the
 * first payout request (PRD §8).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/challenges", label: "Challenges", icon: Trophy },
  { href: "/dashboard/terminal", label: "Terminal", icon: CandlestickChart },
  { href: "/dashboard/payouts", label: "Payouts", icon: Banknote },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/history", label: "History", icon: History },
];

/**
 * Public pages linked from the app nav (PRD §11). These leave `/dashboard`, so
 * they sit after a divider and never take the active state of an app route.
 */
export const SECONDARY_NAV_ITEMS: readonly NavItem[] = [
  { href: "/transparency", label: "Transparency", icon: LineChart },
];

export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Routes that use the full-width layout (no page gutter / max width). */
export function isFullBleedRoute(pathname: string): boolean {
  return pathname === "/dashboard/terminal" || pathname.startsWith("/dashboard/terminal/");
}
