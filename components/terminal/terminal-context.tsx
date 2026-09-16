"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { resolveSymbol } from "@/lib/propfund/terminal";
import type { OrderSide } from "@/lib/propfund/types";

/**
 * Terminal-wide UI state: the selected market (mirrored to `?symbol=`), a
 * price picked from the order book (pre-fills a limit order), and the mobile
 * order sheet.
 */

type PickedPrice = { price: number; nonce: number };

type TerminalContextValue = {
  symbol: string;
  setSymbol: (symbol: string) => void;
  pickedPrice: PickedPrice | null;
  pickPrice: (price: number) => void;
  orderSheet: { open: boolean; side: OrderSide };
  openOrderSheet: (side: OrderSide) => void;
  setOrderSheetOpen: (open: boolean) => void;
};

const TerminalContext = React.createContext<TerminalContextValue | null>(null);

export const SYMBOL_PARAM = "symbol";

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const symbol = resolveSymbol(params.get(SYMBOL_PARAM));
  const [pickedPrice, setPickedPrice] = React.useState<PickedPrice | null>(null);
  const [orderSheet, setOrderSheet] = React.useState<{ open: boolean; side: OrderSide }>({ open: false, side: "buy" });

  const setSymbol = React.useCallback((next: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(SYMBOL_PARAM, next);
    // Shallow URL update: the App Router syncs useSearchParams without a server round trip.
    // The state must be null; passing the router's own history state makes Next skip the sync.
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setPickedPrice(null);
  }, []);

  const pickPrice = React.useCallback((price: number) => {
    setPickedPrice((prev) => ({ price, nonce: (prev?.nonce ?? 0) + 1 }));
  }, []);

  const openOrderSheet = React.useCallback((side: OrderSide) => setOrderSheet({ open: true, side }), []);
  const setOrderSheetOpen = React.useCallback((open: boolean) => setOrderSheet((s) => ({ ...s, open })), []);

  const value = React.useMemo(
    () => ({ symbol, setSymbol, pickedPrice, pickPrice, orderSheet, openOrderSheet, setOrderSheetOpen }),
    [symbol, setSymbol, pickedPrice, pickPrice, orderSheet, openOrderSheet, setOrderSheetOpen],
  );

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>;
}

export function useTerminal(): TerminalContextValue {
  const ctx = React.useContext(TerminalContext);
  if (!ctx) throw new Error("useTerminal must be used inside <TerminalProvider>");
  return ctx;
}
