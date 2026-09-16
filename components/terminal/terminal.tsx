"use client";

import * as React from "react";
import { PanelLeftOpen } from "lucide-react";

import { AccountEventTakeover } from "@/components/account-events";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMarkets } from "@/lib/propfund/hooks";
import { cn } from "@/lib/utils";

import { AccountStrip } from "./account-strip";
import { ActivityTabs } from "./activity-tabs";
import { ChartPane } from "./chart-pane";
import { TERMINAL_GRID, TERMINAL_ROOT } from "./layout";
import { MarketIcon } from "./market-icon";
import { MarketsPane } from "./markets-pane";
import { MobileMarketSwitcher, MobileTradeBar } from "./mobile-trade";
import { OrderBookPane } from "./order-book-pane";
import { OrderForm } from "./order-form";
import { PriceHeader } from "./price-header";
import { TerminalProvider, useTerminal } from "./terminal-context";

const DESKTOP_QUERY = "(min-width: 1024px)";
const WIDE_QUERY = "(min-width: 1536px)";

function matches(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

/** Propfund terminal (PRD §10.3). Reads `?symbol=`; wrap in <Suspense>. */
export function Terminal() {
  return (
    <TerminalProvider>
      <TooltipProvider delayDuration={200}>
        <TerminalLayout />
        <AccountEventTakeover />
      </TooltipProvider>
    </TerminalProvider>
  );
}

function TerminalLayout() {
  const { symbol } = useTerminal();
  // null = follow the breakpoint (open on wide screens); a click makes it explicit.
  const [marketsOpen, setMarketsOpen] = React.useState<boolean | null>(null);

  const toggleMarkets = React.useCallback(() => {
    setMarketsOpen((open) => !(open ?? matches(WIDE_QUERY)));
  }, []);

  const onInstrumentClick = React.useCallback(() => {
    if (matches(DESKTOP_QUERY)) toggleMarkets();
    else document.getElementById("mobile-markets")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [toggleMarkets]);

  return (
    <div className={TERMINAL_ROOT} data-testid="terminal">
      <h1 className="sr-only">Terminal</h1>
      <AccountStrip />

      <div className={TERMINAL_GRID}>
        <MarketsPane
          onCollapse={toggleMarkets}
          className={cn(
            "hidden lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:w-[232px]",
            marketsOpen === null ? "2xl:flex" : marketsOpen ? "lg:flex" : "",
          )}
        />
        <MarketsRail
          onExpand={toggleMarkets}
          className={cn(
            "hidden lg:col-start-1 lg:row-span-3 lg:row-start-1",
            marketsOpen === null ? "lg:flex 2xl:hidden" : marketsOpen ? "" : "lg:flex",
          )}
        />

        <PriceHeader
          onInstrumentClick={onInstrumentClick}
          instrumentExpanded={marketsOpen ?? undefined}
          className="lg:col-span-2 lg:col-start-2 lg:row-start-1"
        />
        <ChartPane className="h-[340px] lg:col-start-2 lg:row-start-2 lg:h-auto" />
        <OrderBookPane className="hidden lg:col-start-3 lg:row-start-2 lg:flex" />
        <ActivityTabs className="min-h-[240px] lg:col-span-2 lg:col-start-2 lg:row-start-3 lg:h-auto" />

        <aside
          aria-label="Order form"
          className="hidden min-h-0 overflow-y-auto overscroll-contain bg-background lg:col-start-4 lg:row-span-3 lg:row-start-1 lg:block"
        >
          <OrderForm key={symbol} />
        </aside>

        <MobileMarketSwitcher className="lg:hidden" />
      </div>

      <MobileTradeBar />
    </div>
  );
}

function MarketsRail({ onExpand, className }: { onExpand: () => void; className?: string }) {
  const markets = useMarkets();
  const { symbol, setSymbol } = useTerminal();
  return (
    <nav aria-label="Markets (collapsed)" className={cn("w-11 flex-col items-center gap-1 overflow-y-auto bg-background py-1.5", className)}>
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand markets"
        className="mb-1 flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <PanelLeftOpen className="size-4" />
      </button>
      {markets.map((m) => (
        <button
          key={m.symbol}
          type="button"
          title={`${m.displayName} · ${m.name}`}
          aria-label={m.displayName}
          aria-current={m.symbol === symbol ? "true" : undefined}
          onClick={() => setSymbol(m.symbol)}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60",
            m.symbol === symbol && "bg-primary/10 ring-1 ring-primary/40",
          )}
        >
          <MarketIcon market={m} />
        </button>
      ))}
    </nav>
  );
}
