/**
 * Mock clock. Real time plus an offset that test controls can advance
 * (to 00:00 UTC, +1 day, +7 days). Every rule that depends on time reads `now()`.
 */
import { DAY_MS, nextUtcMidnight } from "@/lib/propfund/rules/time";

import { readJson, storageKeys, writeJson } from "./storage";

let offsetMs = 0;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const stored = readJson<number>(storageKeys.clockOffset);
  if (typeof stored === "number" && Number.isFinite(stored)) offsetMs = stored;
}

export function now(): number {
  load();
  return Date.now() + offsetMs;
}

export function getClockOffset(): number {
  load();
  return offsetMs;
}

function setOffset(next: number) {
  offsetMs = next;
  writeJson(storageKeys.clockOffset, offsetMs);
  listeners.forEach((l) => l());
}

/** Jump to the next 00:00:00 UTC (plus 1 s so the new day has started). */
export function advanceToNextUtcMidnight(): number {
  const t = now();
  setOffset(offsetMs + (nextUtcMidnight(t) - t) + 1_000);
  return now();
}

export function advanceDays(days: number): number {
  setOffset(offsetMs + days * DAY_MS);
  return now();
}

export function resetClock(): void {
  setOffset(0);
}

/** Notified when the offset changes (not on every real-time millisecond). */
export function subscribeClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test helper: force a specific offset without persistence side effects on load. */
export function _setClockOffsetForTests(ms: number): void {
  loaded = true;
  offsetMs = ms;
}
