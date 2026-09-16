"use client";

import * as React from "react";
import { PanelLeftClose, Search, X } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatSignedPct } from "@/lib/propfund/format";
import { useMarkets, usePrices } from "@/lib/propfund/hooks";
import { groupMarkets } from "@/lib/propfund/terminal";
import type { Market } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

import { MarketIcon } from "./market-icon";
import { useTerminal } from "./terminal-context";

/**
 * The only part of a row that changes on a tick. Each row subscribes for its
 * own market, so the list, its icons and its labels are rendered once and the
 * tick only touches these two numbers.
 */
function MarketQuote({ market }: { market: Market }) {
  const data = usePrices(market.symbol);
  const quote = data?.quote;
  if (!quote) {
    return (
      <>
        <Skeleton className="ml-auto h-3 w-14" />
        <Skeleton className="ml-auto mt-1 h-2.5 w-9" />
      </>
    );
  }
  return (
    <>
      <span className="block text-xs">{formatPrice(quote.price, market.tickSize)}</span>
      <span
        className={cn(
          "block text-[10px]",
          quote.changePct24h > 0 ? "text-success" : quote.changePct24h < 0 ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {formatSignedPct(quote.changePct24h)}
      </span>
    </>
  );
}

const MarketRow = React.memo(function MarketRow({
  market,
  selected,
  onSelect,
}: {
  market: Market;
  selected: boolean;
  onSelect: (symbol: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(market.symbol)}
        aria-current={selected ? "true" : undefined}
        data-testid={`market-${market.symbol}`}
        className={cn(
          "grid h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60",
          selected && "bg-primary/10 shadow-[inset_2px_0_0_hsl(var(--primary))] hover:bg-primary/10",
        )}
      >
        <MarketIcon market={market} />
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">{market.displayName}</span>
          <span className="block truncate text-[10px] text-muted-foreground">{market.name}</span>
        </span>
        <span className="text-right font-mono tabular-nums">
          <MarketQuote market={market} />
        </span>
      </button>
    </li>
  );
});

/** Markets list (PRD §10.3, §12): 12 markets grouped by asset class, search, last price and 24h change. */
export function MarketsPane({ onCollapse, className }: { onCollapse?: () => void; className?: string }) {
  const markets = useMarkets();
  const { symbol, setSymbol } = useTerminal();
  const [query, setQuery] = React.useState("");
  const groups = React.useMemo(() => groupMarkets(markets, query), [markets, query]);

  return (
    <section aria-label="Markets" className={cn("flex min-h-0 flex-col bg-background", className)}>
      <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-border px-2">
        <label className="relative flex min-w-0 flex-1 items-center">
          <span className="sr-only">Search markets</span>
          <Search className="pointer-events-none absolute left-2 size-3.5 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets"
            className="h-8 w-full rounded-md border border-input bg-muted/40 pl-7 pr-7 text-base outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/30 lg:text-xs [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-1.5 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </label>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse markets"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] gap-2 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>Market</span>
        <span className="text-right">Last · 24h</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
        {groups.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">No markets match “{query}”.</p>}
        {groups.map((g) => (
          <div key={g.assetClass} role="group" aria-label={g.label}>
            <div className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">{g.label}</div>
            <ul>
              {g.markets.map((m) => (
                <MarketRow key={m.symbol} market={m} selected={m.symbol === symbol} onSelect={setSymbol} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
