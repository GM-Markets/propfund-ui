/**
 * Tests for the docs "Run it now" action. It runs read-only client calls and,
 * crucially, turns an upstream HscApiError into a *successful* action result that
 * exposes the real status + error body (so the docs panel can teach the error
 * shape, e.g. a 401 when the developer isn't signed in).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import * as hsc from "@/lib/hsc/client";

import { runDocsRequestAction } from "./docs";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("runDocsRequestAction", () => {
  it("returns status 200 + body for a successful read", async () => {
    vi.spyOn(hsc.apps, "me").mockResolvedValue({
      app_id: "a1",
      slug: "acme",
      name: "Acme",
      entity_hotkey: "5F",
      allowed_scopes: ["api"],
      active: true,
    });
    const r = await runDocsRequestAction("apps.me");
    expect(r).toMatchObject({ ok: true, data: { status: 200 } });
  });

  it("resolves the first prop account before a trading read", async () => {
    const list = vi
      .spyOn(hsc.payments, "listPropAccounts")
      .mockResolvedValue([
        {
          id: "prop-1",
          tier_id: "t",
          asset_class: "crypto",
          account_size: 1,
          status: "active",
          subaccount_id: null,
          subaccount_uuid: null,
          synthetic_hotkey: null,
        },
      ]);
    const positions = vi.spyOn(hsc.trading, "positions").mockResolvedValue([]);
    await runDocsRequestAction("trading.positions");
    expect(list).toHaveBeenCalled();
    expect(positions).toHaveBeenCalledWith("prop-1");
  });

  it("surfaces an upstream HscApiError as ok:true with the real status/body", async () => {
    vi.spyOn(hsc.kyc, "status").mockRejectedValue(
      new hsc.HscApiError(401, "V2_UNAUTHORIZED", "sign in first", false),
    );
    const r = await runDocsRequestAction("kyc.status");
    expect(r).toEqual({
      ok: true,
      data: {
        status: 401,
        body: { error: { code: "V2_UNAUTHORIZED", message: "sign in first", retryable: false } },
      },
    });
  });

  it("returns a failure envelope for a non-API error", async () => {
    vi.spyOn(hsc.apps, "me").mockRejectedValue(new Error("boom"));
    const r = await runDocsRequestAction("apps.me");
    expect(r).toMatchObject({ ok: false, code: "UNKNOWN", message: "boom" });
  });
});
