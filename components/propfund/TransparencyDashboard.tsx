"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MaterialIcon } from "./MaterialIcon";
import { TransparencyChart, type ChartAggregate, type ChartKind, type ChartSeries } from "./TransparencyChart";
import { explorerTxUrl, type PublishedAddress } from "./transparency-config";
import { ASSET_CLASSES, type TransparencyData } from "./transparency-data";
import {
  formatCount,
  formatCountCompact,
  formatHours,
  formatLongDate,
  formatPercent,
  formatShortDate,
  formatUsd,
  formatUsdCents,
  formatUsdCompact,
} from "./transparency-format";

/* Categorical slots, validated for the dark chart surface (#1c1a1b): lightness band, chroma, CVD and contrast. */
const SLOTS = ["#d55ba8", "#3a8fd9", "#c98500", "#8f7ae6", "#199e70"] as const;

export const TRANSPARENCY_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "revenue", label: "Revenue" },
  { id: "challenges", label: "Challenges" },
  { id: "trading", label: "Trading" },
  { id: "funded", label: "Funded" },
  { id: "payouts", label: "Payouts" },
  { id: "risk", label: "Risk" },
  { id: "addresses", label: "Addresses" },
] as const;

const RANGES = [
  { id: "7d", label: "7d", days: 7 },
  { id: "30d", label: "30d", days: 30 },
  { id: "90d", label: "90d", days: 90 },
  { id: "all", label: "All", days: Infinity },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

function sliceRange<T>(values: T[], range: RangeId): T[] {
  const days = RANGES.find((item) => item.id === range)?.days ?? Infinity;
  return Number.isFinite(days) ? values.slice(-days) : values;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/* ------------------------------------------------------------------ */
/* Small pieces                                                       */
/* ------------------------------------------------------------------ */

export function SampleBadge({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className={`tp-sample-badge tp-sample-badge-${tone}`} title="Illustrative figures. Real figures are published once Propfund is live.">
      <i aria-hidden="true" />Sample data
    </span>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="tp-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button aria-pressed={value === option.id} key={option.id} onClick={() => onChange(option.id)} type="button">
          {option.label}
        </button>
      ))}
    </div>
  );
}

type StatItem = { label: string; value: string; caption: string };

function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="tp-stat-grid">
      {items.map((item) => (
        <article className="tp-stat" key={item.label}>
          <h3>{item.label}</h3>
          <strong>{item.value}</strong>
          <p>{item.caption}</p>
        </article>
      ))}
    </div>
  );
}

function SectionHead({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <header className="tp-section-head">
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

type ChartView = {
  id: string;
  label: string;
  kind: ChartKind;
  aggregate: ChartAggregate;
  series: ChartSeries[];
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
  showTotal?: boolean;
  headline?: (range: RangeId) => { label: string; value: string }[];
};

function ChartCard({
  title,
  description,
  dates,
  views,
  wide = false,
  defaultRange = "30d",
}: {
  title: string;
  description: string;
  dates: string[];
  views: ChartView[];
  wide?: boolean;
  defaultRange?: RangeId;
}) {
  const [range, setRange] = useState<RangeId>(defaultRange);
  const [viewId, setViewId] = useState(views[0].id);
  const view = views.find((item) => item.id === viewId) ?? views[0];
  const rangeDates = useMemo(() => sliceRange(dates, range), [dates, range]);
  const series = useMemo(() => view.series.map((item) => ({ ...item, values: sliceRange(item.values, range) })), [view, range]);
  const headline = view.headline?.(range) ?? [];

  return (
    <article className={`tp-card${wide ? " tp-card-wide" : ""}`}>
      <header className="tp-card-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <SampleBadge />
      </header>
      <div className="tp-card-controls">
        <Segmented label={`${title} time range`} onChange={setRange} options={RANGES} value={range} />
        {views.length > 1 && <Segmented label={`${title} view`} onChange={setViewId} options={views} value={viewId} />}
      </div>
      {headline.length > 0 && (
        <dl className="tp-headline">
          {headline.map((item) => (
            <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
          ))}
        </dl>
      )}
      <TransparencyChart
        aggregate={view.aggregate}
        dates={rangeDates}
        description={`${description} ${formatShortDate(rangeDates[0])} to ${formatShortDate(rangeDates[rangeDates.length - 1])}. Sample data.`}
        formatAxis={view.formatAxis}
        formatValue={view.formatValue}
        key={`${view.id}-${range}`}
        kind={view.kind}
        series={series}
        showTotal={view.showTotal}
        title={`${title}${views.length > 1 ? ` · ${view.label}` : ""}`}
      />
    </article>
  );
}

/** Horizontal share bars for a category split over the chosen range. */
function ShareCard({
  title,
  description,
  dates,
  rows,
  formatValue,
}: {
  title: string;
  description: string;
  dates: string[];
  rows: { key: string; label: string; color: string; values: number[] }[];
  formatValue: (value: number) => string;
}) {
  const [range, setRange] = useState<RangeId>("30d");
  const totals = rows.map((row) => ({ ...row, total: sum(sliceRange(row.values, range)) }));
  const grand = sum(totals.map((row) => row.total)) || 1;
  const max = Math.max(...totals.map((row) => row.total), 1);
  const rangeDates = sliceRange(dates, range);

  return (
    <article className="tp-card">
      <header className="tp-card-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <SampleBadge />
      </header>
      <div className="tp-card-controls">
        <Segmented label={`${title} time range`} onChange={setRange} options={RANGES} value={range} />
      </div>
      <p className="tp-share-period">{formatShortDate(rangeDates[0])} – {formatShortDate(rangeDates[rangeDates.length - 1])}</p>
      <ul className="tp-share-list" aria-label={title}>
        {totals.map((row) => (
          <li key={row.key}>
            <div className="tp-share-label"><i aria-hidden="true" style={{ background: row.color }} /><span>{row.label}</span><strong>{formatPercent(row.total / grand)}</strong></div>
            <div className="tp-share-track" aria-hidden="true"><span style={{ width: `${(row.total / max) * 100}%`, background: row.color }} /></div>
            <small>{formatValue(row.total)}</small>
          </li>
        ))}
      </ul>
    </article>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [state]);
  return (
    <button
      aria-label={`Copy ${label}`}
      className="tp-icon-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("copied");
        } catch {
          setState("failed");
        }
      }}
      type="button"
    >
      <MaterialIcon name={state === "copied" ? "check" : "content_copy"} />
      <span>{state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

export function TransparencyDashboard({ data, addresses }: { data: TransparencyData; addresses: PublishedAddress[] }) {
  const { dates, series, stats, packages } = data;
  const [activeSection, setActiveSection] = useState<string>(TRANSPARENCY_SECTIONS[0].id);
  const chipRowRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = TRANSPARENCY_SECTIONS.map((section) => document.getElementById(section.id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const row = chipRowRef.current;
    const chip = row?.querySelector<HTMLElement>(`[data-section="${activeSection}"]`);
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
    const target = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeSection]);

  const packageSeries = (source: Record<string, number[]>): ChartSeries[] =>
    packages.map((plan, index) => ({ key: plan.id, label: `${plan.name} ${plan.label}`, color: SLOTS[index % SLOTS.length], values: source[plan.id] }));

  const overview: StatItem[] = [
    { label: "Challenge fee revenue", value: formatUsdCompact(stats.feeRevenueLifetime), caption: `Lifetime · ${formatUsd(stats.feeRevenueLifetime)}` },
    { label: "Annualized run rate", value: formatUsdCompact(stats.annualizedRunRate), caption: "Last 30 days of fees × 365 / 30, excluding today" },
    { label: "Total payouts", value: formatUsdCompact(stats.totalPayouts), caption: `${formatCount(stats.payoutCount)} payouts, lifetime` },
    { label: "Largest single payout", value: formatUsdCompact(stats.largestPayout), caption: formatUsdCents(stats.largestPayout) },
    { label: "Median time to pay", value: formatHours(stats.medianHoursToPay), caption: "From payout request to payment" },
    { label: "Active traders", value: formatCount(stats.activeTraders30d), caption: "With an open account in the last 30 days" },
    { label: "Paying traders", value: formatCount(stats.payingTraders), caption: "Bought at least one challenge" },
    { label: "Funded traders", value: formatCount(stats.fundedTraders), caption: "Funded accounts open now" },
    { label: "Funded capital", value: formatUsdCompact(stats.fundedCapital), caption: "Simulated account size of open funded accounts" },
    { label: "Pass rate", value: formatPercent(stats.passRate), caption: `${formatCount(stats.passes)} passed of ${formatCount(stats.resolvedChallenges)} resolved challenges` },
    { label: "Payouts vs fee revenue", value: formatPercent(stats.payoutsShareOfRevenue), caption: "Total payouts ÷ challenge fee revenue" },
    { label: "Challenges sold", value: formatCount(stats.challengesSold), caption: "Lifetime, including rebuys" },
  ];

  const riskStats: StatItem[] = [
    { label: "Hedging P&L realized", value: formatUsdCompact(stats.hedgingRealized), caption: "Lifetime, closed hedges" },
    { label: "Hedging P&L unrealized", value: formatUsdCompact(stats.hedgingUnrealized), caption: `Open hedges at ${formatShortDate(data.asOf)} close` },
    { label: "Payouts covered by hedging", value: formatPercent(stats.hedgingCoverage), caption: "Realized hedging P&L ÷ total payouts" },
  ];

  const rangedSum = (values: number[], range: RangeId) => sum(sliceRange(values, range));
  const rangeLabel = (range: RangeId) => (range === "all" ? "All time" : `Last ${range}`);

  return (
    <div className="tp-body">
      <div className="route-container tp-layout">
        <nav aria-label="Transparency sections" className="tp-nav" ref={chipRowRef}>
          {TRANSPARENCY_SECTIONS.map((section) => (
            <a aria-current={activeSection === section.id ? "true" : undefined} className={activeSection === section.id ? "active" : ""} data-section={section.id} href={`#${section.id}`} key={section.id}>
              {section.label}
            </a>
          ))}
        </nav>

        <div className="tp-content">
          <section aria-labelledby="overview-title" className="tp-section" id="overview">
            <SectionHead description={`Headline figures to ${formatLongDate(data.asOf)}, UTC.`} id="overview" title="Overview" />
            <StatGrid items={overview} />
          </section>

          <section aria-labelledby="activity-title" className="tp-section" id="activity">
            <SectionHead description="How many traders are on the platform, day by day." id="activity" title="Activity" />
            <ChartCard
              dates={dates}
              description="Traders with an open challenge or funded account each day, and traders who have ever paid for a challenge."
              title="Traders over time"
              views={[{
                id: "traders",
                label: "Traders",
                kind: "line",
                aggregate: "last",
                formatAxis: formatCountCompact,
                formatValue: formatCount,
                series: [
                  { key: "active", label: "Active traders", color: SLOTS[0], values: series.activeTraders },
                  { key: "paying", label: "Paying traders (cumulative)", color: SLOTS[1], values: series.payingTraders },
                ],
              }]}
              wide
            />
          </section>

          <section aria-labelledby="revenue-title" className="tp-section" id="revenue">
            <SectionHead description="Challenge fees and rebuy fees, split by package." id="revenue" title="Revenue" />
            <ChartCard
              dates={dates}
              description="Challenge fee revenue by package."
              title="Fee revenue"
              views={[
                {
                  id: "daily",
                  label: "Daily",
                  kind: "bar",
                  aggregate: "sum",
                  formatAxis: formatUsdCompact,
                  formatValue: formatUsd,
                  showTotal: true,
                  series: packageSeries(series.revenueByPackage),
                  headline: (range) => [{ label: rangeLabel(range), value: formatUsd(rangedSum(series.revenueDaily, range)) }],
                },
                {
                  id: "cumulative",
                  label: "Cumulative",
                  kind: "area",
                  aggregate: "last",
                  formatAxis: formatUsdCompact,
                  formatValue: formatUsd,
                  series: [{ key: "cumulative", label: "Cumulative fee revenue", color: SLOTS[0], values: series.revenueCumulative }],
                  headline: () => [{ label: "Lifetime", value: formatUsd(stats.feeRevenueLifetime) }],
                },
              ]}
              wide
            />
          </section>

          <section aria-labelledby="challenges-title" className="tp-section" id="challenges">
            <SectionHead description="How challenges resolve and which packages traders buy." id="challenges" title="Challenges" />
            <div className="tp-card-grid">
              <ChartCard
                dates={dates}
                description="Running pass rate: challenges passed ÷ challenges resolved, up to each day."
                title="Pass rate over time"
                views={[{
                  id: "pass-rate",
                  label: "Pass rate",
                  kind: "line",
                  aggregate: "last",
                  formatAxis: (value) => formatPercent(value, 0),
                  formatValue: (value) => formatPercent(value),
                  series: [{ key: "pass-rate", label: "Pass rate", color: SLOTS[0], values: series.passRate }],
                  headline: () => [{ label: "Passed", value: `${formatCount(stats.passes)} of ${formatCount(stats.resolvedChallenges)}` }],
                }]}
              />
              <ChartCard
                dates={dates}
                description="Challenges closed by the daily loss limit or the max loss limit."
                title="Breaches by limit"
                views={[{
                  id: "breaches",
                  label: "Breaches",
                  kind: "bar",
                  aggregate: "sum",
                  formatAxis: formatCountCompact,
                  formatValue: formatCount,
                  showTotal: true,
                  series: [
                    { key: "daily", label: "Daily loss limit", color: SLOTS[0], values: series.breachesDaily },
                    { key: "max", label: "Max loss limit", color: SLOTS[1], values: series.breachesMax },
                  ],
                }]}
              />
              <ShareCard
                dates={dates}
                description="Challenges bought, including rebuys, by package."
                formatValue={(value) => `${formatCount(value)} challenges`}
                rows={packages.map((plan, index) => ({ key: plan.id, label: `${plan.name} ${plan.label}`, color: SLOTS[index % SLOTS.length], values: series.purchasesByPackage[plan.id] }))}
                title="Purchases by package"
              />
            </div>
          </section>

          <section aria-labelledby="trading-title" className="tp-section" id="trading">
            <SectionHead description="Simulated trading activity across every open account." id="trading" title="Trading" />
            <div className="tp-card-grid">
              <ChartCard
                dates={dates}
                description="Daily notional volume traded in simulated accounts."
                title="Notional volume"
                views={[{
                  id: "volume",
                  label: "Volume",
                  kind: "bar",
                  aggregate: "sum",
                  formatAxis: formatUsdCompact,
                  formatValue: formatUsd,
                  series: [{ key: "volume", label: "Notional volume", color: SLOTS[0], values: series.notionalVolume }],
                  headline: (range) => [{ label: rangeLabel(range), value: formatUsdCompact(rangedSum(series.notionalVolume, range)) }],
                }]}
              />
              <ChartCard
                dates={dates}
                description="Daily number of trades placed by hand in the terminal."
                title="Trade count"
                views={[{
                  id: "trades",
                  label: "Trades",
                  kind: "bar",
                  aggregate: "sum",
                  formatAxis: formatCountCompact,
                  formatValue: formatCount,
                  series: [{ key: "trades", label: "Trades", color: SLOTS[1], values: series.tradeCount }],
                  headline: (range) => [{ label: rangeLabel(range), value: formatCount(rangedSum(series.tradeCount, range)) }],
                }]}
              />
              <ShareCard
                dates={dates}
                description="Share of notional volume by asset class."
                formatValue={(value) => formatUsdCompact(value)}
                rows={ASSET_CLASSES.map((name, index) => ({ key: name, label: name, color: SLOTS[index], values: series.volumeByAssetClass[name] }))}
                title="Volume by asset class"
              />
            </div>
          </section>

          <section aria-labelledby="funded-title" className="tp-section" id="funded">
            <SectionHead description="Traders who passed and the simulated capital on their accounts." id="funded" title="Funded" />
            <ChartCard
              dates={dates}
              description="Open funded accounts and their combined simulated account size."
              title="Funded traders and capital"
              views={[
                {
                  id: "traders",
                  label: "Traders",
                  kind: "area",
                  aggregate: "last",
                  formatAxis: formatCountCompact,
                  formatValue: formatCount,
                  series: [{ key: "funded", label: "Funded traders", color: SLOTS[1], values: series.fundedTraders }],
                  headline: () => [{ label: "Now", value: formatCount(stats.fundedTraders) }],
                },
                {
                  id: "capital",
                  label: "Capital",
                  kind: "area",
                  aggregate: "last",
                  formatAxis: formatUsdCompact,
                  formatValue: formatUsd,
                  series: [{ key: "capital", label: "Funded capital", color: SLOTS[3], values: series.fundedCapital }],
                  headline: () => [{ label: "Now", value: formatUsdCompact(stats.fundedCapital) }],
                },
              ]}
              wide
            />
          </section>

          <section aria-labelledby="payouts-title" className="tp-section" id="payouts">
            <SectionHead description="USDC paid to funded traders on Arbitrum, 7 days after each request." id="payouts" title="Payouts" />
            <ChartCard
              dates={dates}
              description="Payouts sent to traders in USDC on Arbitrum."
              title="Payouts history"
              views={[
                {
                  id: "daily",
                  label: "Daily",
                  kind: "bar",
                  aggregate: "sum",
                  formatAxis: formatUsdCompact,
                  formatValue: formatUsdCents,
                  series: [{ key: "daily", label: "Paid", color: SLOTS[4], values: series.payoutsDaily }],
                  headline: (range) => [{ label: rangeLabel(range), value: formatUsdCents(rangedSum(series.payoutsDaily, range)) }],
                },
                {
                  id: "cumulative",
                  label: "Cumulative",
                  kind: "area",
                  aggregate: "last",
                  formatAxis: formatUsdCompact,
                  formatValue: formatUsdCents,
                  series: [{ key: "cumulative", label: "Total paid", color: SLOTS[4], values: series.payoutsCumulative }],
                  headline: () => [{ label: "Total paid", value: formatUsdCents(stats.totalPayouts) }],
                },
              ]}
              wide
            />

            <article className="tp-card tp-card-wide">
              <header className="tp-card-head">
                <div>
                  <h3>Recent payouts</h3>
                  <p>Trader IDs are anonymized. Names and emails are never published.</p>
                </div>
                <SampleBadge />
              </header>
              <table className="tp-payout-table">
                <caption className="tp-sr-only">Recent payouts</caption>
                <thead>
                  <tr><th scope="col">Paid</th><th scope="col">Trader</th><th scope="col">Amount</th><th scope="col">Transaction</th></tr>
                </thead>
                <tbody>
                  {data.recentPayouts.map((payout) => (
                    <tr key={payout.id}>
                      <td data-label="Paid">{formatLongDate(payout.paidOn)}</td>
                      <td data-label="Trader"><code>{payout.traderId}</code></td>
                      <td data-label="Amount">{formatUsdCents(payout.amount)}</td>
                      <td data-label="Transaction">
                        {payout.txHash && explorerTxUrl("arbitrum", payout.txHash) ? (
                          <a href={explorerTxUrl("arbitrum", payout.txHash) ?? undefined} rel="noreferrer" target="_blank">
                            {payout.txHash.slice(0, 8)}…{payout.txHash.slice(-6)} <MaterialIcon name="north_east" />
                          </a>
                        ) : (
                          <span className="tp-muted">Sample · no transaction</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>

          <section aria-labelledby="risk-title" className="tp-section" id="risk">
            <SectionHead description="How Propfund offsets payout exposure by hedging funded traders' positions." id="risk" title="Risk" />
            <StatGrid items={riskStats} />
            <ChartCard
              dates={dates}
              description="Cumulative realized hedging P&L and unrealized P&L on open hedges."
              title="Hedging P&L"
              views={[{
                id: "hedging",
                label: "Hedging",
                kind: "line",
                aggregate: "last",
                formatAxis: formatUsdCompact,
                formatValue: formatUsd,
                series: [
                  { key: "realized", label: "Realized (cumulative)", color: SLOTS[4], values: series.hedgingRealizedCumulative },
                  { key: "unrealized", label: "Unrealized", color: SLOTS[2], values: series.hedgingUnrealized },
                ],
              }]}
              wide
            />
          </section>

          <section aria-labelledby="addresses-title" className="tp-section" id="addresses">
            <SectionHead description="The wallets that send payouts and receive challenge fees. Check any of them on a block explorer." id="addresses" title="Addresses" />
            <ul className="tp-address-list">
              {addresses.map((item) => (
                <li className="tp-address" key={item.id}>
                  <div className="tp-address-meta">
                    <span className="tp-chain">{item.chainName}</span>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                  </div>
                  {item.address ? (
                    <div className="tp-address-value">
                      <code>{item.address}</code>
                      <div className="tp-address-actions">
                        <CopyButton label={`${item.label} address on ${item.chainName}`} value={item.address} />
                        {item.explorerUrl && (
                          <a className="tp-icon-button" href={item.explorerUrl} rel="noreferrer" target="_blank">
                            <MaterialIcon name="north_east" /><span>Explorer</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="tp-address-value tp-address-pending">
                      <span>Published at launch</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
