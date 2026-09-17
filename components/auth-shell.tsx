"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Wallet } from "lucide-react";

import { Brand } from "@/components/brand";
import { Aurora, Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuthInternals } from "@/lib/propfund/auth";
import { cn } from "@/lib/utils";

/**
 * Centered, single-column layout: animated backdrop and a glass card.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <Aurora />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(40rem 40rem at 50% 40%, black, transparent 75%)",
        }}
      />

      <main className="relative w-full max-w-[26rem]">
        <Reveal y={16}>
          <div className="mb-8 flex flex-col items-center text-center">
            <Link href="/" className="mb-7 inline-flex text-foreground transition-opacity hover:opacity-80">
              <Brand className="h-7" />
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </Reveal>

        <Reveal y={20} delay={0.08}>
          <div className="relative rounded-2xl border border-border bg-card/70 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            {children}
          </div>
        </Reveal>

        {footer && (
          <Reveal y={12} delay={0.16}>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </Reveal>
        )}
      </main>
    </div>
  );
}

function GoogleGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" />
    </svg>
  );
}

/**
 * Sign-in content (PRD §2). Real sign-in shows the three methods; without a
 * sign-in app ID, "Continue with Google" signs in a demo user.
 */
export function SignInPanel({
  title = "Sign in",
  description = "Sign in to buy a challenge and trade. Signing in never asks for identity documents.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  const { mode, signInWith, providerLoaded } = useAuthInternals();

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-col items-center text-center">
        <Brand showWordmark={false} className="h-9" />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-6 flex min-h-[9.5rem] flex-col justify-center gap-2.5">
        {mode === "privy" && (
          <>
            <Button variant="secondary" size="lg" className="w-full justify-start" loading={!providerLoaded} onClick={() => signInWith("email")}>
              {providerLoaded && <Mail />}
              Continue with email
            </Button>
            <Button variant="secondary" size="lg" className="w-full justify-start" disabled={!providerLoaded} onClick={() => signInWith("google")}>
              <GoogleGlyph />
              Continue with Google
            </Button>
            <Button variant="secondary" size="lg" className="w-full justify-start" disabled={!providerLoaded} onClick={() => signInWith("wallet")}>
              <Wallet />
              Continue with wallet
            </Button>
          </>
        )}

        {mode === "mock" && (
          <>
            <Button variant="secondary" size="lg" className="w-full justify-start" onClick={() => signInWith("google")}>
              <GoogleGlyph />
              Continue with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo sign-in. No Google account is used, and your data stays in this browser.
            </p>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to the{" "}
        <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

/** Global sign-in dialog opened by `useAuth().signIn()`. Mounted once in app/providers.tsx. */
export function SignInDialog() {
  const { dialogOpen, setDialogOpen, authenticated } = useAuthInternals();
  return (
    <Dialog open={dialogOpen && !authenticated} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-sm p-7">
        <DialogTitle className="sr-only">Sign in</DialogTitle>
        <DialogDescription className="sr-only">Choose how to sign in to Propfund.</DialogDescription>
        <SignInPanel />
      </DialogContent>
    </Dialog>
  );
}
