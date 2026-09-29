import { describe, expect, it } from "vitest";

import { isPerpTapeCoin, mergeTapePerps, midFromTape, overlayMarketMids, parseHypMids } from "./mids";

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

describe("isPerpTapeCoin", () => {
  it("keeps live tickers and HIP-3, drops spots and prediction ids", () => {
    expect(isPerpTapeCoin("BTC")).toBe(true);
    expect(isPerpTapeCoin("xyz:AAPL")).toBe(true);
    expect(isPerpTapeCoin("xyz:GOLD")).toBe(true);
    expect(isPerpTapeCoin("@107")).toBe(false);
    expect(isPerpTapeCoin("#25551")).toBe(false);
    expect(isPerpTapeCoin("12090")).toBe(false);
  });
});

describe("mergeTapePerps", () => {
  it("overlays tape mids, keeps HIP-3 catalog marks, and ignores prediction ids", () => {
    const catalog = [
      { coin: "BTC", wire: "BTC", mid: 1, max_leverage: 40 },
      { coin: "ETH", wire: "ETH", mid: 2, max_leverage: 25 },
      { coin: "xyz:AAPL", wire: "xyz:AAPL", mid: 337.31, max_leverage: 20 },
      { coin: "#25551", wire: "#25551", mid: 0.5, max_leverage: 50 },
    ];
    const next = mergeTapePerps(catalog, {
      BTC: "76939.5",
      DOGE: "0.14",
      AAPL: "0.057843",
      "@107": "0.2",
      "#25551": "0.5",
    });
    expect(next.map((row) => row.coin)).toEqual(["BTC", "ETH", "xyz:AAPL"]);
    expect(next.find((row) => row.coin === "BTC")).toMatchObject({ mid: 76939.5, max_leverage: 40 });
    expect(next.find((row) => row.coin === "ETH")?.max_leverage).toBe(25);
    expect(next.find((row) => row.coin === "xyz:AAPL")?.mid).toBe(337.31);
  });
});

describe("midFromTape", () => {
  it("does not bind HIP-3 Apple to the junk spot AAPL mid", () => {
    expect(
      midFromTape(
        { AAPL: "0.057843", "xyz:AAPL": "337.31" },
        { coin: "xyz:AAPL", wire: "xyz:AAPL", mid: 1 },
      ),
    ).toBe(337.31);
    expect(midFromTape({ AAPL: "0.057843" }, { coin: "xyz:AAPL", wire: "xyz:AAPL", mid: 337.31 })).toBe(
      337.31,
    );
  });

  it("prices a Unit spot from its wire coin, not a colliding bare ticker", () => {
    expect(
      midFromTape(
        { UBTC: "0.000873", "@151": "102450" },
        { coin: "UBTC", wire: "@151", mid: 1 },
      ),
    ).toBe(102450);
  });
});
