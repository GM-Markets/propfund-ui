/**
 * Hyperliquid spot display rules — same as gm-markets-new.
 * Unit-bridged tokens (`UBTC`, "Unit Bitcoin") render as the coin they wrap.
 * Gated on the "Unit " full name, never the leading U, so USDE / USDT0 / UNI stay.
 */

export function spotUnderlyingBase(name: string, fullName?: string | null): string {
  const base = name.trim().toUpperCase();
  const isUnit = /^unit\s/i.test(fullName?.trim() ?? "");
  return isUnit && base.length > 1 && base.startsWith("U") ? base.slice(1) : base;
}

export function spotDisplayName(name: string, fullName?: string | null): string {
  const full = fullName?.trim() ?? "";
  return full.replace(/^unit\s+/i, "") || `${spotUnderlyingBase(name, fullName)} spot`;
}

export function spotDisplayTicker(name: string, fullName?: string | null): string {
  return spotUnderlyingBase(name, fullName);
}

export function spotPairLabel(base: string): string {
  return `${base.trim().toUpperCase()}/USDC`;
}

export function isQuotedSpotMid(mid: number): boolean {
  return Number.isFinite(mid) && mid > 0;
}
