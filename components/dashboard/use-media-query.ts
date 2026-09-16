"use client";

import * as React from "react";

/** `true` at the `lg` breakpoint and up. Server render and hydration see `false` (mobile first). */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
