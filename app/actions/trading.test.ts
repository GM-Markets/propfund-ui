import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import * as hsc from "@/lib/hsc/client";

import { closePositionAction, deskPollAction, listMarketsAction, submitOrderAction } from "./trading";

const FILL = { coin: "BTC", balance: { cash: 9000 } };

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("submitOrderAction", () => {
  it("forwards the body + prop account and returns data on success", async () => {
    const spy = vi.spyOn(hsc.trading, "submit").mockResolvedValue(FILL);
    const body = { trade_pair: "BTC", market_type: "perp" as const, side: "buy" as const, quantity: 0.1, leverage: 10 };
    const r = await submitOrderAction(body, "prop-1");
    expect(r).toEqual({ ok: true, data: FILL });
    expect(spy).toHaveBeenCalledWith(body, "prop-1");
  });

  it("maps an API error to the standard failure envelope", async () => {
    vi.spyOn(hsc.trading, "submit").mockRejectedValue(
      new hsc.HscApiError(400, "V2_BAD_ORDER", "bad request"),
    );
    const r = await submitOrderAction({ trade_pair: "BTC", market_type: "perp", side: "buy" });
    expect(r).toMatchObject({ ok: false, code: "V2_BAD_ORDER", message: "bad request" });
  });
});

describe("other trading actions forward their args", () => {
  it("listMarketsAction returns the perp and spot books", async () => {
    const spy = vi.spyOn(hsc.trading, "markets").mockResolvedValue({
      markets: [{ coin: "BTC", mid: 100000, max_leverage: 40 }],
      spots: [{ coin: "PURR", mid: 0.2, max_leverage: 1 }],
    });
    const r = await listMarketsAction();
    expect(r).toEqual({
      ok: true,
      data: {
        markets: [{ coin: "BTC", mid: 100000, max_leverage: 40 }],
        spots: [{ coin: "PURR", mid: 0.2, max_leverage: 1 }],
      },
    });
    expect(spy).toHaveBeenCalledOnce();
  });

  it("deskPollAction passes the prop account id", async () => {
    const spy = vi.spyOn(hsc.trading, "deskPoll").mockResolvedValue({
      positions: [],
      orders: [],
      history: [],
      balance: { account_size: 0, status: "evaluation" },
    });
    await deskPollAction("prop-9");
    expect(spy).toHaveBeenCalledWith("prop-9");
  });

  it("closePositionAction forwards the close body", async () => {
    const spy = vi.spyOn(hsc.trading, "close").mockResolvedValue(FILL);
    await closePositionAction({ trade_pair: "ETH", market_type: "perp" }, "prop-2");
    expect(spy).toHaveBeenCalledWith({ trade_pair: "ETH", market_type: "perp" }, "prop-2");
  });

  it("maps a non-API error to UNKNOWN", async () => {
    vi.spyOn(hsc.trading, "close").mockRejectedValue(new Error("network"));
    const r = await closePositionAction({ trade_pair: "BTC" });
    expect(r).toMatchObject({ ok: false, code: "UNKNOWN", message: "network" });
  });
});
