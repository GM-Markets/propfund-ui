/** Number and date formatting for the Transparency page. Fixed locale and UTC so server and client match. */

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

function compact(value: number): { text: string; suffix: string } {
  const abs = Math.abs(value);
  if (abs >= 1e9) return { text: trim(value / 1e9), suffix: "B" };
  if (abs >= 1e6) return { text: trim(value / 1e6), suffix: "M" };
  if (abs >= 1e4) return { text: trim(value / 1e3), suffix: "K" };
  return { text: int.format(Math.round(value)), suffix: "" };
}

function trim(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return value.toFixed(digits).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
}

export function formatUsd(value: number): string {
  return usd0.format(value);
}

export function formatUsdCents(value: number): string {
  return usd2.format(value);
}

/** $2.75M, $412K, $9,850 */
export function formatUsdCompact(value: number): string {
  const { text, suffix } = compact(value);
  return `${value < 0 ? "−" : ""}$${text.replace("-", "")}${suffix}`;
}

export function formatCount(value: number): string {
  return int.format(Math.round(value));
}

export function formatCountCompact(value: number): string {
  const { text, suffix } = compact(value);
  return `${text}${suffix}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/** 172 hours → "7d 4h" */
export function formatHours(hours: number): string {
  const whole = Math.round(hours);
  const days = Math.floor(whole / 24);
  const rest = whole % 24;
  return days ? `${days}d ${rest}h` : `${rest}h`;
}

/** "2026-09-14" → "Sep 14" */
export function formatShortDate(iso: string): string {
  return shortDate.format(new Date(`${iso}T00:00:00Z`));
}

/** "2026-09-14" → "14 Sep 2026" */
export function formatLongDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return `${date.getUTCDate()} ${monthShort.format(date)} ${date.getUTCFullYear()}`;
}
