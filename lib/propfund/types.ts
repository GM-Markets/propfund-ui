/**
 * Domain model for the Propfund app. The mock service (lib/propfund/mock) and
 * a future real API share these shapes, so screens never change when the
 * backend is swapped.
 *
 * Money is plain USD numbers (not cents). Timestamps are epoch milliseconds.
 */

// ── catalogue ───────────────────────────────────────────────────────────────

export type PackageId = "starter" | "core" | "plus" | "pro" | "elite";

export type ChallengePackage = {
  id: PackageId;
  name: string;
  accountSize: number;
  /** round(0.01 × size) − 1 */
  fee: number;
  /** round(0.008 × size) − 1 */
  rebuyFee: number;
  /** 3% of size */
  dailyLossLimit: number;
  /** 5% of size */
  maxLossLimit: number;
  /** 10% of size */
  target: number;
};

export type ChainId = "arbitrum" | "ethereum" | "base" | "bnb";
export type TokenSymbol = "USDC" | "USDT";

export type AssetClass = "crypto" | "forex" | "commodities" | "equities";

export type Market = {
  symbol: string;
  /** "BTC/USD" */
  displayName: string;
  /** "Bitcoin" */
  name: string;
  assetClass: AssetClass;
  tickSize: number;
  /** Currency P&L is denominated in before USD conversion. */
  quote: "USD" | "JPY";
  referencePrice: number;
};

// ── user + identity ────────────────────────────────────────────────────────

export type User = {
  /** Sign-in user ID; the key for all Propfund data. */
  id: string;
  email: string | null;
  /** The user's Propfund wallet (embedded EVM wallet). */
  walletAddress: string | null;
  /** Per-user deposit address, the same on all four chains. */
  depositAddress: string;
  /** Overpayment credit usable for the next purchase. Not withdrawable (PRD §4). */
  depositCreditUsd: number;
  /** Set by a confirmed violation (PRD §9). Barred users can't buy again. */
  barred: boolean;
  createdAt: number;
};

export type KycStatus = "not_started" | "in_review" | "verified" | "needs_info" | "rejected";

export type Kyc = {
  status: KycStatus;
  submittedAt: number | null;
  updatedAt: number | null;
  /** Reviewer note for needs_info / rejected. */
  note: string | null;
};

// ── accounts ───────────────────────────────────────────────────────────────

export type Phase = "challenge" | "funded";

/**
 * - `active`: CHALLENGE or FUNDED, tradable.
 * - `graduated`: a challenge that passed (a funded account was opened).
 * - `breached`: hit a loss limit, read-only.
 * - `terminated`: closed by a confirmed violation.
 * - `closed_inactive`: no trade in 60 days.
 */
export type AccountStatus = "active" | "graduated" | "breached" | "terminated" | "closed_inactive";

export type BreachRule = "daily" | "max";

export type Breach = {
  rule: BreachRule;
  at: number;
  equity: number;
  /** The equity level that was hit (SOD − 0.03·B or 0.95·B). */
  limit: number;
};

export type ViolationCode = "V1" | "V2" | "V3" | "V4" | "V5" | "V6" | "V7" | "V8";

export type Violation = {
  code: ViolationCode;
  reason: string;
  at: number;
  /** Sum of payouts voided by this violation. */
  voidedUsd: number;
};

export type AccountStats = {
  trades: number;
  wins: number;
  losses: number;
  realizedPnl: number;
  bestTrade: number;
  worstTrade: number;
  volumeUsd: number;
};

export type EquityPoint = { t: number; equity: number };

export type PricingKind = "full" | "rebuy";

export type Account = {
  id: string;
  userId: string;
  packageId: PackageId;
  accountSize: number;
  phase: Phase;
  status: AccountStatus;
  /** Fee actually paid (0 for a funded account opened by graduation). */
  feePaidUsd: number;
  pricing: PricingKind;
  paymentId: string | null;
  /** The challenge this funded account graduated from. */
  parentAccountId: string | null;
  /** B */
  baseline: number;
  /** Cash after closed trades and payouts. */
  balance: number;
  /** Start-of-day reference. */
  sod: number;
  /** UTC day key ("2026-09-15") that `sod` belongs to. */
  sodDay: string;
  createdAt: number;
  closedAt: number | null;
  lastTradeAt: number | null;
  breach: Breach | null;
  violation: Violation | null;
  stats: AccountStats;
  /** Sampled equity, oldest first (capped). */
  equityCurve: EquityPoint[];
};

// ── trading ────────────────────────────────────────────────────────────────

export type OrderSide = "buy" | "sell";
export type PositionSide = "long" | "short";
export type OrderType = "market" | "limit";

export type Position = {
  id: string;
  accountId: string;
  symbol: string;
  side: PositionSide;
  /** Base units. */
  quantity: number;
  entryPrice: number;
  leverage: number;
  /** Notional at entry in USD. */
  entryNotionalUsd: number;
  /** entryNotionalUsd / leverage. */
  marginUsd: number;
  takeProfit: number | null;
  stopLoss: number | null;
  openedAt: number;
  updatedAt: number;
};

export type OrderStatus = "working" | "filled" | "cancelled" | "rejected";

export type Order = {
  id: string;
  accountId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  notionalUsd: number;
  leverage: number;
  limitPrice: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
  status: OrderStatus;
  createdAt: number;
  filledAt: number | null;
  fillPrice: number | null;
  cancelledAt: number | null;
  /** Why it was cancelled / rejected ("Cancelled by you", "Account breached", …). */
  note: string | null;
};

/**
 * - `open`/`increase`/`reduce`/`close`/`flip`: from an order.
 * - `take_profit`/`stop_loss`: attached exits.
 * - `manual_close`: closePosition.
 * - `breach`/`violation`/`inactivity`: forced closes.
 * - `adjustment`: test-controls balance adjustment.
 */
export type FillKind =
  | "open"
  | "increase"
  | "reduce"
  | "close"
  | "flip"
  | "take_profit"
  | "stop_loss"
  | "manual_close"
  | "breach"
  | "violation"
  | "inactivity"
  | "adjustment";

export type Fill = {
  id: string;
  accountId: string;
  orderId: string | null;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  notionalUsd: number;
  /** Realized P&L booked by this fill (0 for opens). */
  realizedPnl: number;
  kind: FillKind;
  at: number;
};

// ── payments ───────────────────────────────────────────────────────────────

export type DepositSource = "propfund_wallet" | "connected_wallet" | "external";

/**
 * Waiting for deposit → Confirming (n of N) → Confirmed → account created.
 * `underpaid`: received less than due (credited to deposit balance).
 * `expired`: superseded by a newer checkout.
 */
export type DepositStatus = "waiting" | "confirming" | "confirmed" | "underpaid" | "expired";

export type Deposit = {
  id: string;
  userId: string;
  packageId: PackageId;
  pricing: PricingKind;
  /** Package price (full or rebuy fee). */
  priceUsd: number;
  creditAppliedUsd: number;
  /** priceUsd − creditAppliedUsd. */
  amountDueUsd: number;
  chain: ChainId;
  token: TokenSymbol;
  source: DepositSource;
  address: string;
  status: DepositStatus;
  confirmations: number;
  requiredConfirmations: number;
  amountReceivedUsd: number | null;
  txHash: string | null;
  createdAt: number;
  /** When the transfer was seen on chain (confirmations count from here). */
  confirmingSince: number | null;
  confirmedAt: number | null;
  paymentId: string;
  accountId: string | null;
};

export type PaymentMethod = "card" | "crypto" | "credit";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled";

export type Payment = {
  id: string;
  userId: string;
  method: PaymentMethod;
  packageId: PackageId;
  pricing: PricingKind;
  priceUsd: number;
  creditAppliedUsd: number;
  /** Charged by card or crypto (priceUsd − credit). */
  amountUsd: number;
  status: PaymentStatus;
  createdAt: number;
  completedAt: number | null;
  depositId: string | null;
  accountId: string | null;
  failureReason: string | null;
  /** Always true in build mode. */
  testMode: boolean;
};

/** Card checkout session. The hosted page is simulated in build mode. */
export type CardCheckout = {
  id: string;
  paymentId: string;
  packageId: PackageId;
  pricing: PricingKind;
  priceUsd: number;
  creditAppliedUsd: number;
  amountUsd: number;
  status: PaymentStatus;
  createdAt: number;
  testMode: true;
};

export type WalletBalance = {
  chain: ChainId;
  token: TokenSymbol;
  amount: number;
};

export type Wallet = {
  /** The Propfund wallet address. */
  address: string | null;
  depositAddress: string;
  balances: WalletBalance[];
  depositCreditUsd: number;
};

// ── payouts ────────────────────────────────────────────────────────────────

export type PayoutStatus = "under_review" | "paid" | "voided" | "returned";

export type Payout = {
  id: string;
  userId: string;
  accountId: string;
  /** P: 100% of realized profit at request. */
  profitUsd: number;
  /** 0.80·P */
  traderUsd: number;
  /** 0.20·P */
  propfundUsd: number;
  /** USDC on Arbitrum. */
  address: string;
  /** True when the address is not the Propfund wallet. */
  customAddress: boolean;
  baselineBefore: number;
  baselineAfter: number;
  status: PayoutStatus;
  requestedAt: number;
  /** requestedAt + 7 calendar days. */
  paysAt: number;
  paidAt: number | null;
  txHash: string | null;
  voidedAt: number | null;
  returnedAt: number | null;
  note: string | null;
};

// ── engine events / screens ────────────────────────────────────────────────

export type RebuyOffer = {
  unlockedAt: number;
  fromAccountId: string;
  discountPct: 20;
};

/** A takeover screen the terminal should show (PRD §7, §8, §9). */
export type Takeover =
  | { kind: "breach"; accountId: string; at: number }
  | { kind: "graduation"; challengeAccountId: string; fundedAccountId: string; at: number }
  | { kind: "violation"; code: ViolationCode; reason: string; voidedUsd: number; at: number };

// ── derived metrics ────────────────────────────────────────────────────────

export type MeterTone = "neutral" | "amber" | "red";

export type LimitMeter = {
  /** Dollar size of the limit (0.03·B or 0.05·B). */
  limit: number;
  /** Equity at or below this level breaches. */
  breachAt: number;
  /** Dollars of the limit used so far. */
  usedUsd: number;
  /** 0–1 */
  used: number;
  /** Dollars left before breach (≥ 0). */
  remainingUsd: number;
  tone: MeterTone;
};

export type AccountMetrics = {
  accountId: string;
  phase: Phase;
  status: AccountStatus;
  baseline: number;
  balance: number;
  equity: number;
  unrealizedPnl: number;
  sod: number;
  /** equity − SOD */
  todayPnl: number;
  /** equity − B */
  totalPnl: number;
  /** balance − B */
  realizedProfit: number;
  daily: LimitMeter;
  max: LimitMeter;
  /** Challenge only. */
  target: { level: number; progress: number; reached: boolean } | null;
  marginUsedUsd: number;
  freeMarginUsd: number;
  /** freeMargin × max leverage (10×). */
  buyingPowerUsd: number;
  openPositions: number;
  workingOrders: number;
  flat: boolean;
  /** "Target reached. Close positions and cancel orders to graduate." */
  showTargetBanner: boolean;
};
