import { describe, expect, it } from "vitest";

import { readBrowserApiError, vantaBrowserBase } from "./http";

describe("vanta browser client", () => {
  it("points at the gateway /van prefix", () => {
    expect(vantaBrowserBase()).toMatch(/\/van$/);
  });

  it("reads Vanta and gateway error envelopes", () => {
    expect(readBrowserApiError({ error: { code: "V2_VALIDATION", message: "nope" } })).toEqual({
      code: "V2_VALIDATION",
      message: "nope",
    });
    expect(readBrowserApiError({ type: "BUSINESS_ERROR", message: "denied", statusCode: 422 })).toEqual({
      code: "BUSINESS_ERROR",
      message: "denied",
    });
  });
});
