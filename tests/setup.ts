import "@testing-library/jest-dom/vitest";

// ── Test environment variables ───────────────────────────────────────────────
// Set BEFORE any module under test reads `lib/hsc/config.ts` (evaluated at
// import time). Use ??= so a real shell env can still override.
process.env.NEXT_PUBLIC_GATEWAY_URL ??= "http://localhost:5400";
process.env.VANTA_API_BASE_URL ??= "http://test-api";
process.env.SESSION_COOKIE_NAME ??= "vanta_privy_session";
process.env.VANTA_WEBHOOK_SECRET ??= "wh_test_secret";

// ── DOM stubs ────────────────────────────────────────────────────────────────
// Radix primitives (Select, Tooltip, etc.) observe element size; happy-dom has
// no ResizeObserver. Provide a no-op so component tests don't crash on mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as never);
