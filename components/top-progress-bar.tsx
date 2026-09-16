"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Global top progress bar on route change (PRD §10). The App Router has no
 * navigation events, so it starts on same-origin link clicks (or
 * `startRouteProgress()` before a programmatic `router.push`) and completes
 * when the pathname changes.
 */
const START_EVENT = "propfund:route-progress-start";

/**
 * A prefetched route swaps in well inside this, so the bar never appears for it.
 * It only shows up when a navigation is actually making the user wait.
 */
const SHOW_AFTER_MS = 150;

export function startRouteProgress(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
}

function isInternalNavigation(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname) return null;
  return url.pathname;
}

export function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = React.useState<number | null>(null);
  const trickle = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const safety = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hide = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const arm = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = React.useCallback(() => {
    if (trickle.current) clearInterval(trickle.current);
    if (safety.current) clearTimeout(safety.current);
    if (hide.current) clearTimeout(hide.current);
    if (arm.current) clearTimeout(arm.current);
    trickle.current = safety.current = hide.current = arm.current = null;
  }, []);

  const finish = React.useCallback(() => {
    clearTimers();
    setProgress((p) => (p === null ? null : 1));
    hide.current = setTimeout(() => setProgress(null), 260);
  }, [clearTimers]);

  const start = React.useCallback(() => {
    clearTimers();
    // Hold off: an instant transition finishes before the bar is ever shown.
    arm.current = setTimeout(() => {
      setProgress(0.12);
      trickle.current = setInterval(() => {
        setProgress((p) => (p === null ? p : Math.min(0.9, p + (0.9 - p) * 0.12)));
      }, 180);
    }, SHOW_AFTER_MS);
    safety.current = setTimeout(finish, 10_000);
  }, [clearTimers, finish]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isInternalNavigation(e)) start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, start);
      clearTimers();
    };
  }, [start, clearTimers]);

  React.useEffect(() => {
    finish();
  }, [pathname, finish]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      style={{ opacity: progress === null || progress >= 1 ? 0 : 1, transition: "opacity 240ms ease" }}
    >
      <div
        className="h-full origin-left bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.7)]"
        style={{
          transform: `scaleX(${progress ?? 0})`,
          transition: progress === null ? "none" : "transform 200ms ease-out",
        }}
      />
    </div>
  );
}
