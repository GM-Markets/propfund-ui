/**
 * Mock service API (PRD §12). Async functions shaped like future HTTP calls:
 * they act as the signed-in user, resolve with no artificial latency, enforce
 * every PRD rule and throw `ServiceError` with user-facing copy when a rule
 * blocks.
 *
 * A real backend can replace this module without changing screens.
 */
import { getMarket } from "@/lib/propfund/markets";
import {
  ACTIVE_ACCOUNT_EXISTS_COPY,
  MAX_LEVERAGE,
  MIN_LEVERAGE,
  MIN_ORDER_NOTIONAL_USD,
  PACKAGES,
  activeAccount,
  applyCredit,
  applyPayout,
  checkoutPrice,
  computeAccountMetrics,
  getChain,
  getPackage,
  isChainId,
  isEvmAddress,
  isToken,
  latestAccount,
  newestFirst,
  payoutBlockers,
  PAYOUT_BLOCKER_COPY,
  positionSideFor,
  roundCents,
  validateExits,
} from "@/lib/propfund/rules";
import type {
  Account,
  AccountMetrics,
  CardCheckout,
  ChainId,
  ChallengePackage,
  Deposit,
  DepositSource,
  Fill,
  Kyc,
  Order,
  OrderSide,
  OrderType,
  PackageId,
  Payment,
  Payout,
  Position,
  RebuyOffer,
  Takeover,
  TokenSymbol,
  Wallet,
} from "@/lib/propfund/types";

import { now } from "./clock";
import {
  accountPositions,
  closePositionAt,
  completePayment,
  evaluateDraft,
  fillOrder,
  openChallengeAccount,
  workingOrders,
} from "./engine";
import { ServiceError } from "./errors";
import { newId, randomTxHash } from "./ids";
import { getMarks, getQuote } from "./prices";
import { commit, getSnapshot, requireData, subscribe, type UserData } from "./store";

// ── latency ────────────────────────────────────────────────────────────────

// Zero: every service call is local, so an action must land in the same frame
// the user triggered it. A real backend can reintroduce latency here.
let latency: [number, number] = [0, 0];

/** `[min, max]` artificial latency in ms. Zero by default. */
export function configureMockService(opts: { latencyMs?: [number, number] }): void {
  if (opts.latencyMs) latency = opts.latencyMs;
}

function delay(): Promise<void> {
  const [min, max] = latency;
  if (max <= 0) return Promise.resolve();
  const ms = min + Math.random() * (max - min);
  return new Promise((r) => setTimeout(r, ms));
}

/** Clone before returning so callers can't mutate store state. */
function out<T>(value: T): T {
  return structuredClone(value);
}

// ── shared guards ──────────────────────────────────────────────────────────

function findAccount(d: UserData, accountId: string): Account {
  const a = d.accounts.find((x) => x.id === accountId);
  if (!a) throw new ServiceError("NOT_FOUND", "Account not found.");
  return a;
}

function requireActive(d: UserData, accountId?: string): Account {
  const account = accountId ? findAccount(d, accountId) : activeAccount(d.accounts);
  if (!account) throw new ServiceError("NO_ACTIVE_ACCOUNT", "You don't have an active account.");
  if (account.status !== "active") {
    throw new ServiceError("ACCOUNT_READ_ONLY", "This account is closed and read-only.");
  }
  return account;
}

function assertCanPurchase(d: UserData, agreedToTerms: boolean) {
  if (d.user.barred) {
    throw new ServiceError("BARRED", "Your profile can't buy new challenges after a confirmed violation.");
  }
  if (d.testFlags.restrictedRegion) {
    throw new ServiceError("RESTRICTED_REGION", "Propfund isn't available in your region.");
  }
  if (activeAccount(d.accounts)) {
    throw new ServiceError("ACTIVE_ACCOUNT_EXISTS", ACTIVE_ACCOUNT_EXISTS_COPY);
  }
  if (!agreedToTerms) {
    throw new ServiceError("TERMS_NOT_ACCEPTED", "Tick “I agree to the Trading Rules and Terms” to continue.");
  }
}

function requirePackage(packageId: string): ChallengePackage {
  const pkg = getPackage(packageId);
  if (!pkg) throw new ServiceError("VALIDATION", "Choose a challenge package.");
  return pkg;
}

function metricsFor(d: UserData, account: Account): AccountMetrics {
  return computeAccountMetrics(
    account,
    accountPositions(d, account.id),
    workingOrders(d, account.id).length,
    getMarks(),
  );
}

// ── overview + catalogue ───────────────────────────────────────────────────

export type Overview = {
  user: UserData["user"];
  activeAccount: Account | null;
  activeMetrics: AccountMetrics | null;
  rebuyOffer: RebuyOffer | null;
  payoutUnderReview: Payout | null;
  recentAccounts: Account[];
  kyc: Kyc;
  takeover: Takeover | null;
};

export async function getOverview(): Promise<Overview> {
  await delay();
  const d = requireData();
  const active = activeAccount(d.accounts);
  return out({
    user: d.user,
    activeAccount: active,
    activeMetrics: active ? metricsFor(d, active) : null,
    rebuyOffer: d.rebuyOffer,
    payoutUnderReview: d.payouts.find((p) => p.status === "under_review") ?? null,
    recentAccounts: newestFirst(d.accounts, (a) => a.createdAt).slice(0, 5),
    kyc: d.kyc,
    takeover: d.takeover,
  });
}

export async function listPackages(): Promise<ChallengePackage[]> {
  await delay();
  return out([...PACKAGES]);
}

export type CheckoutQuote = {
  package: ChallengePackage;
  pricing: "full" | "rebuy";
  fullFee: number;
  rebuyFee: number;
  price: number;
  discountLabel: string | null;
  creditAppliedUsd: number;
  amountDueUsd: number;
  /** Why checkout is disabled, if it is. */
  blocked: { code: "BARRED" | "ACTIVE_ACCOUNT_EXISTS" | "RESTRICTED_REGION"; message: string } | null;
};

export async function getCheckoutQuote(packageId: PackageId): Promise<CheckoutQuote> {
  await delay();
  const d = requireData();
  return quoteFor(d, requirePackage(packageId));
}

function quoteFor(d: UserData, pkg: ChallengePackage): CheckoutQuote {
  const price = checkoutPrice(pkg, !!d.rebuyOffer && !d.user.barred);
  const credit = applyCredit(price.price, d.user.depositCreditUsd);
  let blocked: CheckoutQuote["blocked"] = null;
  if (d.user.barred) {
    blocked = { code: "BARRED", message: "Your profile can't buy new challenges after a confirmed violation." };
  } else if (d.testFlags.restrictedRegion) {
    blocked = { code: "RESTRICTED_REGION", message: "Propfund isn't available in your region." };
  } else if (activeAccount(d.accounts)) {
    blocked = { code: "ACTIVE_ACCOUNT_EXISTS", message: ACTIVE_ACCOUNT_EXISTS_COPY };
  }
  return { package: pkg, ...price, ...credit, blocked };
}

// ── deposits (crypto) ──────────────────────────────────────────────────────

export type CreateCryptoDepositInput = {
  packageId: PackageId;
  chain: ChainId;
  token: TokenSymbol;
  /** `propfund_wallet` / `connected_wallet`: transfer confirmed in the wallet. `external`: send from anywhere. */
  source: DepositSource;
  agreedToTerms: boolean;
};

/**
 * Start a stablecoin checkout. Wallet sources move straight to Confirming;
 * `external` waits for a transfer to the deposit address (use
 * `simulateDepositConfirmations` or test controls to deliver it).
 */
export async function createCryptoDeposit(input: CreateCryptoDepositInput): Promise<Deposit> {
  await delay();
  if (!isChainId(input.chain)) throw new ServiceError("VALIDATION", "Choose a supported chain.");
  if (!isToken(input.token)) throw new ServiceError("VALIDATION", "Choose USDC or USDT.");
  const pkg = requirePackage(input.packageId);
  let created: Deposit | null = null;
  commit((d) => {
    assertCanPurchase(d, input.agreedToTerms);
    const q = quoteFor(d, pkg);
    if (q.amountDueUsd <= 0) {
      throw new ServiceError("CREDIT_COVERS_FEE", "Your deposit balance covers this fee. Use it to pay instead.");
    }
    const at = now();
    if (input.source === "propfund_wallet") {
      const bal = d.walletBalances.find((b) => b.chain === input.chain && b.token === input.token);
      if (!bal || bal.amount + 1e-9 < q.amountDueUsd) {
        throw new ServiceError(
          "INSUFFICIENT_WALLET_BALANCE",
          `Your Propfund wallet doesn't have enough ${input.token} on ${getChain(input.chain).name}.`,
        );
      }
      bal.amount = roundCents(bal.amount - q.amountDueUsd);
    }
    // A new checkout supersedes older ones still waiting for a transfer.
    for (const old of d.deposits) {
      if (old.status === "waiting") {
        old.status = "expired";
        const p = d.payments.find((x) => x.id === old.paymentId);
        if (p && p.status === "pending") {
          p.status = "cancelled";
          p.completedAt = at;
        }
      }
    }
    const payment: Payment = {
      id: newId("pay"),
      userId: d.user.id,
      method: "crypto",
      packageId: pkg.id,
      pricing: q.pricing,
      priceUsd: q.price,
      creditAppliedUsd: q.creditAppliedUsd,
      amountUsd: q.amountDueUsd,
      status: "pending",
      createdAt: at,
      completedAt: null,
      depositId: null,
      accountId: null,
      failureReason: null,
      testMode: true,
    };
    const walletSource = input.source !== "external";
    const deposit: Deposit = {
      id: newId("dep"),
      userId: d.user.id,
      packageId: pkg.id,
      pricing: q.pricing,
      priceUsd: q.price,
      creditAppliedUsd: q.creditAppliedUsd,
      amountDueUsd: q.amountDueUsd,
      chain: input.chain,
      token: input.token,
      source: input.source,
      address: d.user.depositAddress,
      status: walletSource ? "confirming" : "waiting",
      confirmations: 0,
      requiredConfirmations: getChain(input.chain).requiredConfirmations,
      amountReceivedUsd: walletSource ? q.amountDueUsd : null,
      txHash: walletSource ? randomTxHash() : null,
      createdAt: at,
      confirmingSince: walletSource ? at : null,
      confirmedAt: null,
      paymentId: payment.id,
      accountId: null,
    };
    payment.depositId = deposit.id;
    // Credit is reserved now; it is returned if the checkout fails.
    d.user.depositCreditUsd = roundCents(d.user.depositCreditUsd - q.creditAppliedUsd);
    d.payments.push(payment);
    d.deposits.push(deposit);
    created = deposit;
  });
  return out(created as unknown as Deposit);
}

/**
 * Deliver the transfer for a deposit and start confirmations. `amountUsd`
 * defaults to the exact amount due (pass more to test overpayment credit, less
 * to test underpayment). Resolves with the deposit in Confirming.
 */
export async function simulateDepositConfirmations(
  depositId: string,
  opts: { amountUsd?: number } = {},
): Promise<Deposit> {
  await delay();
  let result: Deposit | null = null;
  commit((d) => {
    const dep = d.deposits.find((x) => x.id === depositId);
    if (!dep) throw new ServiceError("NOT_FOUND", "Deposit not found.");
    if (dep.status === "confirming") {
      result = dep;
      return false;
    }
    if (dep.status !== "waiting") throw new ServiceError("INVALID_STATE", "This deposit is already settled.");
    const amount = opts.amountUsd ?? dep.amountDueUsd;
    if (!(amount > 0)) throw new ServiceError("VALIDATION", "Amount must be above zero.");
    const at = now();
    dep.amountReceivedUsd = roundCents(amount);
    dep.txHash = randomTxHash();
    dep.status = "confirming";
    dep.confirmingSince = at;
    dep.confirmations = 0;
    result = dep;
  });
  return out(result as unknown as Deposit);
}

/** Resolves once the deposit leaves Waiting/Confirming (confirmed, underpaid or expired). */
export function waitForDeposit(depositId: string): Promise<Deposit> {
  return new Promise((resolve, reject) => {
    const check = () => {
      const s = getSnapshot();
      if (s.status !== "ready") {
        unsub();
        reject(new ServiceError("UNAUTHENTICATED", "Sign in to continue."));
        return true;
      }
      const dep = s.data.deposits.find((x) => x.id === depositId);
      if (!dep) {
        unsub();
        reject(new ServiceError("NOT_FOUND", "Deposit not found."));
        return true;
      }
      if (dep.status !== "waiting" && dep.status !== "confirming") {
        unsub();
        resolve(out(dep));
        return true;
      }
      return false;
    };
    const unsub = subscribe(() => {
      check();
    });
    check();
  });
}

export async function listDeposits(): Promise<Deposit[]> {
  await delay();
  return out(newestFirst(requireData().deposits, (a) => a.createdAt));
}

// ── card ───────────────────────────────────────────────────────────────────

/** Opens a simulated hosted card checkout. Propfund never renders card fields. */
export async function createCardCheckout(input: {
  packageId: PackageId;
  agreedToTerms: boolean;
}): Promise<CardCheckout> {
  await delay();
  const pkg = requirePackage(input.packageId);
  let created: CardCheckout | null = null;
  commit((d) => {
    assertCanPurchase(d, input.agreedToTerms);
    const q = quoteFor(d, pkg);
    if (q.amountDueUsd <= 0) {
      throw new ServiceError("CREDIT_COVERS_FEE", "Your deposit balance covers this fee. Use it to pay instead.");
    }
    const at = now();
    const payment: Payment = {
      id: newId("pay"),
      userId: d.user.id,
      method: "card",
      packageId: pkg.id,
      pricing: q.pricing,
      priceUsd: q.price,
      creditAppliedUsd: q.creditAppliedUsd,
      amountUsd: q.amountDueUsd,
      status: "pending",
      createdAt: at,
      completedAt: null,
      depositId: null,
      accountId: null,
      failureReason: null,
      testMode: true,
    };
    const checkout: CardCheckout = {
      id: newId("cs"),
      paymentId: payment.id,
      packageId: pkg.id,
      pricing: q.pricing,
      priceUsd: q.price,
      creditAppliedUsd: q.creditAppliedUsd,
      amountUsd: q.amountDueUsd,
      status: "pending",
      createdAt: at,
      testMode: true,
    };
    d.user.depositCreditUsd = roundCents(d.user.depositCreditUsd - q.creditAppliedUsd);
    d.payments.push(payment);
    d.cardCheckouts.push(checkout);
    created = checkout;
  });
  return out(created as unknown as CardCheckout);
}

/**
 * Finish the simulated hosted checkout. `succeeded` creates the account;
 * `failed` / `cancelled` returns any reserved credit.
 */
export async function completeTestCardPayment(
  checkoutId: string,
  outcome: "succeeded" | "failed" | "cancelled" = "succeeded",
): Promise<{ checkout: CardCheckout; payment: Payment; account: Account | null }> {
  await delay();
  let result: { checkout: CardCheckout; payment: Payment; account: Account | null } | null = null;
  commit((d) => {
    const checkout = d.cardCheckouts.find((c) => c.id === checkoutId);
    if (!checkout) throw new ServiceError("NOT_FOUND", "Checkout not found.");
    if (checkout.status !== "pending") throw new ServiceError("INVALID_STATE", "This checkout is already finished.");
    const payment = d.payments.find((p) => p.id === checkout.paymentId);
    if (!payment) throw new ServiceError("NOT_FOUND", "Payment not found.");
    const at = now();
    let account: Account | null = null;
    if (outcome === "succeeded") {
      account = completePayment(d, payment, at);
      checkout.status = payment.status;
    } else {
      payment.status = outcome;
      payment.completedAt = at;
      payment.failureReason = outcome === "failed" ? "The card payment was declined." : null;
      checkout.status = outcome;
      d.user.depositCreditUsd = roundCents(d.user.depositCreditUsd + payment.creditAppliedUsd);
    }
    result = { checkout, payment, account };
  });
  return out(result as unknown as { checkout: CardCheckout; payment: Payment; account: Account | null });
}

/** Pay entirely from deposit balance when it covers the price. */
export async function purchaseWithCredit(input: {
  packageId: PackageId;
  agreedToTerms: boolean;
}): Promise<Account> {
  await delay();
  const pkg = requirePackage(input.packageId);
  let account: Account | null = null;
  commit((d) => {
    assertCanPurchase(d, input.agreedToTerms);
    const q = quoteFor(d, pkg);
    if (q.amountDueUsd > 0) {
      throw new ServiceError("CREDIT_INSUFFICIENT", "Your deposit balance doesn't cover this fee.");
    }
    const at = now();
    const payment: Payment = {
      id: newId("pay"),
      userId: d.user.id,
      method: "credit",
      packageId: pkg.id,
      pricing: q.pricing,
      priceUsd: q.price,
      creditAppliedUsd: q.creditAppliedUsd,
      amountUsd: 0,
      status: "succeeded",
      createdAt: at,
      completedAt: at,
      depositId: null,
      accountId: null,
      failureReason: null,
      testMode: true,
    };
    d.user.depositCreditUsd = roundCents(d.user.depositCreditUsd - q.creditAppliedUsd);
    d.payments.push(payment);
    account = openChallengeAccount(d, {
      packageId: pkg.id,
      pricing: q.pricing,
      feePaidUsd: q.price,
      paymentId: payment.id,
      at,
    });
    payment.accountId = account.id;
  });
  return out(account as unknown as Account);
}

export async function listPayments(): Promise<Payment[]> {
  await delay();
  return out(newestFirst(requireData().payments, (a) => a.createdAt));
}

// ── accounts ───────────────────────────────────────────────────────────────

export async function getActiveAccount(): Promise<Account | null> {
  await delay();
  return out(activeAccount(requireData().accounts));
}

/** Newest first. */
export async function listAccounts(): Promise<Account[]> {
  await delay();
  return out(newestFirst(requireData().accounts, (a) => a.createdAt));
}

export async function getAccountMetrics(accountId?: string): Promise<AccountMetrics | null> {
  await delay();
  const d = requireData();
  const account = accountId ? findAccount(d, accountId) : activeAccount(d.accounts);
  return account ? metricsFor(d, account) : null;
}

export type AccountStatement = {
  account: Account;
  fills: Fill[];
  orders: Order[];
  payouts: Payout[];
  payment: Payment | null;
};

/** Read-only statement for History. */
export async function getAccountStatement(accountId: string): Promise<AccountStatement> {
  await delay();
  const d = requireData();
  const account = findAccount(d, accountId);
  return out({
    account,
    fills: newestFirst(d.fills.filter((f) => f.accountId === accountId), (a) => a.at),
    orders: newestFirst(d.orders.filter((o) => o.accountId === accountId), (a) => a.createdAt),
    payouts: newestFirst(d.payouts.filter((p) => p.accountId === accountId), (a) => a.requestedAt),
    payment: d.payments.find((p) => p.id === account.paymentId) ?? null,
  });
}

/** Clear the breach / graduation / violation takeover once acknowledged. */
export async function dismissTakeover(): Promise<void> {
  await delay();
  commit((d) => {
    if (!d.takeover) return false;
    d.takeover = null;
  });
}

// ── trading ────────────────────────────────────────────────────────────────

export type PlaceOrderInput = {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  /** Size in USD notional. */
  notionalUsd: number;
  /** 1–10. */
  leverage: number;
  /** Required for limit orders. */
  limitPrice?: number | null;
  tp?: number | null;
  sl?: number | null;
};

/**
 * Market orders fill at the mark immediately; limit orders rest until price
 * crosses. Every order is manual (PRD §9 V1). Resolves with the order.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  await delay();
  const market = getMarket(input.symbol);
  if (!market) throw new ServiceError("VALIDATION", "Choose a market.");
  if (input.side !== "buy" && input.side !== "sell") throw new ServiceError("VALIDATION", "Choose Buy or Sell.");
  if (input.type !== "market" && input.type !== "limit") throw new ServiceError("VALIDATION", "Choose Market or Limit.");
  if (!(input.notionalUsd >= MIN_ORDER_NOTIONAL_USD)) {
    throw new ServiceError("VALIDATION", `Minimum order size is $${MIN_ORDER_NOTIONAL_USD}.`);
  }
  if (!(input.leverage >= MIN_LEVERAGE && input.leverage <= MAX_LEVERAGE)) {
    throw new ServiceError("VALIDATION", `Leverage must be between ${MIN_LEVERAGE}× and ${MAX_LEVERAGE}×.`);
  }
  const limitPrice = input.type === "limit" ? (input.limitPrice ?? null) : null;
  if (input.type === "limit" && !(limitPrice && limitPrice > 0)) {
    throw new ServiceError("VALIDATION", "Enter a limit price.");
  }
  const tp = input.tp ?? null;
  const sl = input.sl ?? null;

  let placed: Order | null = null;
  commit((d) => {
    if (d.user.barred) throw new ServiceError("BARRED", "Your profile can't trade after a confirmed violation.");
    const account = requireActive(d);
    const marks = getMarks();
    const mark = marks[input.symbol] ?? getQuote(input.symbol)?.price;
    if (mark === undefined) throw new ServiceError("VALIDATION", "No price for this market yet.");
    const reference = limitPrice ?? mark;
    const exitError = validateExits(positionSideFor(input.side), reference, tp, sl);
    if (exitError) throw new ServiceError("VALIDATION", exitError);

    const at = now();
    const order: Order = {
      id: newId("ord"),
      accountId: account.id,
      symbol: input.symbol,
      side: input.side,
      type: input.type,
      notionalUsd: roundCents(input.notionalUsd),
      leverage: input.leverage,
      limitPrice,
      takeProfit: tp,
      stopLoss: sl,
      status: "working",
      createdAt: at,
      filledAt: null,
      fillPrice: null,
      cancelledAt: null,
      note: null,
    };
    if (input.type === "market") {
      fillOrder(d, account, order, mark, marks, at); // throws INSUFFICIENT_MARGIN before any mutation
    }
    d.orders.push(order);
    evaluateDraft(d, marks, at);
    placed = order;
  });
  return out(placed as unknown as Order);
}

export async function cancelOrder(orderId: string): Promise<Order> {
  await delay();
  let result: Order | null = null;
  commit((d) => {
    const order = d.orders.find((o) => o.id === orderId);
    if (!order) throw new ServiceError("NOT_FOUND", "Order not found.");
    requireActive(d, order.accountId);
    if (order.status !== "working") throw new ServiceError("INVALID_STATE", "This order is no longer working.");
    const at = now();
    order.status = "cancelled";
    order.cancelledAt = at;
    order.note = "Cancelled by you";
    // Cancelling the last working order can make the account flat → graduation.
    evaluateDraft(d, getMarks(), at);
    result = order;
  });
  return out(result as unknown as Order);
}

/** Close a whole position at the mark. Resolves with the closing fill. */
export async function closePosition(positionId: string): Promise<Fill> {
  await delay();
  let fill: Fill | null = null;
  commit((d) => {
    const position = d.positions.find((p) => p.id === positionId);
    if (!position) throw new ServiceError("NOT_FOUND", "Position not found.");
    const account = requireActive(d, position.accountId);
    const marks = getMarks();
    const mark = marks[position.symbol];
    if (mark === undefined) throw new ServiceError("VALIDATION", "No price for this market yet.");
    const at = now();
    closePositionAt(d, account, position, mark, "manual_close", at);
    fill = d.fills[d.fills.length - 1];
    evaluateDraft(d, marks, at);
  });
  return out(fill as unknown as Fill);
}

/** Set or clear take-profit / stop-loss on an open position (null clears). */
export async function updatePositionExits(
  positionId: string,
  exits: { tp: number | null; sl: number | null },
): Promise<Position> {
  await delay();
  let result: Position | null = null;
  commit((d) => {
    const position = d.positions.find((p) => p.id === positionId);
    if (!position) throw new ServiceError("NOT_FOUND", "Position not found.");
    requireActive(d, position.accountId);
    const mark = getMarks()[position.symbol] ?? position.entryPrice;
    const err = validateExits(position.side, mark, exits.tp, exits.sl);
    if (err) throw new ServiceError("VALIDATION", err.replace("entry price", "current price"));
    position.takeProfit = exits.tp;
    position.stopLoss = exits.sl;
    position.updatedAt = now();
    result = position;
  });
  return out(result as unknown as Position);
}

function currentAccountId(d: UserData, accountId?: string): string | null {
  if (accountId) return accountId;
  return (activeAccount(d.accounts) ?? latestAccount(d.accounts))?.id ?? null;
}

/** Defaults to the active account (or the most recent one if none is active). */
export async function listPositions(accountId?: string): Promise<Position[]> {
  await delay();
  const d = requireData();
  const id = currentAccountId(d, accountId);
  return out(id ? d.positions.filter((p) => p.accountId === id) : []);
}

export async function listOrders(accountId?: string): Promise<Order[]> {
  await delay();
  const d = requireData();
  const id = currentAccountId(d, accountId);
  return out(id ? newestFirst(d.orders.filter((o) => o.accountId === id), (a) => a.createdAt) : []);
}

export async function listFills(accountId?: string): Promise<Fill[]> {
  await delay();
  const d = requireData();
  const id = currentAccountId(d, accountId);
  return out(id ? newestFirst(d.fills.filter((f) => f.accountId === id), (a) => a.at) : []);
}

// ── identity verification ──────────────────────────────────────────────────

export async function getKyc(): Promise<Kyc> {
  await delay();
  return out(requireData().kyc);
}

/**
 * Submit identity verification (simulated, test mode). Only as the first step
 * of a payout request: requires an active funded account (PRD §1, §8).
 */
export async function startKyc(): Promise<Kyc> {
  await delay();
  let kyc: Kyc | null = null;
  commit((d) => {
    const active = activeAccount(d.accounts);
    if (!active || active.phase !== "funded") {
      throw new ServiceError("KYC_NOT_REQUIRED", "Identity verification opens with your first payout request.");
    }
    if (d.kyc.status === "verified" || d.kyc.status === "in_review") {
      throw new ServiceError("INVALID_STATE", "Your identity verification is already submitted.");
    }
    const at = now();
    d.kyc = { status: "in_review", submittedAt: at, updatedAt: at, note: null };
    kyc = d.kyc;
  });
  return out(kyc as unknown as Kyc);
}

// ── payouts ────────────────────────────────────────────────────────────────

export type PayoutPreview = {
  accountId: string;
  profitUsd: number;
  traderUsd: number;
  propfundUsd: number;
  newBaseline: number;
  newDailyLossLimit: number;
  newMaxLossLevel: number;
  paysAt: number;
  defaultAddress: string | null;
  blockers: { code: string; message: string }[];
};

/** Everything the request sheet shows, computed for "now". */
export async function getPayoutPreview(): Promise<PayoutPreview | null> {
  await delay();
  const d = requireData();
  const account = activeAccount(d.accounts);
  if (!account) return null;
  return payoutPreviewFor(d, account, now());
}

function payoutPreviewFor(d: UserData, account: Account, at: number): PayoutPreview {
  const fx = applyPayout(account, at);
  const m = metricsFor(d, account);
  const blockers = payoutBlockers({
    phase: account.phase,
    active: account.status === "active",
    kycStatus: d.kyc.status,
    flat: m.flat,
    realizedProfitUsd: fx.profitUsd,
    hasPayoutUnderReview: d.payouts.some((p) => p.status === "under_review"),
  });
  return {
    accountId: account.id,
    profitUsd: fx.profitUsd,
    traderUsd: fx.traderUsd,
    propfundUsd: fx.propfundUsd,
    newBaseline: fx.newBaseline,
    newDailyLossLimit: roundCents(0.03 * fx.newBaseline),
    newMaxLossLevel: roundCents(0.95 * fx.newBaseline),
    paysAt: fx.paysAt,
    defaultAddress: d.user.walletAddress,
    blockers: blockers.map((code) => ({ code, message: PAYOUT_BLOCKER_COPY[code] })),
  };
}

export type RequestPayoutInput = {
  accountId: string;
  /** Arbitrum address for USDC. Defaults to the Propfund wallet. */
  address?: string | null;
  /** Required when `address` isn't the Propfund wallet: "I control this address on Arbitrum". */
  confirmControlsAddress?: boolean;
};

/**
 * Submit a payout on day D: debits P, resets B, lowers SOD by P, pays on D+7.
 * Rules: funded, verified, flat, profit ≥ $50, none under review.
 */
export async function requestPayout(input: RequestPayoutInput): Promise<Payout> {
  await delay();
  let payout: Payout | null = null;
  commit((d) => {
    const account = requireActive(d, input.accountId);
    const at = now();
    const preview = payoutPreviewFor(d, account, at);
    if (preview.blockers.length) {
      throw new ServiceError("PAYOUT_BLOCKED", preview.blockers[0].message, preview.blockers);
    }
    const address = (input.address ?? d.user.walletAddress ?? "").trim();
    if (!isEvmAddress(address)) {
      throw new ServiceError("VALIDATION", "Enter a valid Arbitrum address.");
    }
    const custom = !d.user.walletAddress || address.toLowerCase() !== d.user.walletAddress.toLowerCase();
    if (custom && !input.confirmControlsAddress) {
      throw new ServiceError("VALIDATION", "Confirm you control this address on Arbitrum.");
    }
    const fx = applyPayout(account, at);
    const baselineBefore = account.baseline;
    account.balance = fx.newBalance;
    account.baseline = fx.newBaseline;
    account.sod = fx.newSod;
    payout = {
      id: newId("po"),
      userId: d.user.id,
      accountId: account.id,
      profitUsd: fx.profitUsd,
      traderUsd: fx.traderUsd,
      propfundUsd: fx.propfundUsd,
      address,
      customAddress: custom,
      baselineBefore,
      baselineAfter: fx.newBaseline,
      status: "under_review",
      requestedAt: at,
      paysAt: fx.paysAt,
      paidAt: null,
      txHash: null,
      voidedAt: null,
      returnedAt: null,
      note: null,
    };
    d.payouts.push(payout);
  });
  return out(payout as unknown as Payout);
}

/** Newest first. */
export async function listPayouts(): Promise<Payout[]> {
  await delay();
  return out(newestFirst(requireData().payouts, (a) => a.requestedAt));
}

// ── wallet ─────────────────────────────────────────────────────────────────

export async function getWallet(): Promise<Wallet> {
  await delay();
  const d = requireData();
  return out({
    address: d.user.walletAddress,
    depositAddress: d.user.depositAddress,
    balances: d.walletBalances,
    depositCreditUsd: d.user.depositCreditUsd,
  });
}

export async function getRebuyOffer(): Promise<RebuyOffer | null> {
  await delay();
  return out(requireData().rebuyOffer);
}
