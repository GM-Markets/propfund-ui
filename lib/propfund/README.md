# lib/propfund: app foundation API

Everything a dashboard screen needs: sign-in, live data hooks, mutations, pure
rules and display helpers. Read this plus `docs/PRD.md`; you should not need to
open the mock service internals.

```text
lib/propfund/
  config.ts        env access (never read process.env in components)
  auth.tsx         useAuth()
  hooks.ts         data hooks + actions (client components only)
  types.ts         domain model
  rules/           pure PRD rules + copy constants (import from "@/lib/propfund/rules")
  markets.ts       the 12 markets
  format.ts        money, %, price, address, UTC date helpers
  mock/            local mock service (service.ts, engine.ts, prices.ts, store.ts, test-controls.ts)
```

## Conventions

- Hooks return **`undefined` while loading** (render a skeleton with final
  dimensions), **`null` for "none"**, else the value. SSR and hydration always
  see `undefined`, so there's no flicker.
- The dashboard layout only renders pages once the user is signed in **and**
  their data is loaded, so on dashboard pages `undefined` is brief; still handle it.
- Mutations are async and throw `ServiceError` (`code` + user-facing `message`).
  Show `error.message` in a toast or inline. Hooks update on their own after a
  mutation; never refetch.
- No fetch in components, no `useEffect` data loading, no `process.env`.
- Money is USD numbers; timestamps are epoch ms; all day logic is UTC and uses
  the **mock clock** (`useNow()`), which test controls can advance.
- User-facing copy never names vendors or venues. Simulated money flows are
  labelled "Test mode".

## Sign-in: `@/lib/propfund/auth`

```ts
const { mode, ready, authenticated, user, signIn, signOut } = useAuth();
// mode: "privy" | "test" | "unconfigured"
// user: { id, email?, walletAddress? } | null   walletAddress = "your Propfund wallet"
signIn();                                      // opens the sign-in dialog
signIn({ redirectTo: "/dashboard/challenges" }); // e.g. public "Start challenge" CTA
await signOut();
```

`app/providers.tsx` mounts the provider, the global sign-in dialog and the
route progress bar. For a programmatic `router.push`, call
`startRouteProgress()` from `@/components/top-progress-bar` first.

## Hooks: `@/lib/propfund/hooks`

| Hook | Returns |
|---|---|
| `useServiceStatus()` | `"loading" \| "ready" \| "signed_out"` |
| `useNow(intervalMs = 1000)` | mock-clock ms (re-renders on interval and clock jumps) |
| `useUser()` | `User` (depositAddress, depositCreditUsd, barred…) |
| `useAccounts()` | `Account[]` newest first |
| `useAccount(id)` | `Account \| null` |
| `useActiveAccount()` | the one active account (challenge or funded) `\| null` |
| `useCurrentAccount()` | active account, else the most recent one (breached/terminated stays visible) |
| `useAccountMetrics(accountId?)` | `AccountMetrics` live on every tick (default: current account) |
| `usePositions(accountId?)` | `Position[]` |
| `useLivePositions(accountId?)` | `Position & { mark, unrealizedPnl, notionalUsd }` per tick |
| `useOrders(accountId?)` | `Order[]` newest first, all statuses (`status === "working"` = open orders) |
| `useFills(accountId?)` | `Fill[]` newest first (trade history) |
| `useTakeover()` | `Takeover \| null`: breach / graduation / violation screen to show |
| `useRebuyOffer()` | `RebuyOffer \| null` |
| `usePayouts()` / `usePayoutUnderReview()` | `Payout[]` / `Payout \| null` |
| `useKyc()` | `Kyc` |
| `useWallet()` | `Wallet` (Propfund wallet address, deposit address, balances per chain/token, deposit credit) |
| `useDeposits()` / `useDeposit(id)` | `Deposit[]` / `Deposit \| null` (watch confirmations live) |
| `useCardCheckout(id)` | `CardCheckout \| null` |
| `usePayments()` | `Payment[]` (card, crypto, credit) |
| `useMarkets()` | static `Market[]` (12) |
| `useQuotes()` | `Quote[]` for all markets, per tick |
| `usePrices(symbol)` | `{ market, quote }` per tick |
| `useCandles(symbol, "1m" \| "5m" \| "15m" \| "1h")` | `Candle[]` (time in UTC **seconds**); `setData` once, then `update(last)` |
| `useOrderBook(symbol)` | `{ bids, asks (10 levels: price, size, total), spread }` |
| `useRecentTrades(symbol)` | `Trade[]` newest first (≤ 40) |
| `useAction(fn)` | `{ run, pending, error, reset }` wrapper for any action |

`AccountMetrics`: `equity, balance, unrealizedPnl, sod, todayPnl (equity − SOD),
totalPnl (equity − B), realizedProfit (balance − B), baseline,
daily/max: { limit, breachAt, usedUsd, used 0–1, remainingUsd, tone: "neutral"|"amber"|"red" },
target: { level, progress 0–1, reached } | null (funded), marginUsedUsd,
freeMarginUsd, buyingPowerUsd (at 10×), openPositions, workingOrders, flat,
showTargetBanner`.

Buying power for the order form at a chosen leverage: `buyingPower(metrics.freeMarginUsd, leverage)` from rules;
size chips `SIZE_CHIPS = [0.25, 0.5, 0.75, 1]`.

## Actions: `actions` from `@/lib/propfund/hooks` (same functions as `@/lib/propfund/mock`)

Every call has 120–380 ms simulated latency and acts as the signed-in user.

**Checkout (PRD §4)**

| Function | Notes |
|---|---|
| `getCheckoutQuote(packageId)` | `{ package, pricing, fullFee, rebuyFee, price, discountLabel, creditAppliedUsd, amountDueUsd, blocked }`. `blocked.code`: `ACTIVE_ACCOUNT_EXISTS` ("You already have an active account."), `BARRED`, `RESTRICTED_REGION` |
| `createCryptoDeposit({ packageId, chain, token, source, agreedToTerms })` | `source`: `"propfund_wallet"` (debits wallet balance, goes straight to Confirming), `"connected_wallet"` (Confirming), `"external"` (Waiting for a transfer to `deposit.address`). Supersedes older waiting deposits |
| `simulateDepositConfirmations(depositId, { amountUsd? })` | delivers the transfer for an `external` deposit; confirmations then tick up live (Arbitrum/Base 1, Ethereum 12, BNB 15) and the account is created on Confirmed. Overpayment → `user.depositCreditUsd`; underpayment → status `underpaid`, amount credited |
| `waitForDeposit(depositId)` | resolves when confirmed / underpaid / expired |
| `createCardCheckout({ packageId, agreedToTerms })` | simulated hosted checkout (never render card fields) |
| `completeTestCardPayment(checkoutId, "succeeded" \| "failed" \| "cancelled")` | `{ checkout, payment, account }` |
| `purchaseWithCredit({ packageId, agreedToTerms })` | when `amountDueUsd === 0` |

Errors: `TERMS_NOT_ACCEPTED`, `ACTIVE_ACCOUNT_EXISTS`, `BARRED`, `RESTRICTED_REGION`,
`INSUFFICIENT_WALLET_BALANCE`, `CREDIT_COVERS_FEE`, `CREDIT_INSUFFICIENT`.
Any purchase consumes an open rebuy offer.

**Trading (PRD §7, §10.3, §12)**

| Function | Notes |
|---|---|
| `placeOrder({ symbol, side: "buy"\|"sell", type: "market"\|"limit", notionalUsd, leverage 1–10, limitPrice?, tp?, sl? })` | market fills at the mark; limit rests (`status: "working"`) until price crosses. One netted position per symbol. Errors: `VALIDATION` (min $10, TP/SL side), `INSUFFICIENT_MARGIN`, `NO_ACTIVE_ACCOUNT`, `ACCOUNT_READ_ONLY`, `BARRED` |
| `cancelOrder(orderId)` | |
| `closePosition(positionId)` | closes at the mark, returns the `Fill` |
| `updatePositionExits(positionId, { tp, sl })` | `null` clears |

The engine re-evaluates on every tick: SOD rollover at 00:00 UTC, limit fills,
TP/SL, breach (closes everything at the mark, cancels orders, account
`breached`, rebuy offer, `takeover: breach`), graduation when flat at ≥ 1.10·B
(challenge `graduated`, new funded account at B = size, `takeover: graduation`),
inactivity (60 days), paid payouts on D+7, deposit confirmations.

**Takeovers:** `dismissTakeover()` clears the current breach/graduation/violation screen.

**Accounts:** `getAccountStatement(accountId)` → `{ account, fills, orders, payouts, payment }` for History.

**Identity + payouts (PRD §8)**

| Function | Notes |
|---|---|
| `startKyc()` | only with an active funded account (first step of the first payout). → `in_review`. Error `KYC_NOT_REQUIRED` otherwise |
| `getPayoutPreview()` | `{ accountId, profitUsd, traderUsd, propfundUsd, newBaseline, newDailyLossLimit, newMaxLossLevel, paysAt, defaultAddress, blockers: {code, message}[] }` |
| `requestPayout({ accountId, address?, confirmControlsAddress? })` | default address = Propfund wallet; another address needs `confirmControlsAddress: true` ("I control this address on Arbitrum"). Debits P, B = new balance, SOD −P, `under_review`, `paysAt = D + 7d`. Error `PAYOUT_BLOCKED` (`details` = blockers) |

Blocker codes/copy: `PAYOUT_BLOCKER_COPY` in rules (`not_funded`, `not_verified`, `pending`, `not_flat`, `below_minimum`).

## Rules and copy: `@/lib/propfund/rules`

- Packages: `PACKAGES`, `getPackage(id)`, `challengeFee`, `rebuyFee`, `checkoutPrice(pkg, rebuyOpen)`, `REBUY_DISCOUNT_PCT`.
- Limits: `dailyBreachLevel(sod, B)`, `maxBreachLevel(B)`, `targetLevel(B)`, `dailyMeter`, `maxMeter`, `meterTone`, `METER_AMBER_AT` (0.7), `METER_RED_AT` (0.9), `detectBreach`.
- Time: `reviewDayLabel(requestedAt, now)` → "Day 3 of 7", `payDate`, `nextUtcMidnight`, `utcDayKey`, `INACTIVITY_DAYS`.
- Payouts: `splitProfit`, `applyPayout`, `MIN_PAYOUT_USD`, `PAYOUT_STATUS_LABEL`, `KYC_STATUS_LABEL`, `CUSTOM_ADDRESS_CONFIRM_COPY`, `arbiscanTxUrl`, `arbiscanAddressUrl`, `isEvmAddress`.
- Lifecycle: `PHASE_LABEL`, `OUTCOME_LABEL` (Active / Graduated / Breached / Terminated / Closed for inactivity), `TARGET_BANNER_COPY`, `ACTIVE_ACCOUNT_EXISTS_COPY`, `canGraduate`, `isRebuyEligible`, `newestFirst`.
- Violations: `VIOLATIONS[code] = { title, reason }`, `VIOLATION_CODES`. Appeal contact: `APPEAL_CONTACT_EMAIL` in config.
- Deposits: `CHAINS` (`{ id, name, requiredConfirmations, explorer }`), `TOKENS`, `DEFAULT_CHAIN` (arbitrum), `DEPOSIT_WARNING`, `NETWORK_FEE_NOTE`, `TERMS_CHECKBOX_COPY`, `confirmationsLabel(n, N)`, `explorerTxUrl(chain, hash)`, `explorerAddressUrl`.
- Trading: `MAX_LEVERAGE`, `MIN_ORDER_NOTIONAL_USD`, `SIZE_CHIPS`, `buyingPower`, `validateExits`, `pnlUsd`.

## Formatting: `@/lib/propfund/format`

`formatUsd(n, digits=0)`, `formatSignedUsd(n, digits=2)`, `formatPct(fraction)`,
`formatSignedPct(fraction)`, `formatPrice(price, tickSize)`, `truncateAddress`,
`formatDayDate(ms)` ("Tue 22 Sep"), `formatDate(ms)`, `formatDateTime(ms)`, `formatTime(ms)`.

## Types: `@/lib/propfund/types`

`PackageId` (`starter|core|plus|pro|elite`), `ChallengePackage`, `ChainId`
(`arbitrum|ethereum|base|bnb`), `TokenSymbol`, `Market`, `User`, `Kyc` /
`KycStatus`, `Account` (`phase`, `status`, `baseline`, `balance`, `sod`,
`breach`, `violation`, `stats`, `equityCurve`), `Position`, `Order`, `Fill`
(`kind`: open/increase/reduce/close/flip/take_profit/stop_loss/manual_close/breach/violation/inactivity/adjustment),
`Deposit` (`status`: waiting/confirming/confirmed/underpaid/expired), `Payment`,
`CardCheckout`, `Wallet`, `WalletBalance`, `Payout` (`status`:
under_review/paid/voided/returned), `RebuyOffer`, `Takeover`, `AccountMetrics`,
`LimitMeter`, `MeterTone`. Price types (`Quote`, `Candle`, `OrderBook`,
`Trade`, `Timeframe`) come from `@/lib/propfund/mock`.

## Shell and UI pieces

- `components/app-shell.tsx` renders nav, header (phase badge + equity + account
  menu) and bottom tabs. `/dashboard/terminal` is full-bleed (no gutter, no max width).
- `components/ui/sheet.tsx`: `Sheet`, `SheetContent side="right"|"bottom"|"left"`,
  `SheetHeader`, `SheetBody`, `SheetFooter`, `SheetTitle`, `SheetDescription`.
- `components/ui/dialog.tsx`: `DialogContent hideClose` for must-complete dialogs.
- `components/test-controls.tsx`: drawer mounted by the dashboard layout when enabled.

## Test controls: `@/lib/propfund/mock/test-controls`

`movePrice(symbol | "all", fraction)`, `jumpToDailyBreach()`, `jumpToMaxBreach()`,
`jumpToTarget()`, `advanceClockToMidnight()`, `advanceClockDays(n)`, `approveKyc()`,
`requestMoreKycInfo(note?)`, `rejectKyc({ violation?: "V3"|"V7"|"V8" })`,
`confirmDeposit(depositId?, amountUsd?)`, `fundWallet(chain, token, amount)`,
`setRestrictedRegion(on)`, `flagViolation(code)`, `returnPayout(payoutId?)`, `resetAllData()`.
