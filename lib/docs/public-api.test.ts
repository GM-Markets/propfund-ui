import { describe, expect, it } from "vitest";

import { PUBLIC_GATEWAY_ORIGIN, PUBLIC_VAN_BASE, docsVanUrl } from "./public-api";

describe("public API host", () => {
  it("points bots at gate.propfund.io /van", () => {
    expect(PUBLIC_GATEWAY_ORIGIN).toBe("https://gate.propfund.io");
    expect(PUBLIC_VAN_BASE).toBe("https://gate.propfund.io/van");
    expect(docsVanUrl("/v2/trading/orders")).toBe("https://gate.propfund.io/van/v2/trading/orders");
  });
});
