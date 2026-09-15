import { describe, expect, it } from "vitest";

import { API_CATALOG, AUTH_LABEL, type Endpoint } from "./api-catalog";

const VALID_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

// Mirrors the DocsOperation union in app/actions/docs.ts. Kept here as runtime
// data so the catalog's `runOp` references can be validated against it.
const VALID_RUN_OPS = new Set([
  "apps.me",
  "auth.me",
  "kyc.status",
  "payments.listPropAccounts",
  "connect.list",
  "payouts.list",
  "payouts.estimate",
  "apiKeys.list",
  "webhooks.list",
  "agreements.status",
  "agreements.audits",
  "trading.positions",
  "trading.orders",
  "trading.history",
  "trading.balance",
  "trading.deskPoll",
]);

const allEndpoints: Endpoint[] = API_CATALOG.flatMap((area) => area.endpoints);

describe("API_CATALOG", () => {
  it("has at least one area, each with endpoints", () => {
    expect(API_CATALOG.length).toBeGreaterThan(0);
    for (const area of API_CATALOG) {
      expect(area.endpoints.length).toBeGreaterThan(0);
    }
  });

  it("uses unique area ids", () => {
    const ids = API_CATALOG.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every endpoint has a valid method and an absolute path", () => {
    for (const ep of allEndpoints) {
      expect(VALID_METHODS.has(ep.method)).toBe(true);
      expect(ep.path.startsWith("/")).toBe(true);
      expect(ep.summary.trim().length).toBeGreaterThan(0);
    }
  });

  it("every endpoint auth kind is labeled", () => {
    for (const ep of allEndpoints) {
      expect(AUTH_LABEL[ep.auth]).toBeTruthy();
    }
  });

  it("every runOp references a real DocsOperation", () => {
    const withRunOp = allEndpoints.filter((e) => e.runOp);
    expect(withRunOp.length).toBeGreaterThan(0);
    for (const ep of withRunOp) {
      expect(VALID_RUN_OPS.has(ep.runOp as string)).toBe(true);
    }
  });

  it("areas that link docs point at a /docs page", () => {
    for (const area of API_CATALOG) {
      if (area.docHref) expect(area.docHref.startsWith("/docs")).toBe(true);
    }
  });
});
