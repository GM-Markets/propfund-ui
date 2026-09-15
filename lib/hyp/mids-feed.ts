import { subscribeHlAllMids } from "@/lib/hl/all-mids";
import type { HypMids } from "@/lib/hyp/mids";

const EMPTY: HypMids = {};

let sharedMids: HypMids | undefined;
let sharedDetach: (() => void) | null = null;
const sharedListeners = new Set<(mids: HypMids) => void>();

/**
 * One Hyperliquid `allMids` socket for the desk. Extra React subscribers
 * must not open another websocket.
 */
export function subscribeSharedHypMids(listener: (mids: HypMids) => void): () => void {
  sharedListeners.add(listener);
  sharedDetach ??= subscribeHlAllMids((mids) => {
    sharedMids = sharedMids ? { ...sharedMids, ...mids } : mids;
    const snapshot = sharedMids;
    for (const each of sharedListeners) each(snapshot);
  });
  return () => {
    sharedListeners.delete(listener);
    if (sharedListeners.size > 0) return;
    sharedDetach?.();
    sharedDetach = null;
  };
}

export function sharedHypMidsSnapshot(): HypMids | undefined {
  return sharedMids;
}

export function subscribeHypMidsStore(onStoreChange: () => void): () => void {
  return subscribeSharedHypMids(() => onStoreChange());
}

export function getHypMidsSnapshot(): HypMids {
  return sharedMids ?? EMPTY;
}
