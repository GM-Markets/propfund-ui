"use client";

import * as React from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type SeriesType,
  type UTCTimestamp,
} from "lightweight-charts";

import { Skeleton } from "@/components/ui/skeleton";
import { candleSyncMode, hslTokenToRgba, priceFormatForTick, toLinePoint, toVolumeBar } from "@/lib/propfund/chart-data";
import { useCandles } from "@/lib/propfund/hooks";
import type { Candle, Timeframe } from "@/lib/propfund/mock";

/**
 * Candlestick / line chart with a volume strip (lightweight-charts v5). Loaded
 * with `next/dynamic` and `ssr: false`, so `window` is only touched in the
 * browser. The chart is created once, fed `setData` on symbol or timeframe
 * change and `update(last)` on every tick, and removed on unmount.
 */

export type ChartStyle = "candles" | "line";
export type ChartPriceLine = { price: number; kind: "entry" | "tp" | "sl" | "limit"; title: string };

type Theme = {
  bg: string;
  text: string;
  grid: string;
  border: string;
  up: string;
  down: string;
  upVol: string;
  downVol: string;
  primary: string;
  muted: string;
  font: string;
};

function readTheme(): Theme {
  const cs = getComputedStyle(document.documentElement);
  const tok = (name: string, fallback: string, alpha?: number) =>
    hslTokenToRgba(cs.getPropertyValue(name), alpha) ?? fallback;
  return {
    bg: tok("--background", "rgb(9, 11, 16)"),
    text: tok("--muted-foreground", "rgb(140, 150, 170)"),
    grid: tok("--foreground", "rgba(255, 255, 255, 0.04)", 0.04),
    border: tok("--foreground", "rgba(255, 255, 255, 0.08)", 0.08),
    up: tok("--success", "rgb(34, 197, 94)"),
    down: tok("--destructive", "rgb(239, 68, 68)"),
    upVol: tok("--success", "rgba(34, 197, 94, 0.28)", 0.28),
    downVol: tok("--destructive", "rgba(239, 68, 68, 0.28)", 0.28),
    primary: tok("--primary", "rgb(59, 130, 246)"),
    muted: tok("--muted-foreground", "rgb(140, 150, 170)"),
    // Canvas text can't resolve CSS variables; use the resolved font stack.
    font: `${cs.getPropertyValue("--font-geist-mono").trim() || "ui-monospace"}, ui-monospace, monospace`,
  };
}

const VISIBLE_BARS = 120;

export default function PriceChart({
  symbol,
  timeframe,
  style,
  tickSize,
  priceLines,
}: {
  symbol: string;
  timeframe: Timeframe;
  style: ChartStyle;
  tickSize: number;
  priceLines: readonly ChartPriceLine[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const volumeRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastRef = React.useRef<{ key: string; candles: readonly Candle[] } | null>(null);
  const linesRef = React.useRef<{ series: ISeriesApi<SeriesType>; line: IPriceLine }[]>([]);
  const themeRef = React.useRef<Theme | null>(null);
  // Bumped whenever a chart instance is created (Strict Mode mounts twice), so data and lines re-apply.
  const [chartVersion, setChartVersion] = React.useState(0);
  const ready = chartVersion > 0;

  const candles = useCandles(symbol, timeframe);

  // Create once; dispose on unmount.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const theme = readTheme();
    themeRef.current = theme;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: theme.bg },
        textColor: theme.text,
        fontSize: 11,
        fontFamily: theme.font,
        attributionLogo: false,
      },
      grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
      rightPriceScale: { borderColor: theme.border, scaleMargins: { top: 0.08, bottom: 0.24 } },
      timeScale: { borderColor: theme.border, timeVisible: true, secondsVisible: false, rightOffset: 4 },
      crosshair: { mode: CrosshairMode.Normal },
      // Vertical swipes scroll the page on touch screens instead of being trapped by the chart.
      handleScroll: { vertTouchDrag: false },
      localization: { locale: "en-US" },
    });
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: theme.up,
      downColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
      borderVisible: false,
    });
    const line = chart.addSeries(LineSeries, { color: theme.primary, lineWidth: 2, visible: false });
    const volume = chart.addSeries(HistogramSeries, {
      priceScaleId: "volume",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candle;
    lineRef.current = line;
    volumeRef.current = volume;
    setChartVersion((v) => v + 1);

    const applyTheme = () => {
      const t = readTheme();
      themeRef.current = t;
      chart.applyOptions({
        layout: { background: { type: ColorType.Solid, color: t.bg }, textColor: t.text },
        grid: { vertLines: { color: t.grid }, horzLines: { color: t.grid } },
        rightPriceScale: { borderColor: t.border },
        timeScale: { borderColor: t.border },
      });
      candle.applyOptions({ upColor: t.up, downColor: t.down, wickUpColor: t.up, wickDownColor: t.down });
      line.applyOptions({ color: t.primary });
    };
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", applyTheme);
      linesRef.current = [];
      lastRef.current = null;
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      volumeRef.current = null;
      chart.remove();
    };
  }, []);

  // Precision follows the market's tick size.
  React.useEffect(() => {
    if (!ready) return;
    const priceFormat = priceFormatForTick(tickSize);
    candleRef.current?.applyOptions({ priceFormat });
    lineRef.current?.applyOptions({ priceFormat });
  }, [chartVersion, tickSize]);

  // Candle / line toggle.
  React.useEffect(() => {
    if (!ready) return;
    candleRef.current?.applyOptions({ visible: style === "candles" });
    lineRef.current?.applyOptions({ visible: style === "line" });
  }, [chartVersion, style]);

  // Data: full set on a new series, incremental update on ticks.
  React.useEffect(() => {
    const chart = chartRef.current;
    const candle = candleRef.current;
    const line = lineRef.current;
    const volume = volumeRef.current;
    const theme = themeRef.current;
    if (!ready || !chart || !candle || !line || !volume || !theme || !candles) return;
    const key = `${symbol}:${timeframe}`;
    const prev = lastRef.current?.key === key ? lastRef.current.candles : null;
    const mode = candleSyncMode(prev, candles);
    if (mode === "none") return;
    const t = (c: Candle) => c.time as UTCTimestamp;
    if (mode === "set") {
      candle.setData(candles.map((c) => ({ ...c, time: t(c) })));
      line.setData(candles.map((c) => ({ ...toLinePoint(c), time: t(c) })));
      volume.setData(candles.map((c) => ({ ...toVolumeBar(symbol, c, theme.upVol, theme.downVol), time: t(c) })));
      if (!prev) {
        const n = candles.length;
        chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - VISIBLE_BARS), to: n + 4 });
      }
    } else {
      const last = candles[candles.length - 1];
      candle.update({ ...last, time: t(last) });
      line.update({ ...toLinePoint(last), time: t(last) });
      volume.update({ ...toVolumeBar(symbol, last, theme.upVol, theme.downVol), time: t(last) });
    }
    lastRef.current = { key, candles };
  }, [chartVersion, candles, symbol, timeframe]);

  // Entry / TP / SL / limit price lines on the visible series.
  const linesKey = JSON.stringify(priceLines);
  React.useEffect(() => {
    const theme = themeRef.current;
    const target = style === "candles" ? candleRef.current : lineRef.current;
    if (!ready || !theme || !target) return;
    for (const { series, line } of linesRef.current) series.removePriceLine(line);
    const colors: Record<ChartPriceLine["kind"], string> = {
      entry: theme.primary,
      tp: theme.up,
      sl: theme.down,
      limit: theme.muted,
    };
    const parsed = JSON.parse(linesKey) as ChartPriceLine[];
    linesRef.current = parsed.map((pl) => ({
      series: target as ISeriesApi<SeriesType>,
      line: target.createPriceLine({
        price: pl.price,
        color: colors[pl.kind],
        lineWidth: 1,
        lineStyle: pl.kind === "entry" ? LineStyle.Solid : pl.kind === "limit" ? LineStyle.Dotted : LineStyle.Dashed,
        axisLabelVisible: true,
        title: pl.title,
      }),
    }));
  }, [chartVersion, style, linesKey]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" data-testid="price-chart" />
      {!candles && <Skeleton className="absolute inset-0 rounded-none" />}
    </div>
  );
}
