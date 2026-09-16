/**
 * In-browser data store for the signed-in user, persisted to localStorage and
 * keyed by sign-in user id (PRD §12). Snapshots are immutable: every commit
 * replaces the state object, so `useSyncExternalStore` sees changes.
 */
import type {
  Account,
  CardCheckout,
  Deposit,
  Fill,
  Kyc,
  Order,
  Payment,
  Payout,
  Position,
  RebuyOffer,
  Takeover,
  User,
  WalletBalance,
} from "@/lib/propfund/types";

import { now } from "./clock";
import { ServiceError } from "./errors";
import { deterministicAddress } from "./ids";
import { readJson, removeKey, storageKeys, writeJson } from "./storage";

export const DATA_VERSION = 1;

export type UserData = {
  version: typeof DATA_VERSION;
  user: User;
  kyc: Kyc;
  accounts: Account[];
  positions: Position[];
  orders: Order[];
  fills: Fill[];
  deposits: Deposit[];
  payments: Payment[];
  cardCheckouts: CardCheckout[];
  payouts: Payout[];
  walletBalances: WalletBalance[];
  rebuyOffer: RebuyOffer | null;
  takeover: Takeover | null;
  /** Test-only switches. */
  testFlags: { restrictedRegion: boolean };
};

export type SessionUser = { id: string; email: string | null; walletAddress: string | null };

export type StoreSnapshot =
  | { status: "signed_out"; data: null }
  | { status: "loading"; userId: string; data: null }
  | { status: "ready"; userId: string; data: UserData };

/** Test balances seeded into a new user's Propfund wallet so wallet deposits can be tried. */
const SEED_BALANCES: WalletBalance[] = [
  { chain: "arbitrum", token: "USDC", amount: 1_250 },
  { chain: "arbitrum", token: "USDT", amount: 0 },
  { chain: "ethereum", token: "USDC", amount: 0 },
  { chain: "ethereum", token: "USDT", amount: 300 },
  { chain: "base", token: "USDC", amount: 180 },
  { chain: "base", token: "USDT", amount: 0 },
  { chain: "bnb", token: "USDC", amount: 0 },
  { chain: "bnb", token: "USDT", amount: 75 },
];

export function createUserData(session: SessionUser, atMs: number): UserData {
  return {
    version: DATA_VERSION,
    user: {
      id: session.id,
      email: session.email,
      walletAddress: session.walletAddress,
      depositAddress: deterministicAddress(session.id, "deposit"),
      depositCreditUsd: 0,
      barred: false,
      createdAt: atMs,
    },
    kyc: { status: "not_started", submittedAt: null, updatedAt: null, note: null },
    accounts: [],
    positions: [],
    orders: [],
    fills: [],
    deposits: [],
    payments: [],
    cardCheckouts: [],
    payouts: [],
    walletBalances: SEED_BALANCES.map((b) => ({ ...b })),
    rebuyOffer: null,
    takeover: null,
    testFlags: { restrictedRegion: false },
  };
}

function isUserData(v: unknown, userId: string): v is UserData {
  if (!v || typeof v !== "object") return false;
  const d = v as Partial<UserData>;
  return d.version === DATA_VERSION && d.user?.id === userId && Array.isArray(d.accounts);
}

// ── store ──────────────────────────────────────────────────────────────────

const SIGNED_OUT: StoreSnapshot = { status: "signed_out", data: null };

let snapshot: StoreSnapshot = SIGNED_OUT;
let sessionToken = 0;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
/**
 * Zero: the data is already in localStorage, so a signed-in user's screens are
 * ready in the same frame sign-in resolves. A real backend can set a delay here
 * (or tests can, to exercise the loading state).
 */
let hydrationDelayMs = 0;
const listeners = new Set<() => void>();
const persistErrorListeners = new Set<(key: string) => void>();

export function getSnapshot(): StoreSnapshot {
  return snapshot;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Notified when a localStorage write fails (quota, blocked storage). */
export function onPersistError(listener: (key: string) => void): () => void {
  persistErrorListeners.add(listener);
  return () => persistErrorListeners.delete(listener);
}

function emit() {
  listeners.forEach((l) => l());
}

export function setHydrationDelay(ms: number): void {
  hydrationDelayMs = ms;
}

/**
 * Point the store at a signed-in user (or null on sign-out). Loads that user's
 * data from localStorage, creating it on first sign-in.
 */
export function setSessionUser(session: SessionUser | null): Promise<void> {
  const token = ++sessionToken;
  flushPersist();
  if (!session) {
    snapshot = SIGNED_OUT;
    emit();
    return Promise.resolve();
  }
  if (snapshot.status === "ready" && snapshot.userId === session.id) {
    // Same user: only refresh profile fields that come from sign-in.
    const { user } = snapshot.data;
    if (user.email !== session.email || user.walletAddress !== session.walletAddress) {
      commit((d) => {
        d.user.email = session.email;
        d.user.walletAddress = session.walletAddress ?? d.user.walletAddress;
      });
    }
    return Promise.resolve();
  }
  snapshot = { status: "loading", userId: session.id, data: null };
  emit();

  const load = () => {
    if (token !== sessionToken) return;
    const stored = readJson<unknown>(storageKeys.user(session.id));
    const data = isUserData(stored, session.id) ? stored : createUserData(session, now());
    data.user.email = session.email ?? data.user.email;
    data.user.walletAddress = session.walletAddress ?? data.user.walletAddress;
    snapshot = { status: "ready", userId: session.id, data };
    schedulePersist();
    emit();
  };

  if (hydrationDelayMs <= 0) {
    load();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      load();
      resolve();
    }, hydrationDelayMs);
  });
}

/** Current user's data or throw (service functions). */
export function requireData(): UserData {
  if (snapshot.status === "signed_out") {
    throw new ServiceError("UNAUTHENTICATED", "Sign in to continue.");
  }
  if (snapshot.status === "loading") {
    throw new ServiceError("NOT_READY", "Your account is still loading. Try again in a moment.");
  }
  return snapshot.data;
}

/**
 * Apply a mutation to a deep copy of the current data. Return `false` from the
 * mutator to discard the copy (nothing changed). Throwing discards it too.
 */
export function commit(mutator: (draft: UserData) => boolean | void): boolean {
  const current = requireData();
  const draft = structuredClone(current);
  const result = mutator(draft);
  if (result === false) return false;
  if (snapshot.status !== "ready" || snapshot.data !== current) {
    // The session changed while mutating: drop the write.
    return false;
  }
  snapshot = { status: "ready", userId: snapshot.userId, data: draft };
  schedulePersist();
  emit();
  return true;
}

function schedulePersist() {
  if (persistTimer) return;
  if (typeof window === "undefined") return;
  persistTimer = setTimeout(flushPersist, 250);
}

export function flushPersist(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (snapshot.status !== "ready") return;
  const key = storageKeys.user(snapshot.userId);
  if (!writeJson(key, snapshot.data)) persistErrorListeners.forEach((l) => l(key));
}

/** Delete the current user's stored data and start fresh (test controls). */
export function resetUserData(): void {
  if (snapshot.status !== "ready") return;
  const { user } = snapshot.data;
  removeKey(storageKeys.user(user.id));
  snapshot = {
    status: "ready",
    userId: user.id,
    data: createUserData({ id: user.id, email: user.email, walletAddress: user.walletAddress }, now()),
  };
  schedulePersist();
  emit();
}

if (typeof window !== "undefined") {
  try {
    window.addEventListener("beforeunload", flushPersist);
  } catch {
    // Non-standard environment: persistence still runs on its timer.
  }
}
