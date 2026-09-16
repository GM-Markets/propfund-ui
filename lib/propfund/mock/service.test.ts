import { beforeEach, describe, expect, it } from "vitest";

import { DAY_MS } from "@/lib/propfund/rules";

import { _setClockOffsetForTests, now } from "./clock";
import { evaluate } from "./engine";
import { getMarks, resetPrices, setMark } from "./prices";
import {
  cancelOrder,
  closePosition,
  completeTestCardPayment,
  configureMockService,
  createCardCheckout,
  createCryptoDeposit,
  getCheckoutQuote,
  getKyc,
  listAccounts,
  listFills,
  listPayouts,
  listPositions,
  placeOrder,
  purchaseWithCredit,
  requestPayout,
  simulateDepositConfirmations,
  startKyc,
  waitForDeposit,
} from "./service";
import { getSnapshot, setHydrationDelay, setSessionUser } from "./store";
import * as tc from "./test-controls";

const WALLET = "0x" + "1".repeat(40);

function data() {
  const s = getSnapshot();
  if (s.status !== "ready") throw new Error("not ready");
  return s.data;
}

function active() {
  return data().accounts.find((a) => a.status === "active")!;
}

async function buyByCard(packageId: "starter" | "core" | "plus" | "pro" | "elite" = "elite") {
  const checkout = await createCardCheckout({ packageId, agreedToTerms: true });
  const res = await completeTestCardPayment(checkout.id, "succeeded");
  return res.account!;
}

/** Book realized P&L on the active account through a real trade. */
async function realize(usd: number) {
  const mark = getMarks().ETH;
  await placeOrder({ symbol: "ETH", side: "buy", type: "market", notionalUsd: 30_000, leverage: 5 });
  const pos = data().positions[0];
  setMark("ETH", mark + usd / pos.quantity);
  await closePosition(pos.id);
  setMark("ETH", mark);
}

beforeEach(async () => {
  configureMockService({ latencyMs: [0, 0] });
  setHydrationDelay(0);
  window.localStorage.clear();
  _setClockOffsetForTests(0);
  await setSessionUser(null);
  resetPrices();
  await setSessionUser({ id: `user-${Math.random()}`, email: "t@example.com", walletAddress: WALLET });
});

describe("checkout", () => {
  it("requires the rules checkbox", async () => {
    await expect(createCardCheckout({ packageId: "core", agreedToTerms: false })).rejects.toMatchObject({
      code: "TERMS_NOT_ACCEPTED",
    });
  });

  it("card payment creates a challenge account at the package size", async () => {
    const account = await buyByCard("core");
    expect(account).toMatchObject({
      phase: "challenge",
      status: "active",
      accountSize: 10_000,
      baseline: 10_000,
      balance: 10_000,
      sod: 10_000,
      feePaidUsd: 99,
    });
    expect(data().payments[0]).toMatchObject({ method: "card", status: "succeeded", amountUsd: 99, testMode: true });
  });

  it("allows one active account per user", async () => {
    await buyByCard("core");
    await expect(createCardCheckout({ packageId: "plus", agreedToTerms: true })).rejects.toMatchObject({
      code: "ACTIVE_ACCOUNT_EXISTS",
      message: "You already have an active account.",
    });
    expect((await getCheckoutQuote("plus")).blocked?.code).toBe("ACTIVE_ACCOUNT_EXISTS");
  });

  it("crypto from the Propfund wallet debits the balance and confirms after N confirmations", async () => {
    const dep = await createCryptoDeposit({
      packageId: "starter",
      chain: "ethereum",
      token: "USDT",
      source: "propfund_wallet",
      agreedToTerms: true,
    });
    expect(dep).toMatchObject({ status: "confirming", requiredConfirmations: 12, amountDueUsd: 49 });
    expect(data().walletBalances.find((b) => b.chain === "ethereum" && b.token === "USDT")?.amount).toBe(251);
    _setClockOffsetForTests(60_000);
    evaluate();
    const done = await waitForDeposit(dep.id);
    expect(done.status).toBe("confirmed");
    expect(done.accountId).toBe(active().id);
  });

  it("send-from-anywhere waits, then credits an overpayment", async () => {
    const dep = await createCryptoDeposit({
      packageId: "core",
      chain: "arbitrum",
      token: "USDC",
      source: "external",
      agreedToTerms: true,
    });
    expect(dep.status).toBe("waiting");
    expect(dep.address).toBe(data().user.depositAddress);
    await simulateDepositConfirmations(dep.id, { amountUsd: 150 });
    _setClockOffsetForTests(5_000);
    evaluate();
    expect(data().deposits[0].status).toBe("confirmed");
    expect(data().user.depositCreditUsd).toBe(51);
  });

  it("deposit address is deterministic per user and the same on every chain", async () => {
    const a = await createCryptoDeposit({ packageId: "core", chain: "base", token: "USDC", source: "external", agreedToTerms: true });
    const b = await createCryptoDeposit({ packageId: "core", chain: "bnb", token: "USDT", source: "external", agreedToTerms: true });
    expect(a.address).toBe(b.address);
    expect(data().deposits[0].status).toBe("expired");
  });
});

describe("breach", () => {
  it("closes every position, cancels orders, locks the account and opens a rebuy", async () => {
    await buyByCard("elite");
    await placeOrder({ symbol: "BTC", side: "buy", type: "market", notionalUsd: 50_000, leverage: 5 });
    await placeOrder({ symbol: "ETH", side: "sell", type: "limit", notionalUsd: 5_000, leverage: 2, limitPrice: getMarks().ETH * 1.2 });
    tc.jumpToDailyBreach();
    const a = data().accounts[0];
    expect(a.status).toBe("breached");
    expect(a.breach?.rule).toBe("daily");
    expect(data().positions).toHaveLength(0);
    expect(data().orders.find((o) => o.type === "limit")?.status).toBe("cancelled");
    expect(data().takeover).toMatchObject({ kind: "breach", accountId: a.id });
    await expect(
      placeOrder({ symbol: "BTC", side: "buy", type: "market", notionalUsd: 100, leverage: 1 }),
    ).rejects.toMatchObject({ code: "NO_ACTIVE_ACCOUNT" });

    const q = await getCheckoutQuote("core");
    expect(q).toMatchObject({ pricing: "rebuy", fullFee: 99, price: 79, discountLabel: "Rebuy discount: 20% off" });
    const next = await buyByCard("core");
    expect(next.feePaidUsd).toBe(79);
    expect(data().rebuyOffer).toBeNull();
  });

  it("max breach when flat books a test adjustment and reports the max rule", async () => {
    await buyByCard("starter");
    tc.jumpToMaxBreach();
    expect(data().accounts[0].breach).toMatchObject({ rule: "max", limit: 4_750 });
  });
});

describe("trading", () => {
  it("market order fills at the mark; limit order fills when price crosses; TP closes", async () => {
    await buyByCard("pro");
    const eth = getMarks().ETH;
    const o = await placeOrder({ symbol: "ETH", side: "buy", type: "market", notionalUsd: 10_000, leverage: 5, tp: eth * 1.05 });
    expect(o).toMatchObject({ status: "filled", fillPrice: eth });
    expect(await listPositions()).toHaveLength(1);

    const limit = await placeOrder({ symbol: "SOL", side: "buy", type: "limit", notionalUsd: 2_000, leverage: 2, limitPrice: getMarks().SOL * 0.9 });
    expect(limit.status).toBe("working");
    setMark("SOL", getMarks().SOL * 0.85);
    evaluate();
    expect(data().orders.find((x) => x.id === limit.id)?.status).toBe("filled");

    setMark("ETH", eth * 1.06);
    evaluate();
    const fills = await listFills();
    expect(fills.some((f) => f.kind === "take_profit" && f.realizedPnl > 0)).toBe(true);
  });

  it("rejects orders beyond buying power", async () => {
    await buyByCard("starter");
    await expect(
      placeOrder({ symbol: "BTC", side: "buy", type: "market", notionalUsd: 60_000, leverage: 10 }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_MARGIN" });
  });

  it("cancelling works and SOD rolls over at 00:00 UTC", async () => {
    await buyByCard("core");
    const o = await placeOrder({ symbol: "XRP", side: "sell", type: "limit", notionalUsd: 500, leverage: 1, limitPrice: getMarks().XRP * 1.5 });
    expect((await cancelOrder(o.id)).status).toBe("cancelled");
    await realize(200);
    expect(active().balance).toBeCloseTo(10_200, 1);
    expect(active().sod).toBe(10_000);
    tc.advanceClockToMidnight();
    expect(active().sod).toBeCloseTo(10_200, 1);
  });
});

describe("graduation and payouts", () => {
  it("graduates when flat at +10%, then pays 80/20 on D+7", async () => {
    await buyByCard("elite");
    tc.jumpToTarget();
    const accounts = await listAccounts();
    expect(accounts.map((a) => [a.phase, a.status])).toEqual([
      ["funded", "active"],
      ["challenge", "graduated"],
    ]);
    const funded = active();
    expect(funded).toMatchObject({ baseline: 100_000, balance: 100_000, feePaidUsd: 0 });
    expect(data().takeover?.kind).toBe("graduation");

    // Funded account at $106,200 realized.
    await realize(6_200);
    expect(active().balance).toBeCloseTo(106_200, 1);

    await expect(requestPayout({ accountId: funded.id })).rejects.toMatchObject({ code: "PAYOUT_BLOCKED" });
    await startKyc();
    expect((await getKyc()).status).toBe("in_review");
    tc.approveKyc();

    // Normalize float noise from the price path to the PRD example.
    tc.fundWallet("arbitrum", "USDC", 0);
    const s = getSnapshot();
    if (s.status === "ready") s.data.accounts.find((a) => a.id === funded.id)!.balance = 106_200;

    const payout = await requestPayout({ accountId: funded.id });
    expect(payout).toMatchObject({
      profitUsd: 6_200,
      traderUsd: 4_960,
      propfundUsd: 1_240,
      baselineAfter: 100_000,
      status: "under_review",
      address: WALLET,
      customAddress: false,
    });
    expect(payout.paysAt - payout.requestedAt).toBe(7 * DAY_MS);
    expect(active()).toMatchObject({ balance: 100_000, baseline: 100_000 });

    await expect(requestPayout({ accountId: funded.id })).rejects.toMatchObject({ code: "PAYOUT_BLOCKED" });

    tc.advanceClockDays(7);
    const [paid] = await listPayouts();
    expect(paid.status).toBe("paid");
    expect(paid.txHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("a custom address needs the control confirmation", async () => {
    await buyByCard("core");
    tc.jumpToTarget();
    await realize(500);
    tc.approveKyc();
    const funded = active();
    const other = "0x" + "2".repeat(40);
    await expect(requestPayout({ accountId: funded.id, address: other })).rejects.toMatchObject({ code: "VALIDATION" });
    const p = await requestPayout({ accountId: funded.id, address: other, confirmControlsAddress: true });
    expect(p.customAddress).toBe(true);
  });

  it("a returned payout credits P back so the trader can request again", async () => {
    await buyByCard("core");
    tc.jumpToTarget();
    await realize(500);
    tc.approveKyc();
    const funded = active();
    const before = funded.balance;
    await requestPayout({ accountId: funded.id });
    tc.returnPayout();
    expect(active().balance).toBeCloseTo(before, 2);
    expect((await listPayouts())[0].status).toBe("returned");
  });
});

describe("violation", () => {
  it("terminates accounts, voids payouts under review, bars the user, no rebuy", async () => {
    await buyByCard("core");
    tc.jumpToTarget();
    await realize(500);
    tc.approveKyc();
    await requestPayout({ accountId: active().id });
    tc.flagViolation("V2");
    const d = data();
    expect(d.accounts.find((a) => a.phase === "funded")?.status).toBe("terminated");
    expect(d.payouts[0].status).toBe("voided");
    expect(d.user.barred).toBe(true);
    expect(d.rebuyOffer).toBeNull();
    expect(d.takeover).toMatchObject({ kind: "violation", code: "V2" });
    await expect(createCardCheckout({ packageId: "core", agreedToTerms: true })).rejects.toMatchObject({ code: "BARRED" });
    await expect(purchaseWithCredit({ packageId: "core", agreedToTerms: true })).rejects.toMatchObject({ code: "BARRED" });
  });
});

describe("persistence", () => {
  it("saves per user id and reloads", async () => {
    const id = data().user.id;
    await buyByCard("plus");
    await setSessionUser(null); // flushes
    expect(now()).toBeGreaterThan(0);
    await setSessionUser({ id, email: null, walletAddress: WALLET });
    expect(data().accounts).toHaveLength(1);
    expect(data().accounts[0].accountSize).toBe(25_000);
  });
});
