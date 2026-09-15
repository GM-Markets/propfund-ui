import { fetchHlAllMids, subscribeHlAllMids } from "@/lib/hl/all-mids";
import type { HypMids } from "@/lib/hyp/mids";

const EMPTY: HypMids = {};

/** How often the desk re-reads Hyperliquid mids into the blotter / ticket. */
export const MIDS_PULSE_MS = 2_000;

let sharedMids: HypMids | undefined;
let sharedDetach: (() => void) | null = null;
const sharedListeners = new Set<(mids: HypMids) => void>();

function applyMids(mids: HypMids): void {
  let changed = sharedMids == null;
  if (sharedMids) {
    for (const [coin, px] of Object.entries(mids)) {
      if (sharedMids[coin] !== px) {
        changed = true;
        break;
      }
    }
  }
  if (!changed) return;
  sharedMids = sharedMids ? { ...sharedMids, ...mids } : mids;
  const snapshot = sharedMids;
  for (const each of sharedListeners) each(snapshot);
}

async function pullAllMids(): Promise<void> {
  try {
    const mids = await fetchHlAllMids();
    if (mids) applyMids(mids);
  } catch {
    // Socket ticks still apply; the next 2s pulse retries.
  }
}

function startTape(): () => void {
  const stopWs = subscribeHlAllMids(applyMids);
  void pullAllMids();
  const pulse = setInterval(() => void pullAllMids(), MIDS_PULSE_MS);
  return () => {
    stopWs();
    clearInterval(pulse);
  };
}

/**
 * One Hyperliquid tape for the desk: live `allMids` socket plus a 2s REST
 * pulse so positions keep marking if the websocket stalls.
 */
export function subscribeSharedHypMids(listener: (mids: HypMids) => void): () => void {
  sharedListeners.add(listener);
  sharedDetach ??= startTape();
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
