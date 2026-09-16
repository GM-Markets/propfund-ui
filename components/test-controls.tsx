"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";

import { TRANSPARENCY_SCALES } from "@/components/propfund/transparency-data";
import { startRouteProgress } from "@/components/top-progress-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/propfund/auth";
import { TEST_CONTROLS_ENABLED } from "@/lib/propfund/config";
import { formatDateTime, formatUsd } from "@/lib/propfund/format";
import { useNow } from "@/lib/propfund/hooks";
import { MARKETS } from "@/lib/propfund/markets";
import * as tc from "@/lib/propfund/mock/test-controls";
import { PACKAGES, VIOLATIONS, VIOLATION_CODES } from "@/lib/propfund/rules";
import type { PackageId, ViolationCode } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

/**
 * Test controls drawer (PRD §12). Mounted app-wide by `app/providers.tsx`, so
 * it is reachable on the public site and on /transparency as well as in the
 * dashboard. Rendered only when `NEXT_PUBLIC_TEST_CONTROLS=true` and never in
 * a production build.
 */
export function TestControls() {
  if (!TEST_CONTROLS_ENABLED) return null;
  return <TestControlsDrawer />;
}

function Section({
  title,
  children,
  stacked = false,
}: {
  title: string;
  children: React.ReactNode;
  stacked?: boolean;
}) {
  return (
    <section className="border-b border-border py-4 last:border-b-0">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className={cn(stacked ? "flex flex-col gap-1.5" : "flex flex-wrap gap-2")}>{children}</div>
    </section>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="w-full text-xs text-muted-foreground">{children}</p>;
}

/**
 * The mock clock, read here rather than in the drawer. The drawer is mounted on
 * every route, so subscribing to a 1 Hz clock up there meant a render a second
 * on pages that never show this line. Radix only mounts the sheet's content
 * while it is open, so now the clock only runs while a reviewer is looking at it.
 */
function MockTime() {
  const now = useNow(1_000);
  return <>{now ? formatDateTime(now) : "…"}</>;
}

function TestControlsDrawer() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { authenticated, signIn, signOut } = useAuth();
  const [symbol, setSymbol] = React.useState("BTC");
  const [packageId, setPackageId] = React.useState<PackageId>("core");
  const [violation, setViolation] = React.useState<ViolationCode>("V1");
  const [depositAmount, setDepositAmount] = React.useState("");
  const pkg = PACKAGES.find((p) => p.id === packageId) ?? PACKAGES[1];

  const run = React.useCallback(async (label: string, fn: () => unknown) => {
    try {
      await fn();
      toast.success(label);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test control failed");
    }
  }, []);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      startRouteProgress();
      router.push(href);
    },
    [router],
  );

  const act = (label: string, fn: () => unknown, variant: "outline" | "destructive" = "outline") => (
    <Button type="button" size="sm" variant={variant} onClick={() => void run(label, fn)}>
      {label}
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          // Clear of the terminal's mobile Buy/Sell bar (60px) and of the site
          // header and footer CTA; bottom-left on desktop, away from the
          // terminal's order form. Above the breach / graduation / violation
          // takeover (z-50) and clickable through its overlay, so a reviewer can
          // always reach the next state.
          // `lg:left-16` keeps clear of the dev-server indicator in the same corner.
          className={cn(
            "pointer-events-auto fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3 z-[60] border border-warning/40 shadow-lg lg:bottom-4 lg:left-16 lg:right-auto",
            open && "hidden",
          )}
        >
          <FlaskConical className="text-warning" />
          Test controls
        </Button>
      </SheetTrigger>
      {/* Above the public site's sticky header (z-index 100) as well as the app's own layers. */}
      <SheetContent side="right" className="z-[110] gap-0" overlayClassName="z-[105]">
        <SheetHeader className="pb-2">
          <SheetTitle>Test controls</SheetTitle>
          <SheetDescription>
            Simulated data for design review and QA. Mock time: <MockTime />
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="pb-6">
          <Section title="Session">
            {act("Signed-out homepage", async () => {
              await signOut();
              go("/");
            })}
            <Button
              type="button"
              size="sm"
              variant="outline"
              title={authenticated ? "Already signed in: go to the dashboard" : "Sign up or sign in, then land on the dashboard"}
              onClick={() => {
                setOpen(false);
                signIn({ redirectTo: "/dashboard" });
              }}
            >
              {authenticated ? "Go to dashboard" : "Sign up / sign in"}
            </Button>
            {authenticated && act("Sign out", () => signOut())}
            <Hint>
              {authenticated
                ? "Signed in. Sign-out keeps this user's simulated data for the next sign-in."
                : "Signed out. Sign in to use the states below."}
            </Hint>
          </Section>

          <Section title="Buy a challenge" stacked>
            <div className="grid grid-cols-5 gap-1">
              {PACKAGES.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  size="sm"
                  variant={p.id === packageId ? "default" : "outline"}
                  className="h-auto flex-col gap-0 px-1 py-1.5"
                  title={`${p.name}: ${formatUsd(p.accountSize)} account · ${formatUsd(p.fee)} fee · ${formatUsd(p.rebuyFee)} rebuy`}
                  aria-pressed={p.id === packageId}
                  onClick={() => setPackageId(p.id)}
                >
                  <span className="text-[11px] font-semibold">{p.name}</span>
                  <span className="text-[10px] font-normal opacity-80">{formatUsd(p.accountSize)}</span>
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {act(`Buy at ${formatUsd(pkg.fee)}`, () => tc.buyChallenge(pkg.id))}
              {act(`Buy at rebuy ${formatUsd(pkg.rebuyFee)}`, () => tc.buyChallengeAtRebuy(pkg.id))}
            </div>
            <Hint>
              Provisions {pkg.name} ({formatUsd(pkg.accountSize)}) instantly as a paid card purchase. One active account
              per user: buying again is refused until the current one closes.
            </Hint>
          </Section>

          <Section title="States" stacked>
            {tc.SCENARIOS.map((sc) => (
              <Button
                key={sc.id}
                type="button"
                size="sm"
                variant="outline"
                className="h-auto flex-col items-start gap-0.5 px-3 py-2 text-left"
                title={sc.description}
                disabled={!authenticated}
                onClick={() => void run(sc.label, () => tc.applyScenario(sc.id))}
              >
                <span className="font-medium">{sc.label}</span>
                <span className="whitespace-normal text-xs font-normal leading-snug text-muted-foreground">
                  {sc.description}
                </span>
              </Button>
            ))}
            <Hint>Each state wipes this user&apos;s simulated data, the clock and prices first.</Hint>
          </Section>

          <Section title="Transparency" stacked>
            <div className="flex flex-wrap gap-2">
              {TRANSPARENCY_SCALES.map((scale) => (
                <Button key={scale.id} asChild type="button" size="sm" variant="outline" title={scale.description}>
                  <Link href={`/transparency?scale=${scale.id}`} onClick={() => setOpen(false)}>
                    {scale.label}
                  </Link>
                </Button>
              ))}
            </div>
            <Hint>Sample figures at three sizes of the same business. Every page keeps the “Sample data” badge.</Hint>
          </Section>

          <Section title="Prices">
            <div className="w-full">
              <Label className="sr-only" htmlFor="tc-market">Market</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger id="tc-market" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All markets</SelectItem>
                  {MARKETS.map((m) => (
                    <SelectItem key={m.symbol} value={m.symbol}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {act("−5%", () => tc.movePrice(symbol, -0.05))}
            {act("−1%", () => tc.movePrice(symbol, -0.01))}
            {act("+1%", () => tc.movePrice(symbol, 0.01))}
            {act("+5%", () => tc.movePrice(symbol, 0.05))}
          </Section>

          <Section title="Active account">
            {act("Jump to daily breach", tc.jumpToDailyBreach)}
            {act("Jump to max breach", tc.jumpToMaxBreach)}
            {act("Jump to target", tc.jumpToTarget)}
          </Section>

          <Section title="Clock (UTC)">
            {act("To 00:00 UTC", tc.advanceClockToMidnight)}
            {act("+1 day", () => tc.advanceClockDays(1))}
            {act("+7 days", () => tc.advanceClockDays(7))}
          </Section>

          <Section title="Identity verification">
            {act("Approve", tc.approveKyc)}
            {act("Request more info", () => tc.requestMoreKycInfo())}
            {act("Reject", () => tc.rejectKyc())}
            {act("Reject: restricted (V8)", () => tc.rejectKyc({ violation: "V8" }), "destructive")}
          </Section>

          <Section title="Deposits and wallet">
            <div className="flex w-full items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="tc-deposit-amount" className="text-xs text-muted-foreground">
                  Amount received (blank = exact)
                </Label>
                <Input
                  id="tc-deposit-amount"
                  inputMode="decimal"
                  placeholder="e.g. 150"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
              {act("Confirm deposit", () => {
                const n = Number(depositAmount);
                return tc.confirmDeposit(undefined, depositAmount.trim() && Number.isFinite(n) ? n : undefined);
              })}
            </div>
            {act("Add 1,000 USDC (Arbitrum)", () => tc.fundWallet("arbitrum", "USDC", 1_000))}
            {act("Restricted region on", () => tc.setRestrictedRegion(true))}
            {act("Restricted region off", () => tc.setRestrictedRegion(false))}
          </Section>

          <Section title="Violations and payouts">
            <div className="w-full">
              <Label className="sr-only" htmlFor="tc-violation">Violation</Label>
              <Select value={violation} onValueChange={(v) => setViolation(v as ViolationCode)}>
                <SelectTrigger id="tc-violation" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIOLATION_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code} · {VIOLATIONS[code].title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {act("Flag violation", () => tc.flagViolation(violation), "destructive")}
            {act("Return payout", () => tc.returnPayout())}
          </Section>

          <Section title="Data">
            {act(
              "Reset all data",
              () => {
                if (window.confirm("Reset all simulated data for this user?")) tc.resetAllData();
                else throw new Error("Reset cancelled");
              },
              "destructive",
            )}
          </Section>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
