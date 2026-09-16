import "@testing-library/jest-dom/vitest";

// ── Test environment variables ───────────────────────────────────────────────
// Local test sign-in mode (no sign-in app ID, test controls on).
process.env.NEXT_PUBLIC_TEST_CONTROLS ??= "true";

// ── DOM stubs ────────────────────────────────────────────────────────────────
// Radix primitives (Select, Tooltip, etc.) observe element size; happy-dom has
// no ResizeObserver. Provide a no-op so component tests don't crash on mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as never);

// Node 22+ defines a global `localStorage` getter that returns undefined unless
// `--localstorage-file` is passed, which shadows happy-dom's implementation.
// Install a small in-memory Storage so the mock service can persist in tests.
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  let works = false;
  try {
    works = typeof window !== "undefined" && !!window[name];
  } catch {
    works = false;
  }
  if (!works) {
    const storage = new MemoryStorage();
    Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true });
    if (typeof window !== "undefined" && window !== (globalThis as unknown)) {
      Object.defineProperty(window, name, { value: storage, configurable: true, writable: true });
    }
  }
}
