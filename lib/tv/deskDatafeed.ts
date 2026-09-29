import { subscribeHlCandle } from "@/lib/hl/candles-ws";
import { fetchHlCandlesRange, type HlCandle } from "@/lib/hl/info";
import { getHypMidsSnapshot, subscribeSharedHypMids } from "@/lib/hyp/mids-feed";
import { midFromTape } from "@/lib/hyp/mids";

import { applyLiveBar, fillBarGaps, type TvBar } from "./liveBar";
import { hlIntervalMs, tvResolutionToHl, TV_RESOLUTIONS, unixMs } from "./resolutions";

export type DeskChartInstrument = {
  coin: string;
  wire: string;
  mid: number;
  label?: string;
  pair?: string;
};

type HistoryCallback = (bars: TvBar[], meta: { noData: boolean }) => void;
type ErrorCallback = (reason: string) => void;
type ResolveCallback = (symbolInfo: Record<string, unknown>) => void;
type ReadyCallback = (config: { supported_resolutions: readonly string[] }) => void;
type TickCallback = (bar: TvBar) => void;

const SESSION = "24x7";

function toBar(row: HlCandle): TvBar {
  return { time: row.t, open: row.o, high: row.h, low: row.l, close: row.c, volume: row.v };
}

function pricescale(mid: number): number {
  if (!(mid > 0)) return 100;
  if (mid >= 100) return 100;
  if (mid >= 1) return 10_000;
  return 1_000_000;
}

export class DeskTvDatafeed {
  private instrument: DeskChartInstrument;
  private listeners = new Map<string, () => void>();

  constructor(instrument: DeskChartInstrument) {
    this.instrument = instrument;
  }

  setInstrument(next: DeskChartInstrument): void {
    this.instrument = next;
  }

  onReady(callback: ReadyCallback): void {
    queueMicrotask(() =>
      callback({
        supported_resolutions: TV_RESOLUTIONS,
      }),
    );
  }

  searchSymbols(
    userInput: string,
    _exchange: string,
    _symbolType: string,
    onResult: (items: Array<Record<string, string>>) => void,
  ): void {
    const q = userInput.trim().toUpperCase();
    const { coin, wire, label, pair } = this.instrument;
    const haystack = [coin, wire, label, pair].filter(Boolean).join(" ").toUpperCase();
    if (q && !haystack.includes(q)) {
      onResult([]);
      return;
    }
    onResult([
      {
        symbol: pair || label || coin,
        ticker: wire || coin,
        full_name: pair || coin,
        description: pair ? `${pair} spot` : `${label || coin} Hyperliquid`,
        exchange: "Hyperliquid",
        type: "crypto",
      },
    ]);
  }

  resolveSymbol(symbolName: string, onResolve: ResolveCallback, onError: ErrorCallback): void {
    const instrument = this.instrument;
    const ticker = instrument.wire || instrument.coin || symbolName.trim();
    if (!ticker) {
      onError("Unknown symbol");
      return;
    }
    const title = instrument.pair || instrument.label || instrument.coin;
    const kind = instrument.pair ? "spot" : instrument.coin.startsWith("#") ? "outcome" : "perp";
    const mid = instrument.mid;
    queueMicrotask(() =>
      onResolve({
        name: title,
        ticker,
        description: kind === "spot" ? `${title} spot` : `${title} on Hyperliquid`,
        type: "crypto",
        session: SESSION,
        exchange: "Hyperliquid",
        listed_exchange: "Hyperliquid",
        timezone: "Etc/UTC",
        format: "price",
        pricescale: pricescale(mid),
        minmov: 1,
        has_empty_bars: false,
        has_intraday: true,
        has_daily: true,
        has_weekly_and_monthly: false,
        supported_resolutions: [...TV_RESOLUTIONS],
        volume_precision: 2,
        data_status: "streaming",
        visible_plots_set: "ohlcv",
      }),
    );
  }

  getBars(
    _symbolInfo: { ticker?: string; name?: string },
    resolution: string,
    periodParams: { from: number; to: number; firstDataRequest?: boolean },
    onResult: HistoryCallback,
    onError: ErrorCallback,
  ): void {
    const interval = tvResolutionToHl(resolution);
    if (!interval) {
      onResult([], { noData: true });
      return;
    }
    const coin = this.instrument.wire || this.instrument.coin;
    const startTime = unixMs(periodParams.from);
    const requestedTo = unixMs(periodParams.to);
    const endTime = periodParams.firstDataRequest ? Math.max(requestedTo, Date.now()) : requestedTo;
    void fetchHlCandlesRange(coin, interval, startTime, endTime)
      .then((rows) => {
        const bars = rows
          .filter((row) => row.t >= startTime && row.t <= endTime)
          .map(toBar);
        const until = periodParams.firstDataRequest ? endTime : (bars.at(-1)?.time ?? endTime);
        const filled = fillBarGaps(bars, hlIntervalMs(interval), until);
        onResult(filled, { noData: filled.length === 0 });
      })
      .catch((err: unknown) => onError(err instanceof Error ? err.message : String(err)));
  }

  subscribeBars(
    _symbolInfo: { ticker?: string; name?: string },
    resolution: string,
    onTick: TickCallback,
    listenerGuid: string,
  ): void {
    const interval = tvResolutionToHl(resolution);
    if (!interval) return;
    const coin = this.instrument.wire || this.instrument.coin;
    const barMs = hlIntervalMs(interval);
    let lastBar: TvBar | null = null;

    const emit = (bars: TvBar[]) => {
      for (const row of bars) {
        lastBar = row;
        onTick(row);
      }
    };

    const fromWs = (candle: HlCandle) => {
      emit([toBar(candle)]);
    };

    const fromMid = (px: number) => {
      emit(applyLiveBar(lastBar, px, barMs));
    };

    const stopWs = subscribeHlCandle(coin, interval, fromWs);
    let seeded = false;
    const stopMids = subscribeSharedHypMids((mids) => {
      if (!seeded || !lastBar) return;
      const px = midFromTape(mids, this.instrument);
      if (px > 0) fromMid(px);
    });
    void fetchHlCandlesRange(coin, interval, Date.now() - barMs * 8, Date.now())
      .then((rows) => {
        const last = rows.at(-1);
        if (last) emit([toBar(last)]);
        seeded = true;
        const seedPx = midFromTape(getHypMidsSnapshot(), this.instrument) || this.instrument.mid;
        if (last && seedPx > 0) fromMid(seedPx);
      })
      .catch(() => {
        seeded = true;
      });

    const resync = window.setInterval(() => {
      const end = Date.now();
      void fetchHlCandlesRange(coin, interval, end - barMs * 4, end)
        .then((rows) => {
          const last = rows.at(-1);
          if (last) emit([toBar(last)]);
        })
        .catch(() => undefined);
    }, 15_000);

    this.listeners.set(listenerGuid, () => {
      stopWs();
      stopMids();
      window.clearInterval(resync);
    });
  }

  unsubscribeBars(listenerGuid: string): void {
    this.listeners.get(listenerGuid)?.();
    this.listeners.delete(listenerGuid);
  }
}
