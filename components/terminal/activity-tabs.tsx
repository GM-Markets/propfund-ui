"use client";

import * as React from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PaneTabs, PaneTabsContent, PaneTabsList, PaneTabsTrigger } from "@/components/ui/pane-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatPrice, formatSignedUsd, formatTime, formatUsd } from "@/lib/propfund/format";
import { actions, useCurrentAccount, useFills, useLivePositions, useOrders, type LivePosition } from "@/lib/propfund/hooks";
import { getMarket } from "@/lib/propfund/markets";
import { isServiceError } from "@/lib/propfund/mock";
import { FILL_KIND_LABEL, formatSize } from "@/lib/propfund/terminal";
import type { Fill, Order } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

import { MarketIcon } from "./market-icon";
import { useTerminal } from "./terminal-context";

/** Bottom tabs (PRD §10.3): Positions (n) / Orders (n) / Trade history. */

const TH = "h-8 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground first:pl-4 last:pr-4";
const TD = "h-10 px-3 font-mono text-xs tabular-nums first:pl-4 last:pr-4";

function pnlTone(n: number) {
  return n > 0 ? "text-success" : n < 0 ? "text-destructive" : "text-muted-foreground";
}

function priceOf(symbol: string, price: number | null) {
  const m = getMarket(symbol);
  return price === null ? "—" : m ? formatPrice(price, m.tickSize) : String(price);
}

export function ActivityTabs({ className }: { className?: string }) {
  const account = useCurrentAccount();
  const positions = useLivePositions();
  const orders = useOrders();
  const fills = useFills();
  const [tab, setTab] = React.useState("positions");
  const [closingAll, setClosingAll] = React.useState(false);

  const working = React.useMemo(() => orders?.filter((o) => o.status === "working"), [orders]);
  const active = account?.status === "active";
  const loading = account === undefined || positions === undefined || orders === undefined || fills === undefined;

  async function closeAll() {
    if (!positions?.length) return;
    setClosingAll(true);
    const id = toast.loading(`Closing ${positions.length} position${positions.length === 1 ? "" : "s"}…`);
    let realized = 0;
    let failed = 0;
    let lastError = "";
    // Sequential: each close re-evaluates the account (a close can flatten it and graduate).
    for (const p of positions) {
      try {
        const fill = await actions.closePosition(p.id);
        realized += fill.realizedPnl;
      } catch (e) {
        // Already closed by the engine (TP/SL or a breach) in the meantime: nothing to do.
        if (isServiceError(e) && e.code === "NOT_FOUND") continue;
        failed += 1;
        lastError = e instanceof Error ? e.message : "Couldn't close a position.";
      }
    }
    setClosingAll(false);
    if (failed) toast.error(`${failed} position${failed === 1 ? "" : "s"} not closed. ${lastError}`, { id });
    else toast.success(`All positions closed · ${formatSignedUsd(realized)} realized`, { id });
  }

  return (
    <PaneTabs value={tab} onValueChange={setTab} className={cn("flex min-h-0 flex-col bg-background", className)}>
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border pl-4 pr-2">
        <PaneTabsList aria-label="Account activity" className="gap-5">
          <PaneTabsTrigger value="positions" size="md" data-testid="tab-positions">
            Positions <Count n={positions?.length} />
          </PaneTabsTrigger>
          <PaneTabsTrigger value="orders" size="md" data-testid="tab-orders">
            Orders <Count n={working?.length} />
          </PaneTabsTrigger>
          <PaneTabsTrigger value="history" size="md">
            <span className="sm:hidden">History</span>
            <span className="hidden sm:inline">Trade history</span>
          </PaneTabsTrigger>
        </PaneTabsList>
        {tab === "positions" && active && !!positions?.length && (
          <Button type="button" variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={closeAll} loading={closingAll} data-testid="close-all">
            Close all
          </Button>
        )}
      </div>

      <PaneTabsContent value="positions" className="min-h-0 flex-1 overflow-auto overscroll-contain">
        {loading ? <RowsSkeleton /> : positions.length === 0 ? <Empty text="No open positions." /> : <PositionsTable positions={positions} readOnly={!active} />}
      </PaneTabsContent>
      <PaneTabsContent value="orders" className="min-h-0 flex-1 overflow-auto overscroll-contain">
        {loading || !working ? <RowsSkeleton /> : working.length === 0 ? <Empty text="No working orders." /> : <OrdersTable orders={working} readOnly={!active} />}
      </PaneTabsContent>
      <PaneTabsContent value="history" className="min-h-0 flex-1 overflow-auto overscroll-contain">
        {loading ? <RowsSkeleton /> : fills.length === 0 ? <Empty text="No trades yet on this account." /> : <HistoryTable fills={fills} />}
      </PaneTabsContent>
    </PaneTabs>
  );
}

function Count({ n }: { n: number | undefined }) {
  return (
    <span className="inline-flex min-w-5 justify-center rounded bg-muted px-1 font-mono text-[10px] tabular-nums text-muted-foreground">
      {n ?? "·"}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="flex h-full min-h-32 items-center justify-center px-4 text-xs text-muted-foreground">{text}</p>;
}

function RowsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2 p-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </div>
  );
}

function Instrument({ symbol, sub }: { symbol: string; sub?: React.ReactNode }) {
  const m = getMarket(symbol);
  return (
    <span className="flex min-w-0 items-center gap-2 font-sans">
      {m && <MarketIcon market={m} />}
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold">{m?.displayName ?? symbol}</span>
        {sub && <span className="block truncate text-[10px] text-muted-foreground">{sub}</span>}
      </span>
    </span>
  );
}

function SideText({ side }: { side: "long" | "short" | "buy" | "sell" }) {
  const up = side === "long" || side === "buy";
  const label = { long: "Long", short: "Short", buy: "Buy", sell: "Sell" }[side];
  return <span className={up ? "text-success" : "text-destructive"}>{label}</span>;
}

// ── positions ──────────────────────────────────────────────────────────────

function useClosePosition() {
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const close = React.useCallback(async (p: LivePosition) => {
    setPendingId(p.id);
    const m = getMarket(p.symbol);
    const id = toast.loading(`Closing ${m?.displayName ?? p.symbol}…`);
    try {
      const fill = await actions.closePosition(p.id);
      toast.success(`Closed ${m?.displayName ?? p.symbol} · ${formatSignedUsd(fill.realizedPnl)} realized`, { id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't close the position.", { id });
    } finally {
      setPendingId(null);
    }
  }, []);
  return { close, pendingId };
}

function PositionsTable({ positions, readOnly }: { positions: LivePosition[]; readOnly: boolean }) {
  const { close, pendingId } = useClosePosition();
  const { setSymbol } = useTerminal();

  return (
    <>
      <table className="hidden w-full min-w-[760px] md:table" data-testid="positions-table">
        <thead className="sticky top-0 bg-background">
          <tr className="border-b border-border">
            <th className={TH}>Instrument</th>
            <th className={cn(TH, "text-right")}>Size</th>
            <th className={cn(TH, "text-right")}>Avg entry</th>
            <th className={cn(TH, "text-right")}>Mark</th>
            <th className={cn(TH, "text-right")}>Value</th>
            <th className={cn(TH, "text-right")}>P&amp;L</th>
            <th className={cn(TH, "text-right")}>TP / SL</th>
            <th className={cn(TH, "sticky right-0 bg-background text-right")}>
              <span className="sr-only">Close</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const roe = p.marginUsd > 0 ? p.unrealizedPnl / p.marginUsd : 0;
            return (
              <tr key={p.id} className="border-b border-border/60 hover:bg-accent/30">
                <td className={TD}>
                  <button type="button" className="text-left outline-none focus-visible:underline" onClick={() => setSymbol(p.symbol)}>
                    <Instrument
                      symbol={p.symbol}
                      sub={
                        <>
                          <SideText side={p.side} /> · {p.leverage}×
                        </>
                      }
                    />
                  </button>
                </td>
                <td className={cn(TD, "text-right")}>
                  {formatSize(p.quantity)}
                </td>
                <td className={cn(TD, "text-right")}>{priceOf(p.symbol, p.entryPrice)}</td>
                <td className={cn(TD, "text-right")}>{priceOf(p.symbol, p.mark)}</td>
                <td className={cn(TD, "text-right")}>{formatUsd(p.notionalUsd, 2)}</td>
                <td className={cn(TD, "text-right", pnlTone(p.unrealizedPnl))} data-testid="position-pnl">
                  {formatSignedUsd(p.unrealizedPnl)}
                  <span className="ml-1 text-[10px] opacity-80">({(roe * 100).toFixed(1)}%)</span>
                </td>
                <td className={cn(TD, "text-right text-muted-foreground")}>
                  <span className="text-success/90">{priceOf(p.symbol, p.takeProfit)}</span>
                  {" / "}
                  <span className="text-destructive/90">{priceOf(p.symbol, p.stopLoss)}</span>
                </td>
                <td className={cn(TD, "sticky right-0 bg-background text-right")}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs"
                    disabled={readOnly}
                    loading={pendingId === p.id}
                    onClick={() => void close(p)}
                  >
                    Close
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {positions.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Instrument symbol={p.symbol} sub={<><SideText side={p.side} /> · {p.leverage}× · {formatUsd(p.notionalUsd, 0)}</>} />
                <span className={cn("font-mono text-sm tabular-nums", pnlTone(p.unrealizedPnl))}>{formatSignedUsd(p.unrealizedPnl)}</span>
              </div>
              <div className="flex justify-between gap-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                <span>Entry {priceOf(p.symbol, p.entryPrice)}</span>
                <span>Mark {priceOf(p.symbol, p.mark)}</span>
              </div>
              {(p.takeProfit !== null || p.stopLoss !== null) && (
                <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  TP {priceOf(p.symbol, p.takeProfit)} · SL {priceOf(p.symbol, p.stopLoss)}
                </div>
              )}
            </div>
            <Button type="button" size="sm" variant="outline" className="h-8 shrink-0 px-3 text-xs" disabled={readOnly} loading={pendingId === p.id} onClick={() => void close(p)}>
              Close
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ── orders ─────────────────────────────────────────────────────────────────

function OrdersTable({ orders, readOnly }: { orders: Order[]; readOnly: boolean }) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function cancel(o: Order) {
    setPendingId(o.id);
    const id = toast.loading("Cancelling order…");
    try {
      await actions.cancelOrder(o.id);
      toast.success(`${getMarket(o.symbol)?.displayName ?? o.symbol} ${o.side} limit cancelled`, { id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't cancel the order.", { id });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <table className="hidden w-full min-w-[640px] md:table" data-testid="orders-table">
        <thead className="sticky top-0 bg-background">
          <tr className="border-b border-border">
            <th className={TH}>Instrument</th>
            <th className={TH}>Side</th>
            <th className={cn(TH, "text-right")}>Size</th>
            <th className={cn(TH, "text-right")}>Limit price</th>
            <th className={cn(TH, "text-right")}>TP / SL</th>
            <th className={cn(TH, "text-right")}>Placed</th>
            <th className={cn(TH, "sticky right-0 bg-background text-right")}>
              <span className="sr-only">Cancel</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-border/60 hover:bg-accent/30">
              <td className={TD}>
                <Instrument symbol={o.symbol} sub={`Limit · ${o.leverage}×`} />
              </td>
              <td className={TD}>
                <SideText side={o.side} />
              </td>
              <td className={cn(TD, "text-right")}>{formatUsd(o.notionalUsd, 2)}</td>
              <td className={cn(TD, "text-right")}>{priceOf(o.symbol, o.limitPrice)}</td>
              <td className={cn(TD, "text-right text-muted-foreground")}>
                {priceOf(o.symbol, o.takeProfit)} / {priceOf(o.symbol, o.stopLoss)}
              </td>
              <td className={cn(TD, "text-right text-muted-foreground")} title={formatDateTime(o.createdAt)}>
                {formatTime(o.createdAt)}
              </td>
              <td className={cn(TD, "sticky right-0 bg-background text-right")}>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={readOnly} loading={pendingId === o.id} onClick={() => void cancel(o)}>
                  <X /> Cancel
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {orders.map((o) => (
          <li key={o.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <Instrument symbol={o.symbol} sub={<><SideText side={o.side} /> limit · {o.leverage}×</>} />
              <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {formatUsd(o.notionalUsd, 2)} at {priceOf(o.symbol, o.limitPrice)} · {formatTime(o.createdAt)}
              </div>
            </div>
            <Button type="button" size="sm" variant="outline" className="h-8 shrink-0 px-3 text-xs" disabled={readOnly} loading={pendingId === o.id} onClick={() => void cancel(o)}>
              Cancel
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ── history ────────────────────────────────────────────────────────────────

function HistoryTable({ fills }: { fills: Fill[] }) {
  const rows = fills.slice(0, 200);
  return (
    <>
      <table className="hidden w-full min-w-[640px] md:table" data-testid="history-table">
        <thead className="sticky top-0 bg-background">
          <tr className="border-b border-border">
            <th className={TH}>Time (UTC)</th>
            <th className={TH}>Instrument</th>
            <th className={TH}>Side</th>
            <th className={TH}>Type</th>
            <th className={cn(TH, "text-right")}>Price</th>
            <th className={cn(TH, "text-right")}>Value</th>
            <th className={cn(TH, "text-right")}>Realized P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className="border-b border-border/60">
              <td className={cn(TD, "text-muted-foreground")}>{formatDateTime(f.at)}</td>
              <td className={TD}>{f.kind === "adjustment" ? <span className="font-sans text-xs">Balance</span> : <Instrument symbol={f.symbol} />}</td>
              <td className={TD}>{f.kind === "adjustment" ? "—" : <SideText side={f.side} />}</td>
              <td className={cn(TD, "font-sans")}>{FILL_KIND_LABEL[f.kind]}</td>
              <td className={cn(TD, "text-right")}>{f.kind === "adjustment" ? "—" : priceOf(f.symbol, f.price)}</td>
              <td className={cn(TD, "text-right")}>{f.kind === "adjustment" ? "—" : formatUsd(f.notionalUsd, 2)}</td>
              <td className={cn(TD, "text-right", pnlTone(f.realizedPnl))}>{f.realizedPnl === 0 ? "—" : formatSignedUsd(f.realizedPnl)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {rows.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold">{f.kind === "adjustment" ? "Balance" : getMarket(f.symbol)?.displayName ?? f.symbol}</span>
                {f.kind !== "adjustment" && <SideText side={f.side} />}
                <span className="text-muted-foreground">· {FILL_KIND_LABEL[f.kind]}</span>
              </div>
              <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {f.kind === "adjustment" ? formatDateTime(f.at) : `${formatUsd(f.notionalUsd, 0)} at ${priceOf(f.symbol, f.price)} · ${formatTime(f.at)}`}
              </div>
            </div>
            <span className={cn("shrink-0 font-mono text-xs tabular-nums", pnlTone(f.realizedPnl))}>
              {f.realizedPnl === 0 ? "—" : formatSignedUsd(f.realizedPnl)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
