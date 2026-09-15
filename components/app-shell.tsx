"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";

import { usePrivy } from "@privy-io/react-auth";

import { logoutAction } from "@/app/actions/auth";
import { Brand } from "@/components/brand";
import { NAV_ITEMS } from "@/components/nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PublicIdentity } from "@/lib/gateway/profile";
import { isConfiguredPrivyAppId } from "@/lib/privy";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
            {label}
            {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}

function shortWallet(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function UserMenu({ name, email, wallet }: PublicIdentity) {
  const initials = (email ?? name).slice(0, 2).toUpperCase();
  const [pending, startTransition] = React.useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-0.5 outline-none ring-ring transition focus-visible:ring-2">
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="text-xs text-muted-foreground">Signed in as</div>
          <div className="truncate text-sm font-medium text-foreground">{name}</div>
          {email ? <div className="truncate text-xs text-muted-foreground">{email}</div> : null}
          {wallet ? <div className="truncate font-mono text-xs text-muted-foreground">{shortWallet(wallet)}</div> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          className="text-foreground"
          onSelect={() => {
            startTransition(() => {
              void logoutAction();
            });
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function usePrivyIdentity(): PublicIdentity {
  const { user } = usePrivy();
  const email = user?.email?.address ?? user?.google?.email ?? null;
  const wallet = user?.wallet?.address ?? null;
  const name = user?.google?.name ?? (email ? email.split("@")[0] : null) ?? "Account";
  return { name, email, wallet };
}

function UserMenuSlot({ identity }: { identity?: PublicIdentity }) {
  if (identity) return <UserMenu {...identity} />;
  if (!isConfiguredPrivyAppId(process.env.NEXT_PUBLIC_PRIVY_APP_ID)) {
    return <UserMenu name="Account" email={null} wallet={null} />;
  }
  return <PrivyUserMenu />;
}

function PrivyUserMenu() {
  return <UserMenu {...usePrivyIdentity()} />;
}

export function AppShell({ identity, children }: { identity?: PublicIdentity; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="px-2 py-3">
          <Link href="/dashboard">
            <Brand />
          </Link>
        </div>
        <div className="mt-4 flex-1">
          <NavLinks />
        </div>
        <div className="rounded-lg border border-border bg-card/60 p-3 text-xs text-muted-foreground">
          Simulated desk · 100% eligible rewards
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar p-4">
            <div className="flex items-center justify-between px-2 py-3">
              <Brand />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X />
              </Button>
            </div>
            <div className="mt-4 flex-1">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="glass sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
          <Link href="/dashboard" className="lg:hidden">
            <Brand showWordmark={false} />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <UserMenuSlot identity={identity} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
