import { describe, expect, it } from "vitest";

import { explorerAddressUrl, explorerTxUrl, getPublishedAddresses, parseTreasuryAddresses } from "./transparency-config";

const A = "0x1111111111111111111111111111111111111111";
const B = "0x2222222222222222222222222222222222222222";

describe("transparency addresses", () => {
  it("returns every row with null addresses when nothing is configured", () => {
    const rows = getPublishedAddresses({});
    expect(rows.map((row) => [row.id, row.chainName, row.address, row.explorerUrl])).toEqual([
      ["payout-arbitrum", "Arbitrum", null, null],
      ["treasury-arbitrum", "Arbitrum", null, null],
      ["treasury-ethereum", "Ethereum", null, null],
      ["treasury-base", "Base", null, null],
      ["treasury-bnb", "BNB Chain", null, null],
    ]);
  });

  it("uses configured addresses and the right explorer per chain", () => {
    const rows = getPublishedAddresses({
      payoutWalletArbitrum: A,
      treasuryAddresses: JSON.stringify({ arbitrum: B, Ethereum: A, base: B, bsc: A }),
    });
    expect(rows.map((row) => row.explorerUrl)).toEqual([
      `https://arbiscan.io/address/${A}`,
      `https://arbiscan.io/address/${B}`,
      `https://etherscan.io/address/${A}`,
      `https://basescan.org/address/${B}`,
      `https://bscscan.com/address/${A}`,
    ]);
  });

  it("never invents an address from malformed input", () => {
    expect(getPublishedAddresses({ payoutWalletArbitrum: "0x123" })[0].address).toBeNull();
    expect(parseTreasuryAddresses("not json")).toEqual({});
    expect(parseTreasuryAddresses("[]")).toEqual({});
    expect(parseTreasuryAddresses(JSON.stringify({ solana: A, base: "nope" }))).toEqual({});
  });

  it("builds explorer links only for well-formed values", () => {
    expect(explorerAddressUrl("bnb", A)).toBe(`https://bscscan.com/address/${A}`);
    expect(explorerTxUrl("arbitrum", `0x${"a".repeat(64)}`)).toBe(`https://arbiscan.io/tx/0x${"a".repeat(64)}`);
    expect(explorerTxUrl("arbitrum", "0xabc")).toBeNull();
  });
});
