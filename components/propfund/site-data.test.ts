import { describe, expect, it } from "vitest";

import {
  challengeFee,
  challengeHref,
  challengePackages,
  depositChains,
  featuredPackageId,
  featuredPackageLabel,
  marketContent,
  paymentSummary,
  rebuyFee,
  rulesSummary,
} from "./site-data";

describe("challenge packages (PRD §2)", () => {
  it("matches the approved package table", () => {
    expect(
      challengePackages.map(({ name, label, accountSize, fee, rebuyFee: rebuy, dailyLoss, maxLoss, target }) => [
        name,
        label,
        accountSize,
        fee,
        rebuy,
        dailyLoss,
        maxLoss,
        target,
      ]),
    ).toEqual([
      ["Starter", "$5K", 5_000, 49, 39, 150, 250, 500],
      ["Core", "$10K", 10_000, 99, 79, 300, 500, 1_000],
      ["Plus", "$25K", 25_000, 249, 199, 750, 1_250, 2_500],
      ["Pro", "$50K", 50_000, 499, 399, 1_500, 2_500, 5_000],
      ["Elite", "$100K", 100_000, 999, 799, 3_000, 5_000, 10_000],
    ]);
  });

  it("applies the fee and rebuy formulas", () => {
    for (const size of [5_000, 10_000, 25_000, 50_000, 100_000]) {
      expect(challengeFee(size)).toBe(Math.round(0.01 * size) - 1);
      expect(rebuyFee(size)).toBe(Math.round(0.008 * size) - 1);
    }
  });

  it("uses one 10% target and the 3% / 5% limits", () => {
    expect(rulesSummary).toMatchObject({ target: "10%", dailyLoss: "3%", maxLoss: "5%", traderSplit: "80%", propfundSplit: "20%", minPayout: "$50" });
  });

  it("keeps market copy free of retired terms", () => {
    const copy = JSON.stringify(marketContent).toLowerCase();
    for (const term of ["reward", "8%", "2.5m", "automation", "your way", "evaluation", "weekly", "on base"]) {
      expect(copy).not.toContain(term);
    }
  });

  it("gives every package a stable id and a challenges link", () => {
    expect(challengePackages.map((plan) => plan.id)).toEqual(["starter", "core", "plus", "pro", "elite"]);
    expect(challengePackages.find((plan) => plan.id === featuredPackageId)?.label).toBe(featuredPackageLabel);
    expect(challengeHref()).toBe("/dashboard/challenges");
    expect(challengeHref("elite")).toBe("/dashboard/challenges?package=elite");
  });
});

describe("payments and payouts (PRD §4, §8)", () => {
  it("pays out in USDC on Arbitrum", () => {
    expect(rulesSummary.payout).toBe("USDC on Arbitrum");
    expect(paymentSummary.payout).toBe("USDC on Arbitrum");
  });

  it("accepts USDC and USDT on the four deposit chains with the PRD confirmations", () => {
    expect(depositChains.map(({ name, confirmations, tokens }) => [name, confirmations, tokens.join("/")])).toEqual([
      ["Arbitrum", 1, "USDC/USDT"],
      ["Ethereum", 12, "USDC/USDT"],
      ["Base", 1, "USDC/USDT"],
      ["BNB Chain", 15, "USDC/USDT"],
    ]);
    expect(paymentSummary.stablecoins).toBe("USDC or USDT on Arbitrum, Ethereum, Base or BNB Chain");
    expect(paymentSummary.depositWarning).toBe(
      "Send only USDC or USDT on Arbitrum, Ethereum, Base or BNB Chain. Other tokens or chains can be lost.",
    );
  });
});
