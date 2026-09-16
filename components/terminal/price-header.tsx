"use client";

import { ChevronDown } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatSignedPct } from "@/lib/propfund/format";
import { usePrices } from "@/lib/propfund/hooks";
import { ASSET_CLASS_LABEL } from "@/lib/propfund/terminal";
import { cn } from "@/lib/utils";

import { MarketIcon } from "./market-icon";
import { useTerminal } from "./terminal-context";

/** Instrument chip, last price, 24h change and range (PRD §10.3 price header). */
export function PriceHeader({
  onInstrumentClick,
  instrumentExpanded,
  className,
}: {
  onInstrumentClick?: () => void;
  instrumentExpanded?: boolean;
  className?: string;
}) {
  const { symbol } = useTerminal();
  const data = usePrices(symbol);

  if (!data) {
    return (
      <div aria-hidden="true" className={cn("flex h-14 items-center gap-4 bg-background px-3", className)}>
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="hidden h-4 w-32 sm:block" />
      </div>
    );
  }

  const { market, quote } = data;
  const up = quote.change24h > 0;
  const down = quote.change24h < 0;
  const changeTone = up ? "text-success" : down ? "text-destructive" : "text-muted-foreground";
  const sign = up ? "+" : down ? "-" : "";

  return (
    <div className={cn("flex h-14 min-w-0 items-center gap-3 bg-background px-3 sm:gap-5", className)}>
      <button
        type="button"
        onClick={onInstrumentClick}
        disabled={!onInstrumentClick}
        aria-expanded={onInstrumentClick ? instrumentExpanded : undefined}
        aria-label={onInstrumentClick ? `${market.displayName}. Show markets` : undefined}
        className="-ml-1 flex min-w-0 shrink-0 items-center gap-2 rounded-lg px-1 py-1 text-left outline-none transition-colors enabled:hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-default"
      >
        <MarketIcon market={market} size="md" />
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-sm font-semibold leading-tight">
            {market.displayName}
            {onInstrumentClick && (
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", instrumentExpanded && "rotate-180")} />
            )}
          </span>
          <span className="block max-w-[9rem] truncate text-[11px] leading-tight text-muted-foreground">{market.name}</span>
        </span>
      </button>

      <div className="flex shrink-0 items-baseline gap-2.5">
        <span
          data-testid="last-price"
          className={cn(
            "font-mono text-lg font-semibold tabular-nums leading-none transition-colors sm:text-xl",
            quote.direction === "up" ? "text-success" : quote.direction === "down" ? "text-destructive" : "text-foreground",
          )}
        >
          {formatPrice(quote.price, market.tickSize)}
        </span>
        <span className={cn("whitespace-nowrap font-mono text-xs tabular-nums", changeTone)}>
          <span className="mr-1 hidden sm:inline">
            {sign}
            {formatPrice(Math.abs(quote.change24h), market.tickSize)}
          </span>
          <span className="sm:hidden">{formatSignedPct(quote.changePct24h)}</span>
          <span className="hidden sm:inline">({formatSignedPct(quote.changePct24h)})</span>
        </span>
      </div>

      {/* Stats that don't fit wrap onto a clipped second line instead of squeezing. */}
      <dl className="ml-auto hidden h-[30px] min-w-0 flex-1 flex-wrap justify-end gap-x-5 overflow-hidden text-[11px] md:flex">
        <Stat label="24h high" value={formatPrice(quote.high24h, market.tickSize)} />
        <Stat label="24h low" value={formatPrice(quote.low24h, market.tickSize)} />
        <Stat label="Bid · Ask" value={`${formatPrice(quote.bid, market.tickSize)} · ${formatPrice(quote.ask, market.tickSize)}`} />
        <Stat label="Class" value={ASSET_CLASS_LABEL[market.assetClass]} mono={false} />
      </dl>
    </div>
  );
}

function Stat({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="h-[30px] shrink-0 whitespace-nowrap">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground", mono && "font-mono tabular-nums")}>{value}</dd>
    </div>
  );
}
