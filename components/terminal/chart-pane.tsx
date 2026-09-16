"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { CandlestickChart, LineChart, Maximize2, Minimize2, Trophy } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountMetrics, useCurrentAccount, useOrders, usePositions } from "@/lib/propfund/hooks";
import { getMarket } from "@/lib/propfund/markets";
import { TIMEFRAMES, type Timeframe } from "@/lib/propfund/mock";
import { TARGET_BANNER_COPY } from "@/lib/propfund/rules";
import { cn } from "@/lib/utils";

import type { ChartPriceLine, ChartStyle } from "./price-chart";
import { useTerminal } from "./terminal-context";

function ChartSkeleton() {
  return <Skeleton aria-hidden="true" className="h-full w-full rounded-none" />;
}

const PriceChart = dynamic(() => import("./price-chart"), { ssr: false, loading: ChartSkeleton });

const TOOLBAR_BUTTON =
  "flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 aria-pressed:bg-accent aria-pressed:text-foreground";

/** Chart toolbar (interval, candle/line, fullscreen) and the lazily loaded chart. */
export function ChartPane({ className }: { className?: string }) {
  const { symbol } = useTerminal();
  const market = getMarket(symbol);
  const [timeframe, setTimeframe] = React.useState<Timeframe>("1m");
  const [style, setStyle] = React.useState<ChartStyle>("candles");
  const [expanded, setExpanded] = React.useState(false);

  const account = useCurrentAccount();
  const positions = usePositions();
  const orders = useOrders();
  const active = account?.status === "active";

  const priceLines = React.useMemo<ChartPriceLine[]>(() => {
    if (!active) return [];
    const out: ChartPriceLine[] = [];
    for (const p of positions ?? []) {
      if (p.symbol !== symbol) continue;
      out.push({ price: p.entryPrice, kind: "entry", title: p.side === "long" ? "Long entry" : "Short entry" });
      if (p.takeProfit !== null) out.push({ price: p.takeProfit, kind: "tp", title: "TP" });
      if (p.stopLoss !== null) out.push({ price: p.stopLoss, kind: "sl", title: "SL" });
    }
    for (const o of orders ?? []) {
      if (o.symbol !== symbol || o.status !== "working" || o.limitPrice === null) continue;
      out.push({ price: o.limitPrice, kind: "limit", title: o.side === "buy" ? "Buy limit" : "Sell limit" });
    }
    return out;
  }, [active, positions, orders, symbol]);

  React.useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <section
      aria-label="Price chart"
      className={cn(
        "flex min-h-0 flex-col bg-background",
        expanded && "fixed inset-0 z-[60] h-dvh",
        className,
      )}
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-2">
        <SegmentedControl
          aria-label="Chart interval"
          size="sm"
          value={timeframe}
          onValueChange={setTimeframe}
          options={TIMEFRAMES.map((tf) => ({ value: tf, label: tf }))}
          className="w-auto bg-transparent p-0 [&>button]:flex-none [&>button]:px-2"
        />
        <span className="h-4 w-px bg-border" aria-hidden="true" />
        <button type="button" aria-label="Candles" aria-pressed={style === "candles"} onClick={() => setStyle("candles")} className={TOOLBAR_BUTTON}>
          <CandlestickChart className="size-4" />
        </button>
        <button type="button" aria-label="Line" aria-pressed={style === "line"} onClick={() => setStyle("line")} className={TOOLBAR_BUTTON}>
          <LineChart className="size-4" />
        </button>
        <button
          type="button"
          aria-label={expanded ? "Exit fullscreen" : "Fullscreen"}
          aria-pressed={expanded}
          onClick={() => setExpanded((e) => !e)}
          className={cn(TOOLBAR_BUTTON, "ml-auto")}
        >
          {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <TargetBanner />
        {market && (
          <PriceChart symbol={symbol} timeframe={timeframe} style={style} tickSize={market.tickSize} priceLines={priceLines} />
        )}
      </div>
    </section>
  );
}

/**
 * "Target reached. Close positions and cancel orders to graduate." (PRD §8). Floats over the top
 * of the chart so it never pushes the panes around when it appears.
 */
function TargetBanner() {
  const metrics = useAccountMetrics();
  if (!metrics?.showTargetBanner) return null;
  return (
    <div
      role="status"
      data-testid="target-banner"
      className="pointer-events-none absolute inset-x-2 top-2 z-10 flex justify-center"
    >
      <p className="flex items-center gap-2 rounded-full border border-success/30 bg-background/90 px-3.5 py-1.5 text-xs font-medium text-success shadow-lg backdrop-blur">
        <Trophy className="size-3.5 shrink-0" />
        {TARGET_BANNER_COPY}
      </p>
    </div>
  );
}
