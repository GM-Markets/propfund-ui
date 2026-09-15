import { describe, expect, it } from "vitest";

import { DESK_API_KEY_ROUTES, PUBLIC_GATEWAY_ORIGIN, PUBLIC_VAN_BASE, docsVanUrl } from "./public-api";

describe("public API host", () => {
  it("points bots at gate.propfund.io /van", () => {
    expect(PUBLIC_GATEWAY_ORIGIN).toBe("https://gate.propfund.io");
    expect(PUBLIC_VAN_BASE).toBe("https://gate.propfund.io/van");
    expect(docsVanUrl("/v2/trading/orders")).toBe("https://gate.propfund.io/van/v2/trading/orders");
  });

  it("lists every desk route a minted API key can call", () => {
    const paths = DESK_API_KEY_ROUTES.map((row) => `${row.method} ${row.path}`);
    expect(paths).toEqual([
      "POST /v2/trading/orders",
      "POST /v2/trading/close",
      "GET /v2/trading/positions",
      "GET /v2/trading/balance",
      "GET /v2/trading/history",
      "GET /v2/trading/desk-poll",
      "POST /v2/copy-trade/subscriptions",
      "GET /v2/copy-trade/subscriptions",
      "POST /v2/copy-trade/subscriptions/{id}",
      "GET /v2/copy-trade/subscriptions/{id}/fills",
    ]);
  });
});
