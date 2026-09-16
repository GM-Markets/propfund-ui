"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, Check, ChevronDown, Copy, LogOut } from "lucide-react";
import { toast } from "sonner";

import { SignInPanel } from "@/components/auth-shell";
import { Brand } from "@/components/brand";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS, isFullBleedRoute, isNavActive } from "@/components/nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/propfund/auth";
import { formatUsd, truncateAddress } from "@/lib/propfund/format";
import { useAccountMetrics, useActiveAccount } from "@/lib/propfund/hooks";
import { PHASE_LABEL } from "@/lib/propfund/rules";
import { cn } from "@/lib/utils";

/**
 * Dashboard shell (PRD §10): one sticky top bar holds the brand, the whole app
 * nav, the phase badge + equity of the active account and the account menu.
 * On lg+ the links sit inline in that row; below lg they wrap onto a second,
 * horizontally scrollable row so all of them stay reachable from the header.
 * The same frame renders while sign-in is loading and behind the sign-in
 * panel, so nothing shifts when the state resolves.
 */

type ShellState = "loading" | "signed_out" | "ready";

const NAV_LINK =
  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none ring-ring transition-colors focus-visible:ring-2 lg:gap-1.5 lg:px-2 xl:px-3";
/** Icon shows on the narrow scroll row and again from xl, where the row has room. */
const NAV_ICON = "size-4 lg:hidden xl:block";

function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = React.useRef<HTMLElement | null>(null);
  const activeRef = React.useRef<HTMLAnchorElement | null>(null);

  // The router cache is already warm for these (prefetch), but a pointer landing
  // on a link is the last chance to warm anything that has since expired.
  const warm = React.useCallback((href: string) => router.prefetch(href), [router]);

  // On the narrow scroll row the current page can start off-screen: centre it
  // in the row itself (never the page) whenever the route changes.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const row = navRef.current;
      const link = activeRef.current;
      if (!row || !link || row.scrollWidth <= row.clientWidth) return;
      const offset = link.getBoundingClientRect().left - row.getBoundingClientRect().left;
      const target = row.scrollLeft + offset - (row.clientWidth - link.offsetWidth) / 2;
      row.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      aria-label="App"
      className={cn(
        // Scrolls rather than wraps if the links ever outgrow the row.
        "order-last w-full min-w-0 overflow-x-auto overscroll-x-contain border-t border-border scrollbar-none",
        "lg:order-none lg:w-auto lg:flex-1 lg:border-t-0",
      )}
    >
      <ul className="flex w-max items-center gap-1 px-2 py-1.5 sm:px-4 lg:w-auto lg:gap-0.5 lg:px-1 lg:py-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                prefetch
                onPointerEnter={() => warm(href)}
                onPointerDown={() => warm(href)}
                ref={active ? activeRef : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  NAV_LINK,
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className={NAV_ICON} />
                {label}
              </Link>
            </li>
          );
        })}

        <li aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-border" />

        {SECONDARY_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              prefetch
              onPointerEnter={() => warm(href)}
              onPointerDown={() => warm(href)}
              className={cn(NAV_LINK, "text-muted-foreground hover:bg-accent hover:text-foreground")}
            >
              <Icon className={NAV_ICON} />
              {label}
              <ArrowUpRight className="size-3.5 shrink-0 opacity-60" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Phase badge + equity of the active account. Fixed width so loading doesn't shift the header. */
function AccountSummary({ state }: { state: ShellState }) {
  const account = useActiveAccount();
  const metrics = useAccountMetrics(account?.id ?? undefined);

  if (state !== "ready" || account === undefined || (account && metrics === undefined)) {
    return (
      <div className="flex items-center gap-3" aria-hidden="true">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
    );
  }

  if (!account) {
    return (
      <Link href="/dashboard/challenges" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
        No active account
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Badge variant={account.phase === "funded" ? "success" : "default"} className="shrink-0">
        {PHASE_LABEL[account.phase]}
      </Badge>
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="hidden text-xs text-muted-foreground sm:max-lg:inline xl:inline">Equity</span>
        <span className="truncate font-mono text-sm font-semibold tabular-nums" data-testid="header-equity">
          {metrics ? formatUsd(metrics.equity, 2) : formatUsd(account.balance, 2)}
        </span>
      </div>
    </div>
  );
}

function AccountMenu({ state }: { state: ShellState }) {
  const { user, signOut } = useAuth();
  const [copied, setCopied] = React.useState(false);

  if (state !== "ready" || !user) {
    return <Skeleton className="size-9 rounded-full" aria-hidden="true" />;
  }

  const address = user.walletAddress;
  const initials = (user.email ?? address?.slice(2) ?? "PF").slice(0, 2).toUpperCase();

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Wallet address copied");
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      toast.error("Couldn't copy the address");
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      toast.error("Couldn't sign out. Please try again.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 py-1 pl-1 pr-2 outline-none ring-ring transition hover:bg-accent focus-visible:ring-2"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
            {initials}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">
          <div className="text-xs text-muted-foreground">Your Propfund wallet</div>
          {address ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-sm text-foreground" title={address}>
                {truncateAddress(address)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={(e) => {
                  e.preventDefault();
                  void copyAddress();
                }}
                aria-label="Copy wallet address"
              >
                {copied ? <Check className="text-success" /> : <Copy />}
              </Button>
            </div>
          ) : (
            <div className="mt-1 text-sm text-muted-foreground">Being created…</div>
          )}
          {user.email && <div className="mt-2 truncate text-xs text-muted-foreground">{user.email}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/rules">
            <BookOpen />
            Trading rules
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContentSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-xl lg:col-span-2" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-40 rounded-xl" />
    </div>
  );
}

export function AppShell({
  state = "ready",
  children,
  overlay,
}: {
  state?: ShellState;
  children?: React.ReactNode;
  /** Rendered above the shell (e.g. test controls). */
  overlay?: React.ReactNode;
}) {
  const pathname = usePathname();
  const fullBleed = isFullBleedRoute(pathname);
  const locked = state !== "ready";

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          locked && state === "signed_out" && "pointer-events-none select-none blur-sm",
        )}
        aria-hidden={state === "signed_out" || undefined}
      >
        <header className="glass sticky top-0 z-30 flex flex-wrap items-center border-b border-border">
          <Link
            href="/dashboard"
            prefetch
            aria-label="Propfund overview"
            className="flex h-14 shrink-0 items-center rounded-lg pl-4 outline-none ring-ring focus-visible:ring-2 sm:pl-6 lg:h-[60px] lg:pr-3"
          >
            <Brand showWordmark={false} className="size-7 lg:hidden" />
            <Brand className="hidden text-[15px] lg:inline-flex" />
          </Link>

          <HeaderNav />

          <div className="ml-auto flex h-14 min-w-0 items-center gap-3 pl-3 pr-4 sm:pr-6 lg:h-[60px]">
            <AccountSummary state={state} />
            <AccountMenu state={state} />
          </div>
        </header>

        <main
          className={cn(
            "w-full flex-1",
            fullBleed
              ? "px-0 pb-0 pt-0"
              : "mx-auto max-w-6xl px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-6 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8",
          )}
        >
          {state === "ready" ? children : <ContentSkeleton />}
        </main>
      </div>

      {state === "signed_out" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Sign in to continue"
            className="w-full max-w-sm rounded-2xl border border-border bg-popover p-7 shadow-2xl"
          >
            <SignInPanel title="Sign in to continue" />
          </div>
        </div>
      )}

      {overlay}
    </div>
  );
}
