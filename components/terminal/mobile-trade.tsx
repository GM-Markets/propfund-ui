"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useActiveAccount, usePrices } from "@/lib/propfund/hooks";
import { cn } from "@/lib/utils";

import { MarketsPane } from "./markets-pane";
import { BookTable, TradesTable } from "./order-book-pane";
import { OrderForm } from "./order-form";
import { useTerminal } from "./terminal-context";

/**
 * Sticky Buy / Sell bar that sits above the app's mobile tab bar and opens the
 * order form in a bottom sheet (PRD §10.3 mobile step 3). Both buttons always
 * work; the form explains when an order can't be placed.
 */
export function MobileTradeBar() {
  const { symbol, orderSheet, openOrderSheet, setOrderSheetOpen } = useTerminal();
  const prices = usePrices(symbol);
  const active = useActiveAccount();

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-[env(safe-area-inset-bottom)] z-30 h-[60px] border-t border-border bg-background/95 px-3 py-2 backdrop-blur lg:hidden"
        data-testid="mobile-trade-bar"
      >
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            onClick={() => openOrderSheet("buy")}
            className="h-11 bg-success font-semibold text-success-foreground hover:bg-success/90 hover:shadow-none"
          >
            Buy / Long
          </Button>
          <Button
            type="button"
            onClick={() => openOrderSheet("sell")}
            className="h-11 bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            Sell / Short
          </Button>
        </div>
      </div>

      <Sheet open={orderSheet.open} onOpenChange={setOrderSheetOpen}>
        <SheetContent side="bottom" className="gap-0 lg:hidden" aria-describedby="order-sheet-desc">
          <SheetHeader className="px-4 pb-1 pt-4">
            <SheetTitle className="text-base">{prices ? prices.market.displayName : symbol}</SheetTitle>
            <SheetDescription id="order-sheet-desc" className="text-xs">
              {active ? "Market or limit order in USD notional." : "Trading needs an active account."}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="px-1 pb-2">
            <OrderForm key={`${symbol}-${orderSheet.side}`} initialSide={orderSheet.side} onPlaced={() => setOrderSheetOpen(false)} />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}

type Panel = "book" | "trades" | "markets";

/** Order book, trades and markets behind one switcher on mobile (PRD §10.3 mobile step 5). */
export function MobileMarketSwitcher({ className }: { className?: string }) {
  const [panel, setPanel] = React.useState<Panel>("book");
  return (
    <section aria-label="Order book and markets" className={cn("flex scroll-mt-14 flex-col bg-background", className)} id="mobile-markets">
      <div className="border-b border-border p-2">
        <SegmentedControl<Panel>
          aria-label="Show"
          size="sm"
          value={panel}
          onValueChange={setPanel}
          options={[
            { value: "book", label: "Order book" },
            { value: "trades", label: "Trades" },
            { value: "markets", label: "Markets" },
          ]}
        />
      </div>
      {panel === "book" && (
        <div className="flex h-[456px] flex-col">
          <BookTable />
        </div>
      )}
      {panel === "trades" && (
        <div className="flex h-[456px] flex-col">
          <TradesTable />
        </div>
      )}
      {panel === "markets" && <MarketsPane className="h-[456px]" />}
    </section>
  );
}
