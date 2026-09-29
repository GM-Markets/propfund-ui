/**
 * TradingView Advanced Charts static `library_path` (trailing slash required).
 * Override with NEXT_PUBLIC_TV_LIBRARY_PATH.
 */
export const DEFAULT_TV_LIBRARY_CDN_PATH =
  "https://cdn.gm.markets/public/charting_library/32.0.0/";

export function resolveTvLibraryPath(): string {
  const fromEnv = process.env.NEXT_PUBLIC_TV_LIBRARY_PATH?.trim();
  const path = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_TV_LIBRARY_CDN_PATH;
  return path.endsWith("/") ? path : `${path}/`;
}
