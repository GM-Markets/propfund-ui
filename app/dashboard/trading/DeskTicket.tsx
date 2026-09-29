"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { PerpPicker } from "./PerpPicker";
import { SizePctSlider } from "./SizePctSlider";
import {
  absMoney,
  displayCoin,
  formatCoinSize,
  marketLabel,
  type DeskMarket,
  type MarketType,
  type OrderSide,
  type SizeUnit,
} from "./desk-types";

export function DeskTicket({
  pair,
  side,
  amount,
  sizeUnit,
  leverage,
  marketType,
  markets,
  pending,
  availableUsd,
  onPairChange,
  onSideChange,
  onAmountChange,
  onSizeUnitChange,
  onLeverageChange,
  onSubmit,
}: {
  pair: string;
  side: OrderSide;
  amount: string;
  sizeUnit: SizeUnit;
  leverage: string;
  marketType: MarketType;
  markets: DeskMarket[];
  pending: boolean;
  availableUsd: number;
  onPairChange: (pair: string) => void;
  onSideChange: (side: OrderSide) => void;
  onAmountChange: (qty: string) => void;
  onSizeUnitChange: (unit: SizeUnit) => void;
  onLeverageChange: (lev: string) => void;
  onSubmit: () => void;
}) {
  const selected = markets.find((m) => m.coin === pair);
  const mid = selected?.mid ?? 0;
  const maxLev = selected?.max_leverage ?? 50;
  const lev = Math.min(Number(leverage) || 1, maxLev);
  const amountNum = Number(amount);
  const margin =
    sizeUnit === "usd" ? amountNum : marketType === "perp" && lev > 0 ? (amountNum * mid) / lev : amountNum * mid;
  const notional = marketType === "perp" ? margin * lev : margin;
  const coinSize = mid > 0 ? notional / mid : 0;
  const buyLabel = marketType === "perp" ? "Long" : "Buy";
  const sellLabel = marketType === "perp" ? "Short" : "Sell";
  const pairLabel = selected ? marketLabel(selected) : displayCoin(pair);
  const sizeLabel =
    marketType === "perp" ? (sizeUnit === "usd" ? "Margin" : "Size") : sizeUnit === "usd" ? "Amount" : "Size";
  const cashBook = marketType !== "perp";
  const spendMax = Math.max(0, availableUsd);
  const sliderEnabled = spendMax > 0 && Number.isFinite(spendMax);
  const amountPct =
    sliderEnabled && sizeUnit === "usd" && spendMax > 0
      ? Math.max(0, Math.min(100, Math.round((Math.max(0, amountNum) / spendMax) * 100)))
      : sliderEnabled && sizeUnit === "coin" && mid > 0
        ? Math.max(0, Math.min(100, Math.round((Math.max(0, amountNum) / coinSpendMax(spendMax, mid, marketType, lev)) * 100)))
        : 0;

  function applyPct(pct: number) {
    const clamped = Math.max(0, Math.min(100, pct));
    if (sizeUnit === "usd") {
      onAmountChange(((spendMax * clamped) / 100).toFixed(2));
      return;
    }
    const maxCoin = coinSpendMax(spendMax, mid, marketType, lev);
    onAmountChange(((maxCoin * clamped) / 100).toFixed(6));
  }

  return (
    <aside className="desk-ticket-rail" aria-label="Order ticket">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="desk-ticket-form"
        >
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1" role="tablist" aria-label="Order type">
            <button
              type="button"
              role="tab"
              aria-selected
              className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-foreground"
            >
              Market
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              disabled
              title="Limit orders are not on the virtual desk yet"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
            >
              Limit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={side === "buy" ? "default" : "outline"}
              onClick={() => onSideChange("buy")}
              className={cn(side === "buy" && "bg-success text-success-foreground hover:bg-success/90")}
            >
              {buyLabel}
            </Button>
            <Button
              type="button"
              variant={side === "sell" ? "default" : "outline"}
              onClick={() => onSideChange("sell")}
              className={cn(side === "sell" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            >
              {sellLabel}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Available to trade</span>
            <button
              type="button"
              className="font-mono text-sm font-semibold tabular-nums text-foreground hover:text-primary disabled:text-muted-foreground disabled:hover:text-muted-foreground"
              disabled={!sliderEnabled}
              onClick={() => applyPct(100)}
            >
              {sliderEnabled ? absMoney(spendMax) : "—"}
            </button>
          </div>

          <div className="space-y-1.5">
            <Label>{marketType === "perp" ? "Perp" : marketType === "outcome" ? "Outcome" : "Coin"}</Label>
            <PerpPicker
              markets={markets}
              value={pair}
              onChange={onPairChange}
              noun={marketType === "perp" ? "perps" : "spots"}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="size">{sizeLabel}</Label>
              <div className="grid grid-cols-2 gap-1 rounded-md border border-border p-0.5" role="tablist" aria-label="Size unit">
                {(["usd", "coin"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    role="tab"
                    aria-selected={sizeUnit === unit}
                    className={cn(
                      "rounded px-2 py-0.5 text-[11px] font-medium",
                      sizeUnit === unit ? "bg-secondary text-foreground" : "text-muted-foreground",
                    )}
                    onClick={() => onSizeUnitChange(unit)}
                  >
                    {unit === "usd" ? "USDC" : pairLabel}
                  </button>
                ))}
              </div>
            </div>
            <Input
              id="size"
              type="number"
              inputMode="decimal"
              step={sizeUnit === "usd" ? "1" : "0.0001"}
              min="0"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
            />
            <SizePctSlider
              value={amountPct}
              disabled={!sliderEnabled}
              onChange={applyPct}
              ariaLabel="Percent of available cash"
            />
            <p className="text-xs text-muted-foreground">
              {cashBook
                ? `${absMoney(notional)} · ${formatCoinSize(coinSize)} ${pairLabel}`
                : sizeUnit === "usd"
                  ? `${absMoney(notional)} position · ${formatCoinSize(coinSize)} ${pairLabel}`
                  : `${absMoney(notional)} position · margin ${absMoney(margin)}`}
            </p>
          </div>

          {marketType === "perp" && (
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-3">
                <Label htmlFor="leverage">Leverage</Label>
                <p className="font-mono text-sm font-semibold tabular-nums">
                  {lev}x
                  <span className="ml-2 text-xs font-normal text-muted-foreground">HL max {maxLev}x</span>
                </p>
              </div>
              <input
                id="leverage"
                type="range"
                min={1}
                max={Math.max(1, maxLev)}
                step={1}
                value={lev}
                aria-label={`Leverage, 1 to ${maxLev}x`}
                onChange={(e) => onLeverageChange(e.target.value)}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>1x</span>
                <span>{maxLev}x</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            loading={pending}
            className={cn(
              "w-full",
              side === "buy"
                ? "bg-success text-success-foreground hover:bg-success/90"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {side === "buy" ? buyLabel : sellLabel} {pairLabel}
            {sizeUnit === "usd" && Number.isFinite(notional) && notional > 0 ? ` · ${absMoney(notional)}` : ""}
          </Button>
        </form>
    </aside>
  );
}

function coinSpendMax(spendMax: number, mid: number, marketType: MarketType, lev: number): number {
  if (mid <= 0) return 0;
  if (marketType !== "perp") return spendMax / mid;
  return (spendMax * Math.max(1, lev)) / mid;
}
