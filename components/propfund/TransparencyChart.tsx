"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { formatShortDate } from "./transparency-format";

export type ChartSeries = {
  key: string;
  label: string;
  /** Series hue. Marks only; text always uses text colours. */
  color: string;
  values: (number | null)[];
};

export type ChartKind = "line" | "area" | "bar";
/** How days are merged when there are more points than pixels: flows sum, levels take the last value. */
export type ChartAggregate = "sum" | "last";

type Bucket = { start: string; end: string; values: (number | null)[] };

const HEIGHT = 240;
const TOP = 12;
const BOTTOM = 26;
const RIGHT = 8;
const SURFACE = "#1c1a1b";

function niceStep(range: number, count: number): number {
  const raw = range / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * magnitude;
}

function bucketize(dates: string[], series: ChartSeries[], size: number, aggregate: ChartAggregate): Bucket[] {
  const buckets: Bucket[] = [];
  for (let start = 0; start < dates.length; start += size) {
    const end = Math.min(start + size, dates.length);
    buckets.push({
      start: dates[start],
      end: dates[end - 1],
      values: series.map((item) => {
        const slice = item.values.slice(start, end).filter((value): value is number => value !== null);
        if (slice.length === 0) return null;
        return aggregate === "sum" ? slice.reduce((sum, value) => sum + value, 0) : slice[slice.length - 1];
      }),
    });
  }
  return buckets;
}

function roundedTopRect(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
}

function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(Math.max(240, Math.round(element.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export function TransparencyChart({
  title,
  description,
  dates,
  series,
  kind,
  aggregate,
  formatValue,
  formatAxis,
  showTotal = false,
}: {
  title: string;
  description: string;
  dates: string[];
  series: ChartSeries[];
  kind: ChartKind;
  aggregate: ChartAggregate;
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
  showTotal?: boolean;
}) {
  const id = useId();
  const [containerRef, width] = useElementWidth<HTMLDivElement>(640);
  const [active, setActive] = useState<number | null>(null);
  const [tableOpen, setTableOpen] = useState(false);

  const model = useMemo(() => {
    const minSlot = kind === "bar" ? 6 : 3;
    const approxPlot = Math.max(120, width - 64);
    const size = Math.max(1, Math.ceil((dates.length * minSlot) / approxPlot));
    const buckets = bucketize(dates, series, size, aggregate);

    const numbers = buckets.flatMap((bucket) =>
      kind === "bar" ? [bucket.values.reduce<number>((sum, value) => sum + (value ?? 0), 0)] : bucket.values.filter((value): value is number => value !== null),
    );
    const dataMin = Math.min(0, ...numbers);
    const dataMax = Math.max(0, ...numbers);
    const span = dataMax - dataMin || 1;
    const step = niceStep(span, 4);
    const lo = Math.floor(dataMin / step) * step;
    const hi = Math.max(lo + step, Math.ceil(dataMax / step) * step);
    const ticks: number[] = [];
    for (let tick = lo; tick <= hi + step / 2; tick += step) ticks.push(Math.round(tick * 1e6) / 1e6);

    const left = Math.max(...ticks.map((tick) => formatAxis(tick).length)) * 6.6 + 12;
    const plotWidth = Math.max(80, width - left - RIGHT);
    const plotHeight = HEIGHT - TOP - BOTTOM;
    const slot = plotWidth / buckets.length;
    const y = (value: number) => TOP + plotHeight - ((value - lo) / (hi - lo)) * plotHeight;
    const xCenter = (index: number) => left + slot * index + slot / 2;

    return { buckets, size, ticks, left, plotWidth, plotHeight, slot, y, xCenter, lo };
  }, [aggregate, dates, formatAxis, kind, series, width]);

  const { buckets, ticks, left, plotWidth, plotHeight, slot, y, xCenter, lo } = model;
  const last = buckets.length - 1;
  const focus = active ?? last;
  const focusBucket = buckets[focus];

  const labelEvery = Math.max(1, Math.ceil(buckets.length / Math.max(2, Math.floor(plotWidth / 84))));
  const baseline = y(Math.max(0, lo));

  function indexFromClientX(clientX: number, rect: DOMRect) {
    const x = ((clientX - rect.left) / rect.width) * width;
    return Math.max(0, Math.min(last, Math.floor((x - left) / slot)));
  }

  function rangeLabel(bucket: Bucket) {
    return bucket.start === bucket.end ? formatShortDate(bucket.start) : `${formatShortDate(bucket.start)} – ${formatShortDate(bucket.end)}`;
  }

  const total = focusBucket ? focusBucket.values.reduce<number>((sum, value) => sum + (value ?? 0), 0) : 0;

  return (
    <div className="tp-chart">
      <div className="tp-readout">
        <span className="tp-readout-date">{focusBucket ? rangeLabel(focusBucket) : ""}{active === null ? " · latest" : ""}</span>
        <ul>
          {series.map((item, index) => (
            <li key={item.key}>
              <i style={{ background: item.color }} aria-hidden="true" />
              <span>{item.label}</span>
              <strong>{focusBucket && focusBucket.values[index] !== null ? formatValue(focusBucket.values[index] as number) : "—"}</strong>
            </li>
          ))}
          {showTotal && series.length > 1 && (
            <li className="tp-readout-total"><span>Total</span><strong>{formatValue(total)}</strong></li>
          )}
        </ul>
      </div>

      <div className="tp-chart-frame" ref={containerRef}>
        <svg
          aria-describedby={`${id}-desc`}
          aria-labelledby={`${id}-title`}
          height={HEIGHT}
          onBlur={() => setActive(null)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setActive(Math.max(0, focus - 1));
            else if (event.key === "ArrowRight") setActive(Math.min(last, focus + 1));
            else if (event.key === "Home") setActive(0);
            else if (event.key === "End") setActive(last);
            else return;
            event.preventDefault();
          }}
          onPointerLeave={() => setActive(null)}
          onPointerMove={(event) => setActive(indexFromClientX(event.clientX, event.currentTarget.getBoundingClientRect()))}
          role="img"
          tabIndex={0}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width="100%"
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description} Use the left and right arrow keys to read values.</desc>

          <g className="tp-grid">
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={left} x2={left + plotWidth} y1={y(tick)} y2={y(tick)} />
                <text x={left - 8} y={y(tick)} dy="0.32em" textAnchor="end">{formatAxis(tick)}</text>
              </g>
            ))}
          </g>

          <g className="tp-x-labels">
            {buckets.map((bucket, index) =>
              index % labelEvery === 0 ? (
                <text key={bucket.start} x={xCenter(index)} y={HEIGHT - 8} textAnchor="middle">{formatShortDate(bucket.start)}</text>
              ) : null,
            )}
          </g>

          {kind === "bar" ? (
            <g>
              {buckets.map((bucket, index) => {
                const barWidth = Math.max(1, Math.min(24, slot - (slot >= 4 ? 2 : 0)));
                const x = xCenter(index) - barWidth / 2;
                let running = 0;
                const segments = bucket.values.map((value, seriesIndex) => {
                  const start = running;
                  running += value ?? 0;
                  return { seriesIndex, start, end: running };
                }).filter((segment) => segment.end > segment.start);
                return (
                  <g key={bucket.start} opacity={active === null || active === index ? 1 : 0.55}>
                    {segments.map((segment, i) => {
                      const top = y(segment.end);
                      const bottom = y(segment.start);
                      const isTop = i === segments.length - 1;
                      const gap = i === 0 ? 0 : 2;
                      const height = Math.max(0.5, bottom - top - gap);
                      return (
                        <path
                          d={isTop ? roundedTopRect(x, top, barWidth, height, 4) : `M${x},${top}h${barWidth}v${height}h${-barWidth}Z`}
                          fill={series[segment.seriesIndex].color}
                          key={segment.seriesIndex}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </g>
          ) : (
            <g>
              {series.map((item, seriesIndex) => {
                const points = buckets.map((bucket, index) => {
                  const value = bucket.values[seriesIndex];
                  return value === null ? null : ([xCenter(index), y(value)] as const);
                });
                let line = "";
                let pen = false;
                for (const point of points) {
                  if (!point) {
                    pen = false;
                    continue;
                  }
                  line += `${pen ? "L" : "M"}${point[0].toFixed(1)},${point[1].toFixed(1)}`;
                  pen = true;
                }
                const defined = points.filter((point): point is readonly [number, number] => point !== null);
                const area = kind === "area" && defined.length > 1
                  ? `M${defined[0][0].toFixed(1)},${baseline}${defined.map((point) => `L${point[0].toFixed(1)},${point[1].toFixed(1)}`).join("")}L${defined[defined.length - 1][0].toFixed(1)},${baseline}Z`
                  : null;
                return (
                  <g key={item.key}>
                    {area && <path d={area} fill={item.color} opacity={0.1} />}
                    <path d={line} fill="none" stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  </g>
                );
              })}
            </g>
          )}

          {lo < 0 && <line className="tp-zero" x1={left} x2={left + plotWidth} y1={baseline} y2={baseline} />}

          {focusBucket && (
            <g className="tp-crosshair" pointerEvents="none">
              {active !== null && <line x1={xCenter(focus)} x2={xCenter(focus)} y1={TOP} y2={TOP + plotHeight} />}
              {kind !== "bar" &&
                series.map((item, seriesIndex) => {
                  const value = focusBucket.values[seriesIndex];
                  return value === null ? null : (
                    <circle cx={xCenter(focus)} cy={y(value)} fill={item.color} key={item.key} r={4} stroke={SURFACE} strokeWidth={2} />
                  );
                })}
            </g>
          )}
        </svg>
      </div>

      <details className="tp-table-toggle" onToggle={(event) => setTableOpen(event.currentTarget.open)}>
        <summary>View as table</summary>
        {tableOpen && (
          <div className="tp-data-table">
            <table>
              <caption>{title}</caption>
              <thead>
                <tr>
                  <th scope="col">{model.size > 1 ? "Period" : "Date"}</th>
                  {series.map((item) => <th key={item.key} scope="col">{item.label}</th>)}
                  {showTotal && series.length > 1 && <th scope="col">Total</th>}
                </tr>
              </thead>
              <tbody>
                {[...buckets].reverse().map((bucket) => (
                  <tr key={bucket.start}>
                    <th scope="row">{rangeLabel(bucket)}</th>
                    {bucket.values.map((value, index) => <td data-label={series[index].label} key={series[index].key}>{value === null ? "—" : formatValue(value)}</td>)}
                    {showTotal && series.length > 1 && <td data-label="Total">{formatValue(bucket.values.reduce<number>((sum, value) => sum + (value ?? 0), 0))}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </div>
  );
}
