import {
  Banknote,
  CandlestickChart,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Repeat2,
  ShieldCheck,
  Webhook,
  type LucideIcon,
} from "lucide-react";

import { PROGRAMMATIC_TRADING } from "@/lib/features";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/kyc", label: "Identity", icon: ShieldCheck },
  { href: "/dashboard/checkout", label: "Checkout", icon: CreditCard },
  { href: "/dashboard/trading", label: "Trading", icon: CandlestickChart },
  { href: "/dashboard/copy-trade", label: "Copy trade", icon: Repeat2 },
  { href: "/dashboard/payouts", label: "Payouts", icon: Banknote },
  ...(PROGRAMMATIC_TRADING
    ? [{ href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound } satisfies NavItem]
    : []),
  { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
];
