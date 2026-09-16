"use client";

import * as React from "react";

import { PaneTabs, PaneTabsContent, PaneTabsList, PaneTabsTrigger } from "@/components/ui/pane-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPct, formatPrice, formatTime } from "@/lib/propfund/format";
import { useOrderBook, useRecentTrades } from "@/lib/propfund/hooks";
import { getMarket } from "@/lib/propfund/markets";
import { bookView, formatSize, type DepthRow } from "@/lib/propfund/terminal";
import { cn } from "@/lib/utils";

import { useTerminal } from "./terminal-context";

/** Order book (asks above, spread, bids below, depth bars) and recent trades. */
export function OrderBookPane({ className }: { className?: string }) {
  const [tab, setTab] = React.useState("book");
  return (
    <PaneTabs value={tab} onValueChange={setTab} className={cn("flex min-h-0 flex-col bg-background", className)}>
      <div className="flex h-9 shrink-0 items-center border-b border-border px-3">
        <PaneTabsList aria-label="Order book and trades">
          <PaneTabsTrigger value="book">Order Book</PaneTabsTrigger>
          <PaneTabsTrigger value="trades">Trades</PaneTabsTrigger>
        </PaneTabsList>
      </div>
      <PaneTabsContent value="book" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
        <BookTable />
      </PaneTabsContent>
      <PaneTabsContent value="trades" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
        <TradesTable />
      </PaneTabsContent>
    </PaneTabs>
  );
}

const ROW = "relative grid h-5 grid-cols-3 items-center gap-2 px-3 font-mono text-[11px] tabular-nums";

function ColumnHeader({ labels }: { labels: [string, string, string] }) {
  return (
    <div className="grid h-6 shrink-0 grid-cols-3 items-center gap-2 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      <span>{labels[0]}</span>
      <span className="text-right">{labels[1]}</span>
      <span className="text-right">{labels[2]}</span>
    </div>
  );
}

function BookTable() {
  const { symbol, pickPrice } = useTerminal();
  const market = getMarket(symbol);
  const book = useOrderBook(symbol);
  const view = React.useMemo(() => (book ? bookView(book) : null), [book]);

  if (!market || !view) {
    return (
      <div aria-hidden="true" className="flex flex-1 flex-col">
        <ColumnHeader labels={["Price", "Size", "Total"]} />
        {Array.from({ length: 21 }, (_, i) => (
          <div key={i} className={ROW}>
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="ml-auto h-2.5 w-10" />
            <Skeleton className="ml-auto h-2.5 w-10" />
          </div>
        ))}
      </div>
    );
  }

  const row = (r: DepthRow, side: "ask" | "bid") => (
    <button
      type="button"
      key={`${side}-${r.price}`}
      onClick={() => pickPrice(r.price)}
      title="Use this price for a limit order"
      className={cn(ROW, "w-full text-left outline-none hover:bg-accent/50 focus-visible:bg-accent/50")}
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-px right-0", side === "ask" ? "bg-destructive/10" : "bg-success/10")}
        style={{ width: `${(r.depth * 100).toFixed(1)}%` }}
      />
      <span className={cn("relative", side === "ask" ? "text-destructive" : "text-success")}>{formatPrice(r.price, market.tickSize)}</span>
      <span className="relative text-right">{formatSize(r.size)}</span>
      <span className="relative text-right text-muted-foreground">{formatSize(r.total)}</span>
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="order-book">
      <ColumnHeader labels={["Price", "Size", "Total"]} />
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
        <div>{view.asks.map((r) => row(r, "ask"))}</div>
        <div className="grid h-7 grid-cols-3 items-center gap-2 border-y border-border bg-muted/30 px-3 font-mono text-[11px] tabular-nums">
          <span className="text-muted-foreground">Spread</span>
          <span className="text-right">{formatPrice(view.spread, market.tickSize)}</span>
          <span className="text-right text-muted-foreground">{formatPct(view.spreadPct, 3)}</span>
        </div>
        <div>{view.bids.map((r) => row(r, "bid"))}</div>
      </div>
    </div>
  );
}

function TradesTable() {
  const { symbol } = useTerminal();
  const market = getMarket(symbol);
  const trades = useRecentTrades(symbol);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ColumnHeader labels={["Price", "Size", "Time"]} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {!market || !trades
          ? Array.from({ length: 20 }, (_, i) => (
              <div key={i} aria-hidden="true" className={ROW}>
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="ml-auto h-2.5 w-10" />
                <Skeleton className="ml-auto h-2.5 w-12" />
              </div>
            ))
          : trades.map((t) => (
              <div key={t.id} className={ROW}>
                <span className={t.side === "buy" ? "text-success" : "text-destructive"}>{formatPrice(t.price, market.tickSize)}</span>
                <span className="text-right">{formatSize(t.size)}</span>
                <span className="text-right text-muted-foreground">{formatTime(t.at)}</span>
              </div>
            ))}
        {market && trades?.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">Trades appear as prices move.</p>}
      </div>
    </div>
  );
}

export { BookTable, TradesTable };
