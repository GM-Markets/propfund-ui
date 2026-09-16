/** Display helpers shared by every app screen. All dates render in UTC (PRD §5 "Day"). */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `$1,234` / `-$1,234.50`. */
export function formatUsd(n: number, fractionDigits = 0): string {
  const safe = Number.isFinite(n) ? n : 0;
  const rounded = Number(safe.toFixed(fractionDigits));
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

/** `+$120.00` / `-$80.00` / `$0.00`. */
export function formatSignedUsd(n: number, fractionDigits = 2): string {
  const s = formatUsd(n, fractionDigits);
  return n > 0 && Number(n.toFixed(fractionDigits)) !== 0 ? `+${s}` : s;
}

/** 0.1234 → `12.3%`. */
export function formatPct(fraction: number, fractionDigits = 1): string {
  return `${(fraction * 100).toFixed(fractionDigits)}%`;
}

/** 0.0123 → `+1.23%`. */
export function formatSignedPct(fraction: number, fractionDigits = 2): string {
  const v = fraction * 100;
  const s = `${Math.abs(v).toFixed(fractionDigits)}%`;
  if (Number(v.toFixed(fractionDigits)) === 0) return s;
  return v > 0 ? `+${s}` : `-${s}`;
}

/** Decimal places implied by a tick size (0.01 → 2, 0.00001 → 5, 1 → 0). */
export function decimalsForTick(tick: number): number {
  if (tick >= 1) return 0;
  return Math.max(0, Math.round(-Math.log10(tick)));
}

/** Price with the market's precision and thousands separators. */
export function formatPrice(price: number, tickSize: number): string {
  const d = decimalsForTick(tickSize);
  return price.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** `0x1234…abcd`. */
export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (!address) return "";
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/** `Tue 22 Sep` (UTC). */
export function formatDayDate(ms: number): string {
  const d = new Date(ms);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** `22 Sep 2026` (UTC). */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** `22 Sep 2026, 14:05 UTC`. */
export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(ms)}, ${hh}:${mm} UTC`;
}

/** `14:05:09` (UTC). */
export function formatTime(ms: number): string {
  const d = new Date(ms);
  return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
