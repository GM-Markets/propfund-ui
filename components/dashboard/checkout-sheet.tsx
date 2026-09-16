"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CandlestickChart, CheckCircle2, Coins, CreditCard, Info, Lock, Wallet } from "lucide-react";

import { TestModeBadge } from "@/components/dashboard/badges";
import { CryptoCheckout } from "@/components/dashboard/crypto-checkout";
import { TermsCheckbox } from "@/components/dashboard/terms-checkbox";
import { useIsDesktop } from "@/components/dashboard/use-media-query";
import { errorCode, withToast } from "@/components/dashboard/with-toast";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { errorMessage } from "@/lib/errors";
import { formatUsd } from "@/lib/propfund/format";
import { actions } from "@/lib/propfund/hooks";
import type { ChallengePackage } from "@/lib/propfund/types";
import type { CheckoutView } from "@/lib/propfund/view/checkout";
import { cn } from "@/lib/utils";

type Step =
  | { kind: "summary" }
  | { kind: "crypto" }
  | { kind: "card"; checkoutId: string }
  | { kind: "success" };

/**
 * Checkout (PRD §4): bottom sheet on mobile, side sheet on desktop. Order
 * summary + terms + method, then the stablecoin or card path.
 */
export function CheckoutSheet({
  pkg,
  view,
  onOpenChange,
}: {
  pkg: ChallengePackage | null;
  view: CheckoutView | null;
  onOpenChange: (open: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const open = !!pkg && !!view;
  // Keep rendering the last package while the sheet animates closed.
  const last = React.useRef<{ pkg: ChallengePackage; view: CheckoutView } | null>(null);
  if (pkg && view) last.current = { pkg, view };
  const shown = pkg && view ? { pkg, view } : last.current;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn("gap-0", isDesktop && "max-w-lg")}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {shown && (
          <CheckoutFlow key={shown.pkg.id} pkg={shown.pkg} view={shown.view} onClose={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CheckoutFlow({ pkg, view, onClose }: { pkg: ChallengePackage; view: CheckoutView; onClose: () => void }) {
  const [step, setStep] = React.useState<Step>({ kind: "summary" });
  const [agreed, setAgreed] = React.useState(false);
  const [pending, setPending] = React.useState<"card" | "credit" | "complete" | null>(null);
  const [regionNote, setRegionNote] = React.useState<string | null>(null);
  const [depositStarted, setDepositStarted] = React.useState(false);
  const cardCheckoutRef = React.useRef<string | null>(null);

  // Leaving an unfinished card checkout releases any reserved deposit balance.
  React.useEffect(
    () => () => {
      const id = cardCheckoutRef.current;
      if (id) void actions.completeTestCardPayment(id, "cancelled").catch(() => undefined);
    },
    [],
  );

  const blocked = step.kind === "summary" ? view.blocked : null;
  const canPay = !blocked && !regionNote && agreed;

  function handleFailure(error: unknown) {
    if (errorCode(error) === "RESTRICTED_REGION") setRegionNote(errorMessage(error));
  }

  async function openCard() {
    setPending("card");
    const res = await withToast(() => actions.createCardCheckout({ packageId: pkg.id, agreedToTerms: agreed }), {
      loading: "Opening secure checkout…",
      success: "Secure checkout ready",
    });
    setPending(null);
    if (!res.ok) return handleFailure(res.error);
    cardCheckoutRef.current = res.value.id;
    setStep({ kind: "card", checkoutId: res.value.id });
  }

  async function completeCard(checkoutId: string) {
    setPending("complete");
    const res = await withToast(() => actions.completeTestCardPayment(checkoutId, "succeeded"), {
      loading: "Processing test payment…",
      success: `Payment received. Your ${pkg.name} challenge is ready.`,
    });
    setPending(null);
    if (!res.ok) return;
    cardCheckoutRef.current = null;
    setStep({ kind: "success" });
  }

  async function cancelCard(checkoutId: string) {
    cardCheckoutRef.current = null;
    setStep({ kind: "summary" });
    await actions.completeTestCardPayment(checkoutId, "cancelled").catch(() => undefined);
  }

  async function payWithCredit() {
    setPending("credit");
    const res = await withToast(() => actions.purchaseWithCredit({ packageId: pkg.id, agreedToTerms: agreed }), {
      loading: "Paying with your deposit balance…",
      success: `Paid. Your ${pkg.name} challenge is ready.`,
    });
    setPending(null);
    if (!res.ok) return handleFailure(res.error);
    setStep({ kind: "success" });
  }

  const title =
    step.kind === "crypto"
      ? "USDC or USDT"
      : step.kind === "card"
        ? "Secure checkout"
        : step.kind === "success"
          ? "Account created"
          : "Checkout";

  return (
    <>
      <SheetHeader className="pb-4">
        <div className="flex items-center gap-2 pr-8">
          {((step.kind === "crypto" && !depositStarted) || step.kind === "card") && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-ml-2 size-8"
              aria-label="Back to order summary"
              onClick={() => (step.kind === "card" ? void cancelCard(step.checkoutId) : setStep({ kind: "summary" }))}
            >
              <ArrowLeft />
            </Button>
          )}
          <SheetTitle>{title}</SheetTitle>
          <TestModeBadge className="ml-auto" />
        </div>
        <SheetDescription>
          {pkg.name} challenge · {formatUsd(pkg.accountSize)} simulated account
        </SheetDescription>
      </SheetHeader>

      <SheetBody className="pb-6">
        {step.kind === "summary" && (
          <div className="flex flex-col gap-5">
            <OrderSummary view={view} />

            {blocked ? (
              <CalmNote>
                {blocked.message}
                {blocked.code === "ACTIVE_ACCOUNT_EXISTS" && (
                  <>
                    {" "}
                    <Link href="/dashboard/terminal" className="font-medium text-primary underline-offset-4 hover:underline" onClick={onClose}>
                      Go to terminal
                    </Link>
                  </>
                )}
              </CalmNote>
            ) : regionNote ? (
              <CalmNote>{regionNote} Checkout is closed from your current location.</CalmNote>
            ) : null}

            <TermsCheckbox checked={agreed} onCheckedChange={setAgreed} disabled={!!blocked} />

            {view.coveredByCredit ? (
              <Button type="button" size="lg" disabled={!canPay} loading={pending === "credit"} onClick={() => void payWithCredit()}>
                <Wallet />
                Pay with deposit balance
              </Button>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Button
                  type="button"
                  size="lg"
                  className="justify-start"
                  disabled={!canPay || pending !== null}
                  onClick={() => setStep({ kind: "crypto" })}
                >
                  <Coins />
                  Pay with USDC or USDT
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="justify-start"
                  disabled={!canPay}
                  loading={pending === "card"}
                  onClick={() => void openCard()}
                >
                  <CreditCard />
                  Pay by card
                </Button>
                {!blocked && (
                  <p className={cn("text-xs text-muted-foreground", agreed && "invisible")} aria-hidden={agreed || undefined}>
                    Tick the box above to choose a payment method.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step.kind === "crypto" && (
          <CryptoCheckout
            pkg={pkg}
            amountDueUsd={view.amountDueUsd}
            agreedToTerms={agreed}
            onClose={onClose}
            onDepositChange={setDepositStarted}
          />
        )}

        {step.kind === "card" && (
          <div className="flex flex-col gap-5" data-testid="card-checkout">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="size-4 text-success" aria-hidden="true" />
                Card details stay with the card payment processor
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                You enter your card on the processor&apos;s secure checkout page. Propfund never sees or stores your card
                number. In test mode no card is charged.
              </p>
            </div>
            <dl className="rounded-lg border border-border p-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-mono text-base font-semibold tabular-nums">{formatUsd(view.amountDueUsd, 2)}</dd>
              </div>
            </dl>
            <Button
              type="button"
              size="lg"
              loading={pending === "complete"}
              onClick={() => void completeCard(step.checkoutId)}
            >
              Complete test payment
            </Button>
            <Button type="button" variant="ghost" onClick={() => void cancelCard(step.checkoutId)}>
              Cancel
            </Button>
          </div>
        )}

        {step.kind === "success" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center" data-testid="checkout-success">
            <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-7" aria-hidden="true" />
            </span>
            <div>
              <div className="text-lg font-semibold">Your {pkg.name} challenge is ready</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatUsd(pkg.accountSize)} simulated account. Trade it by hand in the terminal.
              </p>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/dashboard/terminal" onClick={onClose}>
                <CandlestickChart />
                Open terminal
              </Link>
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </SheetBody>
    </>
  );
}

function OrderSummary({ view }: { view: CheckoutView }) {
  return (
    <section aria-label="Order summary" className="rounded-xl border border-border p-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order summary</h3>
      <dl className="mt-2">
        {view.lines.map((line) =>
          line.kind === "note" ? (
            <div key={line.id} className="pb-1.5 text-right text-xs font-medium text-primary">
              {line.label}
            </div>
          ) : (
            <div
              key={line.id}
              className={cn(
                "flex items-baseline justify-between gap-4 py-1.5 text-sm",
                line.kind === "total" && "mt-1.5 border-t border-border pt-3",
              )}
            >
              <dt className={line.kind === "total" ? "font-medium" : "text-muted-foreground"}>{line.label}</dt>
              <dd
                className={cn(
                  "font-mono tabular-nums",
                  line.struck && "text-muted-foreground line-through",
                  line.kind === "total" && "text-lg font-semibold",
                )}
              >
                {line.amountUsd == null
                  ? ""
                  : line.kind === "adjustment"
                    ? `−${formatUsd(Math.abs(line.amountUsd), 2)}`
                    : formatUsd(line.amountUsd, line.kind === "total" ? 2 : 0)}
              </dd>
            </div>
          ),
        )}
      </dl>
    </section>
  );
}

function CalmNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground" role="status">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
