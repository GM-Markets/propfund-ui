import { describe, expect, it } from "vitest";

import { parsePerpCatalog, parsePerpDexNames, parseSpotCatalog } from "./info";

describe("parsePerpCatalog", () => {
  it("uses Hyperliquid universe names and maxLeverage", () => {
    const rows = parsePerpCatalog([
      {
        universe: [
          { name: "BTC", maxLeverage: 40 },
          { name: "ATOM", maxLeverage: 5 },
          { name: "#25551", maxLeverage: 50 },
        ],
      },
      [{ midPx: "76956.5" }, { midPx: "4.2" }, { midPx: "0.5" }],
    ]);
    expect(rows).toEqual([
      { coin: "BTC", wire: "BTC", mid: 76956.5, max_leverage: 40 },
      { coin: "ATOM", wire: "ATOM", mid: 4.2, max_leverage: 5 },
    ]);
  });

  it("qualifies HIP-3 coins with the dex prefix", () => {
    const rows = parsePerpCatalog(
      [{ universe: [{ name: "GOLD", maxLeverage: 20 }] }, [{ midPx: "2500" }]],
      "xyz",
    );
    expect(rows).toEqual([{ coin: "xyz:GOLD", wire: "xyz:GOLD", mid: 2500, max_leverage: 20 }]);
  });
});

describe("parseSpotCatalog", () => {
  it("lists USDC spots by token name and ctx wire", () => {
    const rows = parseSpotCatalog([
      {
        tokens: [
          { name: "USDC", index: 0 },
          { name: "PURR", index: 1 },
          { name: "HFUN", index: 2 },
        ],
        universe: [
          { name: "PURR/USDC", index: 0, tokens: [1, 0] },
          { name: "@1", index: 1, tokens: [2, 0] },
        ],
      },
      [
        { coin: "PURR/USDC", midPx: "0.11" },
        { coin: "@1", midPx: "13.2" },
      ],
    ]);
    expect(rows).toEqual([
      { coin: "HFUN", wire: "@1", mid: 13.2, max_leverage: 1 },
      { coin: "PURR", wire: "PURR/USDC", mid: 0.11, max_leverage: 1 },
    ]);
  });
});

describe("parsePerpDexNames", () => {
  it("skips the null canonical slot", () => {
    expect(parsePerpDexNames([null, { name: "xyz" }, { name: "flx" }])).toEqual(["xyz", "flx"]);
  });
});
