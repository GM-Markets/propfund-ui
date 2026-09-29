import { resolveTvLibraryPath } from "./libraryPath";

type TvWindow = Window & { TradingView?: { widget?: unknown } };

export function getTvLibraryScriptSrc(): string {
  const libraryPath = resolveTvLibraryPath();
  const entry = libraryPath.startsWith("http")
    ? "charting_library.standalone.js"
    : "charting_library.js";
  return `${libraryPath}${entry}`;
}

let inflight: Promise<void> | null = null;

export function ensureTradingViewScript(src = getTvLibraryScriptSrc()): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as TvWindow;
  if (w.TradingView?.widget) return Promise.resolve();
  if (inflight) return inflight;

  const existing = document.querySelector<HTMLScriptElement>('script[data-tv-lib="1"]');
  if (existing) {
    const pending = new Promise<void>((resolve, reject) => {
      if ((window as TvWindow).TradingView?.widget) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("TradingView script failed")), {
        once: true,
      });
    });
    inflight = pending;
    void pending.finally(() => {
      if (inflight === pending) inflight = null;
    });
    return pending;
  }

  const pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.tvLib = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
  inflight = pending;
  void pending.finally(() => {
    if (inflight === pending) inflight = null;
  });
  return pending;
}
