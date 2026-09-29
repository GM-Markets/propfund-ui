"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { PerpPicker } from "./PerpPicker";
import { SizePctSlider } from "./SizePctSlider";
import {
  absMoney,
  displayCoin,
  formatCoinSize,
  formatPx,
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
  onMarketTypeChange,
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
  onMarketTypeChange: (type: MarketType) => void;
  onSubmit: () => void;
}) {
  const selected = markets.find((m) => m.coin === pair);
  const mid = selected?.mid ?? 0;
  const maxLev = selected?.max_leverage ?? 50;
  const lev = Math.min(Number(leverage) || 1, maxLev);
  const amountNum = Number(amount);
  const margin =
    sizeUnit === "usd" ? amountNum : marketType === "spot" || lev <= 0 ? amountNum * mid : (amountNum * mid) / lev;
  const notional = marketType === "spot" ? margin : margin * lev;
  const coinSize = mid > 0 ? notional / mid : 0;
  const buyLabel = marketType === "spot" ? "Buy" : "Long";
  const sellLabel = marketType === "spot" ? "Sell" : "Short";
  const sizeLabel = marketType === "spot" ? (sizeUnit === "usd" ? "Amount" : "Size") : sizeUnit === "usd" ? "Margin" : "Size";
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
    <Card className="h-fit border-border/80 shadow-none lg:sticky lg:top-20">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1" role="tablist" aria-label="Order type">
            <button
              type="button"
              role="tab"
              aria-selected
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
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
          {mid > 0 ? (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Mark</p>
              <p className="font-mono text-lg font-semibold tabular-nums leading-none">{formatPx(mid)}</p>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1" role="tablist" aria-label="Market type">
          {(["perp", "spot"] as const).map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={marketType === type}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                marketType === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
              onClick={() => onMarketTypeChange(type)}
            >
              {type === "perp" ? "Perp" : "Spot"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
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
            <Label>{marketType === "perp" ? "Perp" : "Coin"}</Label>
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
                      sizeUnit === unit ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    )}
                    onClick={() => onSizeUnitChange(unit)}
                  >
                    {unit === "usd" ? "USDC" : displayCoin(pair)}
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
              {marketType === "spot"
                ? `${absMoney(notional)} · ${formatCoinSize(coinSize)} ${displayCoin(pair)}`
                : sizeUnit === "usd"
                  ? `${absMoney(notional)} position · ${formatCoinSize(coinSize)} ${displayCoin(pair)}`
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
            {side === "buy" ? buyLabel : sellLabel} {displayCoin(pair)}
            {sizeUnit === "usd" && Number.isFinite(notional) && notional > 0 ? ` · ${absMoney(notional)}` : ""}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function coinSpendMax(spendMax: number, mid: number, marketType: MarketType, lev: number): number {
  if (mid <= 0) return 0;
  if (marketType === "spot") return spendMax / mid;
  return (spendMax * Math.max(1, lev)) / mid;
}
