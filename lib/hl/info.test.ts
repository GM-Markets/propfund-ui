import { describe, expect, it } from "vitest";

import { isTradFiSpotBase, parseHlCandles, parsePerpCatalog, parsePerpDexNames, parseSpotCatalog } from "./info";

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
      { coin: "BTC", wire: "BTC", mid: 76956.5, max_leverage: 40, label: "BTC", kind: "perp" },
      { coin: "ATOM", wire: "ATOM", mid: 4.2, max_leverage: 5, label: "ATOM", kind: "perp" },
    ]);
  });

  it("qualifies HIP-3 coins with the dex prefix and a clean UI label", () => {
    const rows = parsePerpCatalog(
      [{ universe: [{ name: "GOLD", maxLeverage: 20 }] }, [{ midPx: "2500" }]],
      "xyz",
    );
    expect(rows).toEqual([
      {
        coin: "xyz:GOLD",
        wire: "xyz:GOLD",
        mid: 2500,
        max_leverage: 20,
        label: "GOLD",
        dex: "xyz",
        kind: "hip3",
      },
    ]);
  });
});

describe("parseSpotCatalog", () => {
  it("joins contexts on the wire coin, not array position, and hides unquoted / TradFi rows", () => {
    const rows = parseSpotCatalog([
      {
        tokens: [
          { name: "USDC", index: 0 },
          { name: "PURR", index: 1 },
          { name: "HFUN", index: 2 },
          { name: "AAPL", index: 3 },
          { name: "UBTC", index: 4, fullName: "Unit Bitcoin" },
        ],
        universe: [
          { name: "PURR/USDC", index: 0, tokens: [1, 0] },
          { name: "@1", index: 1, tokens: [2, 0] },
          { name: "@268", index: 268, tokens: [3, 0] },
          { name: "@151", index: 151, tokens: [4, 0] },
        ],
      },
      [
        { coin: "@999", midPx: "0.000873" },
        { coin: "@1", midPx: "13.2" },
        { coin: "PURR/USDC", midPx: "0.11" },
        { coin: "@151", midPx: "102450" },
      ],
    ]);
    expect(rows).toEqual([
      {
        coin: "UBTC",
        wire: "@151",
        mid: 102450,
        max_leverage: 1,
        label: "BTC",
        name: "Bitcoin",
        pair: "UBTC/USDC",
        kind: "spot",
      },
      {
        coin: "HFUN",
        wire: "@1",
        mid: 13.2,
        max_leverage: 1,
        label: "HFUN",
        name: "HFUN spot",
        pair: "HFUN/USDC",
        kind: "spot",
      },
      {
        coin: "PURR",
        wire: "PURR/USDC",
        mid: 0.11,
        max_leverage: 1,
        label: "PURR",
        name: "PURR spot",
        pair: "PURR/USDC",
        kind: "spot",
      },
    ]);
  });
});

describe("isTradFiSpotBase", () => {
  it("treats AAPL as an equity ticker, not a spot token", () => {
    expect(isTradFiSpotBase("AAPL")).toBe(true);
    expect(isTradFiSpotBase("xyz:AAPL")).toBe(true);
    expect(isTradFiSpotBase("PURR")).toBe(false);
  });
});

describe("parsePerpDexNames", () => {
  it("skips the null canonical slot", () => {
    expect(parsePerpDexNames([null, { name: "xyz" }, { name: "flx" }])).toEqual(["xyz", "flx"]);
  });
});

describe("parseHlCandles", () => {
  it("keeps finite OHLC rows in time order", () => {
    expect(
      parseHlCandles([
        { t: 2, o: "2", h: "3", l: "1", c: "2.5", v: "10" },
        { t: 1, o: "1", h: "1.5", l: "0.5", c: "1.2", v: "4" },
        { t: "x", o: 1, h: 1, l: 1, c: 1 },
      ]),
    ).toEqual([
      { t: 1, o: 1, h: 1.5, l: 0.5, c: 1.2, v: 4 },
      { t: 2, o: 2, h: 3, l: 1, c: 2.5, v: 10 },
    ]);
  });
});
