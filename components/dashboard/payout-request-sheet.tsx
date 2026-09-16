"use client";

import * as React from "react";
import { CalendarClock, ShieldCheck } from "lucide-react";

import { Row } from "@/components/dashboard/primitives";
import { useIsDesktop } from "@/components/dashboard/use-media-query";
import { withToast } from "@/components/dashboard/with-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDayDate, formatPct, formatUsd, truncateAddress } from "@/lib/propfund/format";
import type { PayoutPreview } from "@/lib/propfund/mock";
import { actions } from "@/lib/propfund/hooks";
import { CUSTOM_ADDRESS_CONFIRM_COPY, PAYOUT_REVIEW_DAYS, PROPFUND_SHARE, TRADER_SHARE } from "@/lib/propfund/rules";
import { checkPayoutAddress, resolvePayoutAddress } from "@/lib/propfund/view/payouts";
import { cn } from "@/lib/utils";

type Mode = "propfund_wallet" | "custom";

/** Payout request sheet (PRD §8, §10.4). Numbers come from the service's payout preview. */
export function PayoutRequestSheet({
  preview,
  onOpenChange,
}: {
  preview: PayoutPreview | null;
  onOpenChange: (open: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const last = React.useRef<PayoutPreview | null>(null);
  if (preview) last.current = preview;
  const shown = preview ?? last.current;

  return (
    <Sheet open={!!preview} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn("gap-0", isDesktop && "max-w-lg")}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {shown && <PayoutRequestForm key={shown.accountId + shown.profitUsd} preview={shown} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function PayoutRequestForm({ preview, onDone }: { preview: PayoutPreview; onDone: () => void }) {
  const wallet = preview.defaultAddress;
  const [mode, setMode] = React.useState<Mode>(wallet ? "propfund_wallet" : "custom");
  const [value, setValue] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const check = checkPayoutAddress(value, wallet);
  const resolved = resolvePayoutAddress(
    mode === "propfund_wallet"
      ? { mode, propfundWallet: wallet }
      : { mode, value, confirmed, propfundWallet: wallet },
  );
  const showError = mode === "custom" && touched && check.error;

  async function submit() {
    if (!resolved.ready || !resolved.address) return;
    setSubmitting(true);
    const res = await withToast(
      () =>
        actions.requestPayout({
          accountId: preview.accountId,
          address: resolved.address,
          confirmControlsAddress: resolved.confirmControlsAddress,
        }),
      {
        loading: "Submitting payout request…",
        success: (p) => `Payout requested. Under review, pays ${formatDayDate(p.paysAt)}.`,
      },
    );
    setSubmitting(false);
    if (res.ok) onDone();
  }

  return (
    <>
      <SheetHeader className="pb-4">
        <SheetTitle>Request payout</SheetTitle>
        <SheetDescription>100% of realized profit, paid in USDC on Arbitrum</SheetDescription>
      </SheetHeader>
      <SheetBody className="flex flex-col gap-5 pb-6">
        <section aria-label="Payout split" className="rounded-xl border border-border p-4">
          <dl>
            <Row
              label="Realized profit"
              value={<span className="font-mono tabular-nums">{formatUsd(preview.profitUsd, 2)}</span>}
            />
            <Row
              label={`You receive ${formatPct(TRADER_SHARE, 0)}`}
              value={<span className="font-mono text-lg font-semibold tabular-nums">{formatUsd(preview.traderUsd, 2)}</span>}
            />
            <Row
              label={`Propfund keeps ${formatPct(PROPFUND_SHARE, 0)}`}
              value={<span className="font-mono tabular-nums text-muted-foreground">{formatUsd(preview.propfundUsd, 2)}</span>}
            />
          </dl>
        </section>

        <section aria-label="After this payout" className="rounded-xl border border-border p-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">After this payout</h3>
          <dl className="mt-2">
            <Row label="New baseline" value={<span className="font-mono tabular-nums">{formatUsd(preview.newBaseline, 2)}</span>} />
            <Row
              label="Daily loss limit"
              value={<span className="font-mono tabular-nums">{formatUsd(preview.newDailyLossLimit, 2)}</span>}
            />
            <Row
              label="Max loss breach at"
              value={<span className="font-mono tabular-nums">{formatUsd(preview.newMaxLossLevel, 2)}</span>}
            />
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            Your balance drops by the profit, and your limits reset from the new baseline.
          </p>
        </section>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Payout address (USDC on Arbitrum)</legend>
          {wallet && (
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                mode === "propfund_wallet" ? "border-primary/60 bg-primary/5" : "border-border",
              )}
            >
              <input
                type="radio"
                name="payout-address"
                aria-label="Your Propfund wallet"
                className="mt-0.5 accent-[hsl(var(--primary))]"
                checked={mode === "propfund_wallet"}
                onChange={() => setMode("propfund_wallet")}
              />
              <span className="min-w-0">
                <span className="block font-medium">Your Propfund wallet</span>
                <span className="block truncate font-mono text-xs text-muted-foreground" title={wallet}>
                  {truncateAddress(wallet, 10, 8)}
                </span>
              </span>
            </label>
          )}
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
              mode === "custom" ? "border-primary/60 bg-primary/5" : "border-border",
            )}
          >
            <input
              type="radio"
              name="payout-address"
              aria-label="Use another Arbitrum address"
              className="mt-0.5 accent-[hsl(var(--primary))]"
              checked={mode === "custom"}
              onChange={() => setMode("custom")}
            />
            <span className="font-medium">Use another Arbitrum address</span>
          </label>

          {mode === "custom" && (
            <div className="flex flex-col gap-3 pl-1">
              <div>
                <Label htmlFor="payout-custom-address" className="sr-only">
                  Arbitrum address
                </Label>
                <Input
                  id="payout-custom-address"
                  placeholder="0x…"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setConfirmed(false);
                  }}
                  onBlur={() => setTouched(true)}
                  aria-invalid={showError ? true : undefined}
                  aria-describedby={showError ? "payout-address-error" : undefined}
                />
                {showError && (
                  <p id="payout-address-error" className="mt-1.5 text-xs text-destructive">
                    {check.error}
                  </p>
                )}
                {check.valid && check.isPropfundWallet && (
                  <p className="mt-1.5 text-xs text-muted-foreground">This is your Propfund wallet.</p>
                )}
              </div>
              {resolved.needsConfirmation && (
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <Checkbox className="mt-0.5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  <span>{CUSTOM_ADDRESS_CONFIRM_COPY}</span>
                </label>
              )}
              <p className="text-xs text-muted-foreground">The address is locked for this request once you confirm.</p>
            </div>
          )}
        </fieldset>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
          <p className="flex gap-2">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Pays <span className="font-medium">{formatDayDate(preview.paysAt)}</span>, {PAYOUT_REVIEW_DAYS} days after you
              request.
            </span>
          </p>
          <p className="flex gap-2 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              You can keep trading during the review, and those trades are reviewed too. A confirmed violation voids the
              payout.
            </span>
          </p>
        </div>
      </SheetBody>
      <SheetFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="button" disabled={!resolved.ready} loading={submitting} onClick={() => void submit()}>
          Confirm payout request
        </Button>
      </SheetFooter>
    </>
  );
}
