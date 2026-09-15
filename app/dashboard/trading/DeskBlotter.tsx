"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  absMoney,
  displayCoin,
  formatCoinSize,
  formatPx,
  isLongSide,
  isSpotMarket,
  sideLabel,
  money,
  pnlClass,
  type DeskFill,
  type DeskPosition,
} from "./desk-types";

export function DeskBlotter({
  positions,
  fills,
  pending,
  onClose,
}: {
  positions: DeskPosition[];
  fills: DeskFill[];
  pending: boolean;
  onClose: (coin: string, marketType?: string) => void;
}) {
  return (
    <Tabs defaultValue="positions" className="min-w-0 rounded-xl border border-border bg-card/60 p-3 sm:p-4">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="positions" className="flex-1 sm:flex-none">
          Positions{positions.length ? ` ${positions.length}` : ""}
        </TabsTrigger>
        <TabsTrigger value="fills" className="flex-1 sm:flex-none">
          Fills
        </TabsTrigger>
      </TabsList>
      <TabsContent value="positions" className="mt-3">
        {positions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No open positions.</p>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {positions.map((p) => {
                const coin = String(p.coin ?? "");
                const pnl = Number(p.unrealized_pnl ?? 0);
                const bought = isLongSide(p.side);
                return (
                  <article
                    key={String(p.id ?? coin)}
                    className="rounded-lg border border-border bg-background/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold">
                          {displayCoin(coin)}
                          {!isSpotMarket(p.market_type) && p.leverage ? (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">{p.leverage}x</span>
                          ) : null}
                        </p>
                        <Badge variant={bought || isSpotMarket(p.market_type) ? "success" : "destructive"} className="mt-1">
                          {isSpotMarket(p.market_type) ? "Spot" : sideLabel(p.side)}
                        </Badge>
                      </div>
                      <p className={cn("font-mono text-sm font-semibold tabular-nums", pnlClass(pnl))}>
                        {money(pnl)}
                      </p>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Size</dt>
                        <dd className="font-mono tabular-nums">{formatCoinSize(p.size)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Notional</dt>
                        <dd className="font-mono tabular-nums">{absMoney(p.notional ?? Number(p.size ?? 0) * Number(p.mark_price ?? 0))}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Entry</dt>
                        <dd className="font-mono tabular-nums">{formatPx(p.entry_price)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Mark</dt>
                        <dd className="font-mono tabular-nums">{formatPx(p.mark_price)}</dd>
                      </div>
                    </dl>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      disabled={pending}
                      onClick={() => onClose(coin, p.market_type)}
                    >
                      Close
                    </Button>
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coin</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="text-right">Notional</TableHead>
                    <TableHead className="text-right">Entry</TableHead>
                    <TableHead className="text-right">Mark</TableHead>
                    <TableHead className="text-right">uPnL</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((p) => {
                    const coin = String(p.coin ?? "");
                    const pnl = Number(p.unrealized_pnl ?? 0);
                    return (
                      <TableRow key={String(p.id ?? coin)}>
                        <TableCell className="font-mono font-medium">
                          {displayCoin(coin)}
                          {!isSpotMarket(p.market_type) && p.leverage ? (
                            <span className="ml-2 text-xs text-muted-foreground">{p.leverage}x</span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isLongSide(p.side) || isSpotMarket(p.market_type) ? "success" : "destructive"}>
                            {isSpotMarket(p.market_type) ? "Spot" : sideLabel(p.side)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCoinSize(p.size)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {absMoney(p.notional ?? Number(p.size ?? 0) * Number(p.mark_price ?? 0))}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatPx(p.entry_price)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatPx(p.mark_price)}
                        </TableCell>
                        <TableCell className={cn("text-right font-mono tabular-nums", pnlClass(pnl))}>
                          {money(pnl)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => onClose(coin, p.market_type)}
                          >
                            Close
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </TabsContent>
      <TabsContent value="fills" className="mt-3">
        {fills.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No fills yet.</p>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {fills.slice(0, 25).map((h, i) => {
                const pnl = Number(h.realized_pnl ?? 0);
                return (
                  <article
                    key={String(h.id ?? i)}
                    className="rounded-lg border border-border bg-background/40 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono font-semibold">{displayCoin(String(h.coin ?? ""))}</p>
                        <p className="text-xs text-muted-foreground">{sideLabel(h.side, h.market_type)}</p>
                      </div>
                      <p className={cn("font-mono text-sm tabular-nums", pnlClass(pnl))}>{money(pnl)}</p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {h.created_at ? new Date(h.created_at).toLocaleString() : "—"}
                    </p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                      {formatCoinSize(h.qty)} @ {formatPx(h.price)}
                    </p>
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Coin</TableHead>
                    <TableHead>Dir</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">PnL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fills.slice(0, 25).map((h, i) => {
                    const pnl = Number(h.realized_pnl ?? 0);
                    return (
                      <TableRow key={String(h.id ?? i)}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {h.created_at ? new Date(h.created_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="font-mono">{displayCoin(String(h.coin ?? ""))}</TableCell>
                        <TableCell>{sideLabel(h.side, h.market_type)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatCoinSize(h.qty)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatPx(h.price)}</TableCell>
                        <TableCell className={cn("text-right font-mono tabular-nums", pnlClass(pnl))}>
                          {money(pnl)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
