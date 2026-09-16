import { describe, expect, it } from "vitest";

import { PACKAGES, applyCredit, challengeFee, checkoutPrice, getPackage, rebuyFee } from "./packages";

describe("PRD §3 packages and fees", () => {
  it.each([
    ["starter", "Starter", 5_000, 49, 39, 150, 250, 500],
    ["core", "Core", 10_000, 99, 79, 300, 500, 1_000],
    ["plus", "Plus", 25_000, 249, 199, 750, 1_250, 2_500],
    ["pro", "Pro", 50_000, 499, 399, 1_500, 2_500, 5_000],
    ["elite", "Elite", 100_000, 999, 799, 3_000, 5_000, 10_000],
  ])(
    "%s: %s $%i → fee $%i, rebuy $%i, daily $%i, max $%i, target $%i",
    (id, name, size, fee, rebuy, daily, max, target) => {
      const p = getPackage(id)!;
      expect(p).toEqual({
        id,
        name,
        accountSize: size,
        fee,
        rebuyFee: rebuy,
        dailyLossLimit: daily,
        maxLossLimit: max,
        target,
      });
      expect(challengeFee(size)).toBe(fee);
      expect(rebuyFee(size)).toBe(rebuy);
    },
  );

  it("has exactly five packages in size order", () => {
    expect(PACKAGES.map((p) => p.accountSize)).toEqual([5_000, 10_000, 25_000, 50_000, 100_000]);
  });

  it("checkout shows the struck fee, rebuy fee and discount label when a rebuy is open", () => {
    const elite = getPackage("elite")!;
    expect(checkoutPrice(elite, false)).toEqual({
      pricing: "full",
      fullFee: 999,
      rebuyFee: 799,
      price: 999,
      discountLabel: null,
    });
    expect(checkoutPrice(elite, true)).toEqual({
      pricing: "rebuy",
      fullFee: 999,
      rebuyFee: 799,
      price: 799,
      discountLabel: "Rebuy discount: 20% off",
    });
  });

  it("applies deposit credit up to the price", () => {
    expect(applyCredit(99, 0)).toEqual({ creditAppliedUsd: 0, amountDueUsd: 99 });
    expect(applyCredit(99, 20.5)).toEqual({ creditAppliedUsd: 20.5, amountDueUsd: 78.5 });
    expect(applyCredit(99, 150)).toEqual({ creditAppliedUsd: 99, amountDueUsd: 0 });
  });
});
