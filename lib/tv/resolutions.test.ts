import { describe, expect, it } from "vitest";

import { hlIntervalMs, tvResolutionToHl, unixMs } from "./resolutions";

describe("tvResolutionToHl", () => {
  it("maps TradingView resolutions to Hyperliquid intervals", () => {
    expect(tvResolutionToHl("15")).toBe("15m");
    expect(tvResolutionToHl("60")).toBe("1h");
    expect(tvResolutionToHl("1D")).toBe("1d");
    expect(tvResolutionToHl("3")).toBeNull();
  });
});

describe("unixMs", () => {
  it("promotes second timestamps", () => {
    expect(unixMs(1_700_000_000)).toBe(1_700_000_000_000);
    expect(unixMs(1_700_000_000_000)).toBe(1_700_000_000_000);
  });
});

describe("hlIntervalMs", () => {
  it("returns the bucket width", () => {
    expect(hlIntervalMs("15m")).toBe(900_000);
  });
});
