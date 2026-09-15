import { describe, expect, it } from "vitest";

import { mergeTapePerps, midFromTape, overlayMarketMids, parseHypMids } from "./mids";

const MIDS = { BTC: "78469.5", "@107": "1.23" };

describe("parseHypMids", () => {
  it("accepts a flat map, numeric values, and the HL envelope", () => {
    expect(parseHypMids(MIDS)).toEqual(MIDS);
    expect(parseHypMids({ BTC: 78469.5 })).toEqual({ BTC: "78469.5" });
    expect(parseHypMids({ channel: "allMids", data: { mids: MIDS } })).toEqual(MIDS);
    expect(parseHypMids(JSON.stringify(MIDS))).toEqual(MIDS);
  });

  it("rejects empty or invalid payloads", () => {
    expect(parseHypMids("{oops")).toBeNull();
    expect(parseHypMids({})).toBeNull();
    expect(parseHypMids([1, 2])).toBeNull();
  });
});

describe("overlayMarketMids", () => {
  it("maps spots by wire and leaves unknown coins on the catalog mid", () => {
    const book = [
      { coin: "BTC", wire: "BTC", mid: 1, max_leverage: 40 },
      { coin: "PURR", wire: "@107", mid: 0.2, max_leverage: 1 },
      { coin: "NOPE", wire: "NOPE", mid: 3, max_leverage: 1 },
    ];
    expect(overlayMarketMids(book, MIDS)).toEqual([
      { coin: "BTC", wire: "BTC", mid: 78469.5, max_leverage: 40 },
      { coin: "PURR", wire: "@107", mid: 1.23, max_leverage: 1 },
      { coin: "NOPE", wire: "NOPE", mid: 3, max_leverage: 1 },
    ]);
    expect(midFromTape(undefined, book[0])).toBe(1);
  });
});

describe("mergeTapePerps", () => {
  it("expands the 4-coin fallback with every perp on the tape", () => {
    const catalog = [
      { coin: "BTC", wire: "BTC", mid: 1, max_leverage: 40 },
      { coin: "ETH", wire: "ETH", mid: 2, max_leverage: 25 },
    ];
    const next = mergeTapePerps(catalog, { BTC: "76939.5", DOGE: "0.14", "@107": "0.2" });
    expect(next.map((row) => row.coin)).toEqual(["BTC", "DOGE", "ETH"]);
    expect(next.find((row) => row.coin === "BTC")?.mid).toBe(76939.5);
    expect(next.find((row) => row.coin === "DOGE")).toMatchObject({ mid: 0.14, max_leverage: 50 });
  });
});
