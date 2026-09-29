import type { HlCandleInterval } from "@/lib/hl/info";

export const TV_RESOLUTIONS = ["1", "5", "15", "60", "240", "1D"] as const;

export function tvResolutionToHl(resolution: string): HlCandleInterval | null {
  switch (resolution) {
    case "1":
      return "1m";
    case "5":
      return "5m";
    case "15":
      return "15m";
    case "60":
      return "1h";
    case "240":
      return "4h";
    case "1D":
    case "D":
    case "1d":
      return "1d";
    default:
      return null;
  }
}

export function hlIntervalMs(interval: HlCandleInterval): number {
  switch (interval) {
    case "1m":
      return 60_000;
    case "5m":
      return 5 * 60_000;
    case "15m":
      return 15 * 60_000;
    case "1h":
      return 60 * 60_000;
    case "4h":
      return 4 * 60 * 60_000;
    case "1d":
      return 24 * 60 * 60_000;
  }
}

export function unixMs(value: number): number {
  return value > 0 && value < 1e12 ? value * 1000 : value;
}
