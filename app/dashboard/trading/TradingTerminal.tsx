"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";

import { closePositionAction, deskPollAction, listMarketsAction, submitOrderAction } from "@/app/actions/trading";
import { AgreementSignCard } from "@/components/agreement-sign-card";
import { friendlyError } from "@/lib/errors";
import type { PropAccountSummary } from "@/lib/hsc/client";
import { getHypMidsSnapshot, subscribeHypMidsStore } from "@/lib/hyp/mids-feed";
import { mergeTapePerps, midFromTape, overlayMarketMids } from "@/lib/hyp/mids";

import { DeskAccountStrip } from "./DeskAccountStrip";
import { DeskBlotter } from "./DeskBlotter";
import { DeskTicket } from "./DeskTicket";
import { TradingApiKeyCard } from "./TradingApiKeyCard";
import {
  FALLBACK_PERPS,
  FALLBACK_SPOTS,
  asFill,
  asPosition,
  liveDeskBalance,
  markLivePosition,
  type DeskMarket,
  type DeskSnapshot,
  type MarketType,
  type OrderSide,
  type SizeUnit,
} from "./desk-types";

const AGREEMENT_REQUIRED = "V2_AGREEMENT_REQUIRED";
const CATALOG_MS = 5 * 60_000;
const DESK_MS = 10_000;

export function TradingTerminal({
  accounts,
  initialId,
  agreementSigned,
  agreementVersion,
}: {
  accounts: PropAccountSummary[];
  initialId: string;
  agreementSigned: boolean;
  agreementVersion: string;
}) {
  const [accountId, setAccountId] = useState(initialId);
  const [snap, setSnap] = useState<DeskSnapshot | null>(null);
  const [markets, setMarkets] = useState<DeskMarket[]>(FALLBACK_PERPS);
  const [spots, setSpots] = useState<DeskMarket[]>(FALLBACK_SPOTS);
  const [pending, startTransition] = useTransition();
  const [marketType, setMarketType] = useState<MarketType>("perp");
  const [pair, setPair] = useState("BTC");
  const [side, setSide] = useState<OrderSide>("buy");
  const [amount, setAmount] = useState("10");
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>("usd");
  const [leverage, setLeverage] = useState("10");
  const [signed, setSigned] = useState(agreementSigned);
  const mids = useSyncExternalStore(subscribeHypMidsStore, getHypMidsSnapshot, getHypMidsSnapshot);

  async function refreshDesk() {
    const r = await deskPollAction(accountId);
    if (r.ok && r.data) {
      setSnap({
        positions: (r.data.positions ?? []).map(asPosition),
        orders: r.data.orders ?? [],
        history: (r.data.history ?? []).map(asFill),
        balance: r.data.balance,
      });
    } else if (!r.ok) {
      toast.error(friendlyError(r.code, r.message));
    }
  }

  async function refreshMarkets() {
    const r = await listMarketsAction();
    if (r.ok && r.data) {
      if (r.data.markets?.length) setMarkets(r.data.markets);
      if (r.data.spots?.length) setSpots(r.data.spots);
    }
  }

  useEffect(() => {
    void refreshDesk();
    const t = setInterval(() => void refreshDesk(), DESK_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  useEffect(() => {
    void refreshMarkets();
    const t = setInterval(() => void refreshMarkets(), CATALOG_MS);
    return () => clearInterval(t);
  }, []);

  const liveMarkets = useMemo(() => mergeTapePerps(markets, mids), [markets, mids]);
  const liveSpots = useMemo(() => overlayMarketMids(spots, mids), [spots, mids]);
  const book = marketType === "perp" ? liveMarkets : liveSpots;
  const livePositions = useMemo(() => {
    if (!snap) return [];
    return snap.positions.map((pos) => {
      const row = (pos.market_type === "spot" ? liveSpots : liveMarkets).find((m) => m.coin === pos.coin);
      const mark = midFromTape(mids, row ?? { coin: pos.coin ?? "", wire: pos.coin, mid: pos.mark_price });
      return markLivePosition(pos, mark);
    });
  }, [snap, liveMarkets, liveSpots, mids]);
  const liveBalance = useMemo(() => liveDeskBalance(snap?.balance, livePositions), [snap, livePositions]);

  useEffect(() => {
    const maxLev = book.find((m) => m.coin === pair)?.max_leverage;
    if (maxLev && Number(leverage) > maxLev) setLeverage(String(maxLev));
  }, [book, pair, leverage]);

  function changePair(next: string) {
    setPair(next);
    const maxLev = book.find((m) => m.coin === next)?.max_leverage;
    if (maxLev && Number(leverage) > maxLev) setLeverage(String(maxLev));
  }

  function changeMarketType(next: MarketType) {
    setMarketType(next);
    const nextBook = next === "spot" ? spots : markets;
    if (!nextBook.some((m) => m.coin === pair)) {
      setPair(nextBook[0]?.coin ?? (next === "spot" ? "PURR" : "BTC"));
    }
  }

  function changeSizeUnit(next: SizeUnit) {
    if (next === sizeUnit) return;
    const mid = book.find((m) => m.coin === pair)?.mid ?? 0;
    const lev = Math.max(1, Number(leverage) || 1);
    const n = Number(amount);
    if (mid > 0 && Number.isFinite(n) && n > 0) {
      setAmount(next === "usd" ? ((n * mid) / lev).toFixed(2) : ((n * lev) / mid).toFixed(6));
    }
    setSizeUnit(next);
  }

  function submit() {
    if (!signed) {
      toast.error(friendlyError(AGREEMENT_REQUIRED));
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a size.");
      return;
    }
    const maxLev = book.find((m) => m.coin === pair)?.max_leverage ?? 50;
    const lev = marketType === "perp" ? Math.min(Number(leverage) || 1, maxLev) : 1;
    const notional = sizeUnit === "usd" ? (marketType === "perp" ? n * lev : n) : undefined;
    startTransition(async () => {
      const r = await submitOrderAction(
        {
          trade_pair: pair,
          market_type: marketType,
          side,
          ...(sizeUnit === "usd" ? { value: notional } : { quantity: n }),
          leverage: marketType === "perp" ? lev : undefined,
        },
        accountId,
      );
      if (r.ok) {
        toast.success("Filled on the virtual desk");
        if (r.data && typeof r.data === "object" && r.data.balance) {
          setSnap((prev) => ({
            positions: prev?.positions ?? [],
            orders: prev?.orders ?? [],
            history: prev?.history ?? [],
            balance: r.data.balance as DeskSnapshot["balance"],
          }));
        }
        void refreshDesk();
      } else {
        if (r.code === AGREEMENT_REQUIRED) setSigned(false);
        toast.error(friendlyError(r.code, r.message));
      }
    });
  }

  function close(coin: string, type?: string) {
    startTransition(async () => {
      const r = await closePositionAction(
        { trade_pair: coin, market_type: type === "spot" ? "spot" : "perp" },
        accountId,
      );
      if (r.ok) toast.success(`Closed ${coin}`);
      else toast.error(friendlyError(r.code, r.message));
      void refreshDesk();
    });
  }

  return (
    <div className="space-y-4">
      {!signed && (
        <AgreementSignCard version={agreementVersion} onSigned={() => setSigned(true)} />
      )}
      <DeskAccountStrip
        accounts={accounts}
        accountId={accountId}
        onAccountChange={setAccountId}
        balance={liveBalance}
      />
      <TradingApiKeyCard accountId={accountId} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <DeskTicket
          pair={pair}
          side={side}
          amount={amount}
          sizeUnit={sizeUnit}
          leverage={leverage}
          marketType={marketType}
          markets={book}
          pending={pending}
          onPairChange={changePair}
          onSideChange={setSide}
          onAmountChange={setAmount}
          onSizeUnitChange={changeSizeUnit}
          onLeverageChange={setLeverage}
          onMarketTypeChange={changeMarketType}
          onSubmit={submit}
        />
        <DeskBlotter
          positions={livePositions}
          fills={snap?.history ?? []}
          pending={pending}
          onClose={close}
        />
      </div>
    </div>
  );
}
