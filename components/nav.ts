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

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/kyc", label: "Identity", icon: ShieldCheck },
  { href: "/dashboard/checkout", label: "Checkout", icon: CreditCard },
  { href: "/dashboard/trading", label: "Trading", icon: CandlestickChart },
  { href: "/dashboard/copy-trade", label: "Copy trade", icon: Repeat2 },
  { href: "/dashboard/payouts", label: "Payouts", icon: Banknote },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
];
