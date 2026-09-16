"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Trophy, ShieldAlert, Ban, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { APPEAL_CONTACT_EMAIL } from "@/lib/propfund/config";
import { decimalsForTick, formatPrice, formatSignedUsd, formatUsd } from "@/lib/propfund/format";
import {
  actions,
  useAccountMetrics,
  useAction,
  useActiveAccount,
  useCurrentAccount,
  useLivePositions,
  usePrices,
  useRebuyOffer,
  useUser,
} from "@/lib/propfund/hooks";
import { MAX_LEVERAGE, MIN_LEVERAGE, REBUY_DISCOUNT_PCT, quantityForNotional } from "@/lib/propfund/rules";
import {
  SIZE_PCT_STEPS,
  availableToTrade,
  dailyHeadroomAfterStop,
  estimateExitPnl,
  formatSize,
  notionalForShare,
  orderGate,
  parseAmount,
  shareOfBuyingPower,
} from "@/lib/propfund/terminal";
import type { OrderSide, OrderType } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

import { useTerminal } from "./terminal-context";

const LABEL = "text-[11px] text-muted-foreground";
const INPUT_WRAP =
  "flex h-10 items-center rounded-lg border border-input bg-muted/30 px-3 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring/30";
const INPUT = "min-w-0 flex-1 bg-transparent font-mono text-base tabular-nums outline-none placeholder:text-muted-foreground/60 lg:text-sm";

/**
 * Order form (PRD §10.3): Market / Limit, Buy / Sell, size in USD notional with
 * shares of buying power, leverage up to 10×, optional TP / SL with their
 * effect on today's loss headroom. Sell is always interactive; only submit is
 * gated, with a calm helper line.
 */
export function OrderForm({
  initialSide = "buy",
  onPlaced,
  className,
}: {
  initialSide?: OrderSide;
  onPlaced?: () => void;
  className?: string;
}) {
  const current = useCurrentAccount();
  const active = useActiveAccount();
  const user = useUser();
  const metrics = useAccountMetrics(active?.id);

  if (current === undefined || active === undefined || user === undefined || (active && metrics === undefined)) {
    return <OrderFormSkeleton className={className} />;
  }
  if (!active || !metrics || user.barred) return <TradingUnavailable className={className} />;
  return <ActiveOrderForm initialSide={initialSide} onPlaced={onPlaced} className={className} />;
}

export function OrderFormSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-3 p-3", className)}>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-7 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

function ActiveOrderForm({
  initialSide,
  onPlaced,
  className,
}: {
  initialSide: OrderSide;
  onPlaced?: () => void;
  className?: string;
}) {
  const { symbol, pickedPrice } = useTerminal();
  const prices = usePrices(symbol);
  const active = useActiveAccount();
  const metrics = useAccountMetrics(active?.id ?? undefined);
  const positions = useLivePositions(active?.id ?? undefined);
  const place = useAction(actions.placeOrder);

  const [side, setSide] = React.useState<OrderSide>(initialSide);
  const [type, setType] = React.useState<OrderType>("market");
  const [sizeInput, setSizeInput] = React.useState("");
  const [limitInput, setLimitInput] = React.useState("");
  const [leverage, setLeverage] = React.useState<number>(MAX_LEVERAGE);
  const [advanced, setAdvanced] = React.useState(false);
  const [tpInput, setTpInput] = React.useState("");
  const [slInput, setSlInput] = React.useState("");

  const market = prices?.market;
  const quote = prices?.quote;
  const decimals = market ? decimalsForTick(market.tickSize) : 2;

  // A price clicked in the order book pre-fills a limit order (ignore picks made before this form mounted).
  const seenNonce = React.useRef(pickedPrice?.nonce ?? 0);
  React.useEffect(() => {
    if (!pickedPrice || pickedPrice.nonce === seenNonce.current) return;
    seenNonce.current = pickedPrice.nonce;
    setType("limit");
    setLimitInput(pickedPrice.price.toFixed(decimals));
  }, [pickedPrice, decimals]);

  const { reset: resetError } = place;
  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    resetError();
  };

  if (!market || !quote || !metrics) return <OrderFormSkeleton className={className} />;

  const mark = quote.price;
  const buyingPowerUsd = availableToTrade(metrics.freeMarginUsd, leverage);
  const position = positions?.find((p) => p.symbol === symbol) ?? null;
  const opposesPosition = !!position && (position.side === "long" ? side === "sell" : side === "buy");
  const notionalUsd = parseAmount(sizeInput);
  const share = shareOfBuyingPower(notionalUsd, buyingPowerUsd);
  const limitPrice = type === "limit" ? parseAmount(limitInput) : null;
  const takeProfit = parseAmount(tpInput);
  const stopLoss = parseAmount(slInput);
  const reference = type === "limit" && limitPrice !== null ? limitPrice : mark;

  const gate = orderGate({
    active: true,
    pending: place.pending,
    type,
    side,
    notionalUsd,
    buyingPowerUsd,
    opposesPosition,
    mark,
    limitPrice,
    takeProfit,
    stopLoss,
  });

  const tpPnl = takeProfit !== null && notionalUsd ? estimateExitPnl(market, side, notionalUsd, reference, takeProfit) : null;
  const slPnl = stopLoss !== null && notionalUsd ? estimateExitPnl(market, side, notionalUsd, reference, stopLoss) : null;
  const headroom = slPnl !== null && slPnl < 0 ? dailyHeadroomAfterStop(metrics.daily, slPnl) : null;

  const setShare = (s: number) => {
    const n = notionalForShare(buyingPowerUsd, s);
    edit(setSizeInput)(n > 0 ? n.toFixed(2) : "");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!gate.canSubmit || !market || notionalUsd === null) return;
    const verb = side === "buy" ? "Buy" : "Sell";
    const id = toast.loading(type === "market" ? `${verb} ${market.displayName}…` : `Placing ${verb.toLowerCase()} limit…`);
    try {
      const order = await place.run({
        symbol,
        side,
        type,
        notionalUsd,
        leverage,
        limitPrice: type === "limit" ? limitPrice : null,
        tp: takeProfit,
        sl: stopLoss,
      });
      if (order.status === "filled" && order.fillPrice !== null) {
        toast.success(
          `${side === "buy" ? "Bought" : "Sold"} ${formatUsd(order.notionalUsd, 2)} of ${market.displayName} at ${formatPrice(order.fillPrice, market.tickSize)}`,
          { id },
        );
      } else {
        toast.success(
          `${verb} limit placed: ${formatUsd(order.notionalUsd, 2)} at ${formatPrice(order.limitPrice ?? 0, market.tickSize)}`,
          { id },
        );
      }
      setSizeInput("");
      setTpInput("");
      setSlInput("");
      onPlaced?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't place the order. Please try again.", { id });
    }
  }

  const exitsSet = (takeProfit !== null ? 1 : 0) + (stopLoss !== null ? 1 : 0);

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col gap-3 p-3", className)} data-testid="order-form">
      <SegmentedControl
        aria-label="Order type"
        size="sm"
        value={type}
        onValueChange={edit(setType)}
        options={[
          { value: "market", label: "Market" },
          { value: "limit", label: "Limit" },
        ]}
      />
      <SegmentedControl
        aria-label="Side"
        value={side}
        onValueChange={edit(setSide)}
        options={[
          { value: "buy", label: "Buy / Long", tone: "buy" },
          { value: "sell", label: "Sell / Short", tone: "sell" },
        ]}
      />

      <dl className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className={LABEL}>Available to trade</dt>
          <dd className="font-mono tabular-nums" data-testid="available-to-trade">
            {formatUsd(buyingPowerUsd, 2)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className={LABEL}>Current position</dt>
          <dd className="truncate font-mono tabular-nums">
            {position ? (
              <>
                <span className={position.side === "long" ? "text-success" : "text-destructive"}>
                  {position.side === "long" ? "Long" : "Short"} {formatUsd(position.notionalUsd, 2)}
                </span>
                <span className={cn("ml-1", position.unrealizedPnl >= 0 ? "text-success" : "text-destructive")}>
                  ({formatSignedUsd(position.unrealizedPnl)})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </dd>
        </div>
      </dl>

      {type === "limit" && (
        <div className="space-y-1.5">
          <label htmlFor={`limit-${symbol}`} className={LABEL}>
            Limit price
          </label>
          <div className={INPUT_WRAP}>
            <input
              id={`limit-${symbol}`}
              inputMode="decimal"
              autoComplete="off"
              placeholder={formatPrice(mark, market.tickSize)}
              value={limitInput}
              onChange={(e) => edit(setLimitInput)(e.target.value)}
              className={INPUT}
            />
            <button
              type="button"
              onClick={() => edit(setLimitInput)(mark.toFixed(decimals))}
              className="ml-2 rounded px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
            >
              Mark
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor={`size-${symbol}`} className={LABEL}>
          Size
        </label>
        <div className={INPUT_WRAP}>
          <input
            id={`size-${symbol}`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={sizeInput}
            onChange={(e) => edit(setSizeInput)(e.target.value)}
            className={INPUT}
            data-testid="order-size"
          />
          <span className="ml-2 text-xs text-muted-foreground">USD</span>
        </div>
        {/* Always rendered so typing a size doesn't shift the form. */}
        <p className="h-4 font-mono text-[11px] leading-4 tabular-nums text-muted-foreground">
          {notionalUsd !== null && reference > 0
            ? `≈ ${formatSize(quantityForNotional(market, notionalUsd, reference))} ${market.quote === "JPY" ? "USD" : market.symbol}`
            : ""}
        </p>
        <Slider
          aria-label="Size as a share of available to trade"
          value={Math.round(share * 100)}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => setShare(v / 100)}
          className="mt-1"
        />
        <div className="grid grid-cols-5 gap-1">
          {SIZE_PCT_STEPS.map((s) => {
            const on = Math.abs(share - s) < 0.005 && (s > 0 || !notionalUsd);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setShare(s)}
                aria-pressed={on}
                className={cn(
                  "h-7 rounded-md border border-border font-mono text-[11px] tabular-nums text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
                  on && "border-primary/50 bg-primary/10 text-foreground",
                )}
              >
                {Math.round(s * 100)}%
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setAdvanced((a) => !a)}
          aria-expanded={advanced}
          aria-controls={`advanced-${symbol}`}
          className="flex h-9 w-full items-center justify-between gap-2 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <span className="font-medium">Advanced order options</span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            {leverage}×{exitsSet > 0 ? ` · ${exitsSet === 2 ? "TP/SL" : takeProfit !== null ? "TP" : "SL"}` : ""}
            <ChevronDown className={cn("size-3.5 transition-transform", advanced && "rotate-180")} />
          </span>
        </button>
        {advanced && (
          <div id={`advanced-${symbol}`} className="space-y-3 border-t border-border px-3 pb-3 pt-2.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={`leverage-${symbol}`} className={LABEL}>
                  Leverage
                </label>
                <span className="font-mono text-xs tabular-nums">{leverage}×</span>
              </div>
              <Slider
                id={`leverage-${symbol}`}
                value={leverage}
                min={MIN_LEVERAGE}
                max={MAX_LEVERAGE}
                step={1}
                onValueChange={edit(setLeverage)}
              />
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>{MIN_LEVERAGE}×</span>
                <span>{MAX_LEVERAGE}×</span>
              </div>
            </div>

            <ExitInput
              id={`tp-${symbol}`}
              label="Take-profit"
              value={tpInput}
              onChange={edit(setTpInput)}
              placeholder={side === "buy" ? "Above entry" : "Below entry"}
              estimate={tpPnl}
            />
            <ExitInput
              id={`sl-${symbol}`}
              label="Stop-loss"
              value={slInput}
              onChange={edit(setSlInput)}
              placeholder={side === "buy" ? "Below entry" : "Above entry"}
              estimate={slPnl}
            />

            {headroom && slPnl !== null && (
              <p
                data-testid="headroom-effect"
                className={cn(
                  "rounded-md bg-muted/40 px-2.5 py-2 text-[11px] leading-relaxed",
                  headroom.tone === "neutral" && "text-muted-foreground",
                  headroom.tone === "amber" && "text-warning",
                  headroom.tone === "red" && "text-destructive",
                )}
              >
                {headroom.breaches ? (
                  <>
                    If this stop-loss hits ({formatSignedUsd(slPnl)}), today&apos;s loss would pass your daily limit. Only{" "}
                    {formatUsd(metrics.daily.remainingUsd, 2)} of headroom is left today.
                  </>
                ) : (
                  <>
                    If this stop-loss hits: {formatSignedUsd(slPnl)}. Daily loss headroom{" "}
                    <span className="font-mono tabular-nums">
                      {formatUsd(metrics.daily.remainingUsd)} → {formatUsd(headroom.remainingAfterUsd)}
                    </span>{" "}
                    ({Math.round(headroom.usedAfter * 100)}% of the limit used).
                  </>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Button
          type="submit"
          size="lg"
          loading={place.pending}
          disabled={!gate.canSubmit}
          data-testid="submit-order"
          className={cn(
            "h-11 w-full text-sm font-semibold hover:shadow-none",
            side === "buy"
              ? "bg-success text-success-foreground hover:bg-success/90"
              : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          )}
        >
          {side === "buy" ? "Buy / Long" : "Sell / Short"} {market.displayName}
        </Button>
        <p aria-live="polite" className="min-h-4 text-center text-[11px] leading-4 text-muted-foreground" data-testid="order-helper">
          {place.error?.message ?? gate.reason ?? ""}
        </p>
      </div>

      <dl className="space-y-1 border-t border-border pt-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className={LABEL}>Order value</dt>
          <dd className="font-mono tabular-nums">{notionalUsd ? formatUsd(notionalUsd, 2) : "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className={LABEL}>{type === "market" ? "Est. fill" : "Fills at"}</dt>
          <dd className="font-mono tabular-nums">{formatPrice(reference, market.tickSize)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className={LABEL}>Fee</dt>
          <dd className="font-mono tabular-nums">$0.00</dd>
        </div>
      </dl>
    </form>
  );
}

function ExitInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  estimate,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  estimate: number | null;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {estimate !== null && (
          <span className={cn("font-mono text-[11px] tabular-nums", estimate >= 0 ? "text-success" : "text-destructive")}>
            {formatSignedUsd(estimate)}
          </span>
        )}
      </div>
      <div className={cn(INPUT_WRAP, "h-9")}>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT}
        />
        {value && (
          <button type="button" onClick={() => onChange("")} className="ml-2 text-[11px] text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/** Calm empty state when there's no tradable account (PRD §6). */
function TradingUnavailable({ className }: { className?: string }) {
  const current = useCurrentAccount();
  const user = useUser();
  const rebuy = useRebuyOffer();

  let icon = Trophy;
  let title = "No active account";
  let body = "Buy a challenge to trade. Prices, the chart and the order book stay live.";
  let cta: React.ReactNode = (
    <Button asChild className="w-full">
      <Link href="/dashboard/challenges">Buy a challenge</Link>
    </Button>
  );

  if (user?.barred || current?.status === "terminated") {
    icon = Ban;
    title = "Trading is closed";
    body = "This profile was terminated after a confirmed violation. If you think this is a mistake, contact us to appeal.";
    cta = (
      <Button asChild variant="outline" className="w-full">
        <a href={`mailto:${APPEAL_CONTACT_EMAIL}`}>Contact {APPEAL_CONTACT_EMAIL}</a>
      </Button>
    );
  } else if (current?.status === "breached") {
    icon = ShieldAlert;
    title = "Account breached";
    body = "This account is read-only. Positions were closed at the breach and orders were cancelled.";
    cta = (
      <div className="flex w-full flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/dashboard/challenges">
            {rebuy ? `Start a new challenge · ${REBUY_DISCOUNT_PCT}% off` : "Buy a challenge"}
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href="/dashboard/history">View statement</Link>
        </Button>
      </div>
    );
  } else if (current?.status === "closed_inactive") {
    icon = Clock;
    title = "Closed for inactivity";
    body = "This account had no trades for 60 days and was closed.";
  } else if (current?.status === "graduated") {
    title = "Challenge passed";
    body = "Your funded account opens from the overview.";
    cta = (
      <Button asChild className="w-full">
        <Link href="/dashboard">Go to overview</Link>
      </Button>
    );
  }

  const Icon = icon;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-5 py-10 text-center", className)} data-testid="trading-unavailable">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <div className="mt-1 w-full max-w-64">{cta}</div>
    </div>
  );
}
