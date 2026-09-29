"use client";

import { useEffect, useRef, useState } from "react";

import { ensureTradingViewScript } from "@/lib/tv/ensureScript";
import { DeskTvDatafeed } from "@/lib/tv/deskDatafeed";
import { resolveTvLibraryPath } from "@/lib/tv/libraryPath";

type TvWidget = {
  remove: () => void;
  onChartReady: (cb: () => void) => void;
  setSymbol: (symbol: string, interval: string, cb: () => void) => void;
};

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => TvWidget;
    };
  }
}

const LIBRARY_PATH = resolveTvLibraryPath();

const TV_TIME_FRAMES = [
  { text: "1D", resolution: "15" },
  { text: "5D", resolution: "15" },
  { text: "1M", resolution: "60" },
  { text: "3M", resolution: "60" },
  { text: "6M", resolution: "240" },
  { text: "1Y", resolution: "1D" },
];

function hasBox(el: HTMLElement): boolean {
  return el.clientWidth >= 2 && el.clientHeight >= 2;
}

function resolveTvCustomCssUrl(): string {
  const path = "/tv-chart.css";
  const rev = "zoom-fullsize-1";
  if (typeof window === "undefined") return `${path}?v=${rev}`;
  return `${window.location.origin}${path}?v=${rev}`;
}

export function DeskChart({
  coin,
  wire,
  mid,
  label,
  pair,
}: {
  coin: string;
  wire: string;
  mid: number;
  label?: string;
  pair?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<TvWidget | null>(null);
  const feedRef = useRef(new DeskTvDatafeed({ coin, wire, mid, label, pair }));
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [layoutEpoch, setLayoutEpoch] = useState(0);

  feedRef.current.setInstrument({ coin, wire, mid, label, pair });

  useEffect(() => {
    const el = hostRef.current;
    if (!el || hasBox(el)) return;

    let cancelled = false;
    const ro = new ResizeObserver(() => {
      if (cancelled || !hostRef.current) return;
      if (!hasBox(hostRef.current)) return;
      ro.disconnect();
      setLayoutEpoch((n) => n + 1);
    });
    ro.observe(el);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [layoutEpoch]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasBox(host)) return;
    let cancelled = false;
    let widget: TvWidget | null = null;

    void ensureTradingViewScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.TradingView?.widget) {
          throw new Error("TradingView widget missing");
        }
        const el = hostRef.current;
        widget = new window.TradingView.widget({
          container: el,
          library_path: LIBRARY_PATH,
          locale: "en",
          width: el.clientWidth,
          height: el.clientHeight,
          autosize: true,
          symbol: wire || coin,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          fullscreen: false,
          autosave_delay: 5,
          datafeed: feedRef.current,
          time_frames: TV_TIME_FRAMES,
          custom_css_url: resolveTvCustomCssUrl(),
          header_widget_buttons_mode: "fullsize",
          disabled_features: [
            "header_symbol_search",
            "symbol_search_hot_key",
            "header_compare",
            "header_saveload",
            "display_market_status",
            "popup_hints",
          ],
          enabled_features: [
            "countdown",
            "show_zoom_and_move_buttons_on_touch",
            "header_in_fullscreen_mode",
            "side_toolbar_in_fullscreen_mode",
          ],
          overrides: {
            "paneProperties.background": "#0a1016",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": "rgba(148, 163, 184, 0.08)",
            "paneProperties.horzGridProperties.color": "rgba(148, 163, 184, 0.08)",
            "scalesProperties.textColor": "#94a3b8",
            "mainSeriesProperties.candleStyle.upColor": "#22c47a",
            "mainSeriesProperties.candleStyle.downColor": "#e5484d",
            "mainSeriesProperties.candleStyle.borderUpColor": "#22c47a",
            "mainSeriesProperties.candleStyle.borderDownColor": "#e5484d",
            "mainSeriesProperties.candleStyle.wickUpColor": "#22c47a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#e5484d",
          },
        });
        widgetRef.current = widget;
        widget.onChartReady(() => {
          if (!cancelled) setStatus("ready");
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      widgetRef.current = null;
      widget?.remove();
      host.replaceChildren();
    };
    // Mount once the host has a box; pair changes go through setSymbol.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutEpoch]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || status !== "ready" || !coin) return;
    widget.setSymbol(wire || coin, "15", () => undefined);
  }, [coin, wire, status]);

  return (
    <section className="desk-chart" aria-label={`${coin} TradingView chart`}>
      {status === "loading" ? <p className="desk-chart-empty">Loading TradingView…</p> : null}
      {status === "error" ? (
        <p className="desk-chart-empty">
          TradingView failed to load. Check NEXT_PUBLIC_TV_LIBRARY_PATH and that the
          charting library CDN is reachable.
        </p>
      ) : null}
      <div ref={hostRef} className="desk-chart-tv" />
    </section>
  );
}
