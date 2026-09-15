import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import * as hsc from "@/lib/hsc/client";

import {
  createCheckoutAction,
  createFreeAccountAction,
  getKycSessionAction,
  getKycStatusAction,
  listPropAccountsAction,
  simulateCheckoutAction,
  simulateKycAction,
} from "./onboarding";

const PROP = {
  id: "p1",
  tier_id: "tier_25k",
  asset_class: "crypto",
  account_size: 25_000,
  status: "evaluation",
  subaccount_id: 1,
  subaccount_uuid: "p1",
  synthetic_hotkey: null,
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("onboarding actions", () => {
  it("getKycStatusAction returns the status payload", async () => {
    vi.spyOn(hsc.kyc, "status").mockResolvedValue({
      user_id: "u1",
      kyc_provider: "stripe_identity",
      kyc_status: "verified",
      kyc_verified_at: "2026-01-01",
      kyc_failure_reason: null,
      dev_simulate: true,
    });
    const r = await getKycStatusAction();
    expect(r).toMatchObject({ ok: true, data: { kyc_status: "verified" } });
  });

  it("getKycSessionAction maps a not-configured error", async () => {
    vi.spyOn(hsc.kyc, "stripeSession").mockRejectedValue(
      new hsc.HscApiError(400, "V2_STRIPE_NOT_CONFIGURED", "no"),
    );
    const r = await getKycSessionAction();
    expect(r).toMatchObject({ ok: false, code: "V2_STRIPE_NOT_CONFIGURED" });
  });

  it("createCheckoutAction forwards the input and returns the Privy session", async () => {
    const input = {
      tier_id: "tier_25k",
      market: "crypto",
      asset_class: "crypto",
      account_size: 25_000,
      amount_cents: 8400,
    };
    const spy = vi.spyOn(hsc.payments, "checkout").mockResolvedValue({
      payment_id: "pay_1",
      provider: "privy",
      provider_payment_id: "prv_1",
      client_secret: "cs_1",
      amount_cents: 8400,
      currency: "usd",
      status: "requires_payment_method",
      tier_id: "tier_25k",
    });
    const r = await createCheckoutAction(input);
    expect(spy).toHaveBeenCalledWith(input);
    expect(r).toMatchObject({ ok: true, data: { client_secret: "cs_1", provider: "privy" } });
  });

  it("simulateKycAction applies the chosen outcome", async () => {
    const spy = vi.spyOn(hsc.kyc, "simulate").mockResolvedValue({
      user_id: "u1",
      kyc_provider: "stripe_identity",
      kyc_status: "verified",
      kyc_verified_at: "2026-01-01",
      kyc_failure_reason: null,
      dev_simulate: true,
    });
    const r = await simulateKycAction("success");
    expect(spy).toHaveBeenCalledWith({ outcome: "success" });
    expect(r).toMatchObject({ ok: true, data: { kyc_status: "verified" } });
  });

  it("simulateCheckoutAction provisions on success", async () => {
    const drop = vi.spyOn(hsc, "dropCachedReads");
    const spy = vi.spyOn(hsc.payments, "simulate").mockResolvedValue({
      payment: {
        payment_id: "pay_sim",
        provider: "privy",
        provider_payment_id: "sim_success_pay_sim",
        client_secret: null,
        amount_cents: 8400,
        currency: "usd",
        status: "succeeded",
        tier_id: "tier_25k",
      },
      account: PROP,
    });
    const r = await simulateCheckoutAction({
      outcome: "success",
      tier_id: "tier_25k",
      market: "crypto",
      asset_class: "crypto",
      account_size: 25_000,
      amount_cents: 8400,
    });
    expect(spy).toHaveBeenCalledWith({
      outcome: "success",
      tier_id: "tier_25k",
      market: "crypto",
      asset_class: "crypto",
      account_size: 25_000,
      amount_cents: 8400,
    });
    expect(r).toMatchObject({ ok: true, data: { account: { id: "p1" } } });
    expect(drop).toHaveBeenCalled();
  });

  it("simulateCheckoutAction does not drop cache on a failed payment", async () => {
    const drop = vi.spyOn(hsc, "dropCachedReads");
    vi.spyOn(hsc.payments, "simulate").mockResolvedValue({
      payment: {
        payment_id: "pay_fail",
        provider: "privy",
        provider_payment_id: "sim_failure_pay_fail",
        client_secret: null,
        amount_cents: 8400,
        currency: "usd",
        status: "failed",
        tier_id: "tier_25k",
      },
      account: null,
    });
    const r = await simulateCheckoutAction({
      outcome: "failure",
      tier_id: "tier_25k",
      market: "crypto",
      asset_class: "crypto",
      account_size: 25_000,
      amount_cents: 8400,
    });
    expect(r).toMatchObject({ ok: true, data: { account: null } });
    expect(drop).not.toHaveBeenCalled();
  });

  it("createFreeAccountAction returns the provisioned account", async () => {
    vi.spyOn(hsc.payments, "freeAccount").mockResolvedValue(PROP);
    const r = await createFreeAccountAction({
      tier_id: "tier_demo",
      asset_class: "crypto",
      account_size: 10_000,
    });
    expect(r).toMatchObject({ ok: true, data: { id: "p1" } });
  });

  it("listPropAccountsAction returns accounts", async () => {
    vi.spyOn(hsc.payments, "listPropAccounts").mockResolvedValue([PROP]);
    const r = await listPropAccountsAction();
    expect(r).toMatchObject({ ok: true, data: [{ id: "p1" }] });
  });
});
