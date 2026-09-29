import { describe, expect, it } from "vitest";

import { isQuotedSpotMid, spotDisplayName, spotDisplayTicker, spotUnderlyingBase } from "./spot";

describe("spotUnderlyingBase", () => {
  it("renders Unit Bitcoin as BTC and leaves USDE / UNI alone", () => {
    expect(spotUnderlyingBase("UBTC", "Unit Bitcoin")).toBe("BTC");
    expect(spotDisplayTicker("UBTC", "Unit Bitcoin")).toBe("BTC");
    expect(spotDisplayName("UBTC", "Unit Bitcoin")).toBe("Bitcoin");
    expect(spotUnderlyingBase("USDE", "Ethena USDe")).toBe("USDE");
    expect(spotUnderlyingBase("UNI", "Uniswap")).toBe("UNI");
    expect(spotUnderlyingBase("USDUC", "Unstable Coin")).toBe("USDUC");
  });
});

describe("isQuotedSpotMid", () => {
  it("drops pairs that have never printed a mid", () => {
    expect(isQuotedSpotMid(0)).toBe(false);
    expect(isQuotedSpotMid(Number.NaN)).toBe(false);
    expect(isQuotedSpotMid(40.5)).toBe(true);
  });
});
