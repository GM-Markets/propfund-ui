# Propfund PRD

Version 5 · 15 Sep 2026 · **Single source of truth.** It replaces `propfund-io-PRD.docx` (Aug 2026) and the challenge lifecycle spec v4. If code, copy or docs disagree with this file, this file wins.

## 1. Product

Propfund is a one-step prop trading challenge. A trader signs in, pays for one of five challenge packages, and trades a simulated account in the Propfund terminal. If the trader breaches a loss limit, the account closes and a 20%-off rebuy is offered. If the trader reaches +10%, the account graduates to a funded account. On a funded account the trader requests payouts of realized profit: 80% to the trader, 20% to Propfund, paid in USDC on Arbitrum 7 days after the request.

- **Name:** Propfund. No other brand, product, vendor or venue names appear in user-facing copy (site, app, help, legal). Vendors are described by role: "authentication provider", "card payment processor", "identity verification provider".
- **No free trial.** Every account starts with a paid fee.
- **No scaling plan.**
- **No algorithmic trading.** No API keys, no public trading API, no webhooks for traders.
- **Identity verification (KYC) only at the first payout request.** Never at sign-in, deposit, checkout or while trading.
- **Build mode (v1):** a complete front end running on a local mock service (§12). Sign-in is real (Privy). Every other flow is simulated in the browser and marked as test mode where money would move.

## 1a. Brand

- **Logo:** a rounded tile carrying two googly eyes that glance left, beside the wordmark **propfund**, whose "o" is a third eye. On the domain lockup, both o's of `propfund.io` are eyes. The tile alone is the favicon, the app mark and the default avatar; the eyes alone carry loaders and empty states.
- **Palette** (the logo's own colours, used across the site and the app):

| Token | Value | Used for |
|---|---|---|
| Ink | `#141413` | App and site canvas |
| Paper | `#f8f1f5` | Text on ink; light sections |
| Lilac | `#c9b6ff` | Primary buttons, links, focus rings |
| Pink | `#d997d2` | Secondary accent, charts, ambient glow |
| Sky | `#a8ddff` | Third accent, charts |
| Tile gradient | pink → lilac → sky, 115° | The mark |

- Buy stays green and sell stays red in the terminal: they are trading conventions, not brand colours.
- Tokens live in `app/globals.css` (app) and `app/propfund-marketing.css` (public site). Nothing hard-codes a brand colour outside `lib/brand.ts`.

## 2. Sign-in

- Privy is the only sign-in method. Email/password accounts, password reset and email-OTP pages from the inherited starter are removed.
- Methods: **email code, Google, external wallet** (MetaMask, Coinbase Wallet, WalletConnect, Rabby and similar injected wallets).
- Every user gets a Privy **embedded wallet** (EVM), created on first sign-in if they don't already have one.
- The user's Privy ID is the account key for all Propfund data.
- Signing in never asks for identity documents.
- UI copy: "Sign in". Methods read "Continue with email", "Continue with Google", "Continue with wallet". The embedded wallet is called "your Propfund wallet".
- Signed-out users visiting any `/dashboard` route see the sign-in modal; they are not bounced to a separate page.

## 3. Packages and fees

Five packages. Same rules at every size.

**Fee:** `round(0.01 × account size) − 1` · **Rebuy fee:** `round(0.008 × account size) − 1`

| Package | Account size | Fee | Rebuy fee | Daily loss limit (3%) | Max loss limit (5%) | Target (10%) |
|---|---|---|---|---|---|---|
| Starter | $5,000 | $49 | $39 | $150 | $250 | $500 |
| Core | $10,000 | $99 | $79 | $300 | $500 | $1,000 |
| Plus | $25,000 | $249 | $199 | $750 | $1,250 | $2,500 |
| Pro | $50,000 | $499 | $399 | $1,500 | $2,500 | $5,000 |
| Elite | $100,000 | $999 | $799 | $3,000 | $5,000 | $10,000 |

## 4. Paying for a challenge (deposits)

The trader pays the fee with a stablecoin deposit or by card.

**Stablecoin deposit**

| Chain | Tokens |
|---|---|
| Arbitrum | USDC, USDT |
| Ethereum | USDC, USDT |
| Base | USDC, USDT |
| BNB Chain | USDC, USDT |

- 1 USDC = 1 USDT = $1 for fee purposes. The deposit must cover the fee exactly or more. Any amount over the fee is credited back as a deposit balance usable for the next purchase. It is not withdrawable in v1.
- Two ways to deposit:
  1. **From the Propfund wallet or a connected wallet:** pick chain and token, confirm the transfer in the wallet.
  2. **Send from anywhere:** the trader gets a per-user deposit address (same EVM address on all four chains), a QR code, the exact amount, and the warning "Send only USDC or USDT on Arbitrum, Ethereum, Base or BNB Chain. Other tokens or chains can be lost."
- Status: Waiting for deposit → Confirming (n of N confirmations) → Confirmed → account created. Required confirmations: Arbitrum 1, Base 1, Ethereum 12, BNB Chain 15.
- The deposit screen shows the network fee is paid by the sender.

**Card**
- "Pay by card" opens the card processor's hosted checkout. Propfund never renders card number fields itself.
- The account is created when the payment succeeds.

**Both methods**
- The trader must tick "I agree to the Trading Rules and Terms" before paying.
- Restricted countries are blocked at checkout by IP.
- One active account (challenge or funded) per user. Checkout is disabled while one exists: "You already have an active account."
- Fees are non-refundable, including after a breach or violation.

## 5. Definitions

- **Baseline (B):** the reference value for the max loss limit and target. Set to the account size at purchase and reset at each payout (§8).
- **Balance:** cash after closed trades and payouts.
- **Equity:** balance + unrealized P&L on open positions. Every limit check uses equity and runs on every price tick.
- **Day:** 00:00:00 to 23:59:59 UTC.
- **Start-of-day reference (SOD):** balance at 00:00 UTC, less any payout debited later that same day.
- **Flat:** no open positions and no working orders.

## 6. Account states

```
            payment confirmed            equity ≥ 1.10·B and flat
 [none] ───────────────▶ CHALLENGE ─────────────────────────────▶ FUNDED
                            │                                       │   ▲
               breach (§7)  │                          breach (§7)  │   │ payout request (§8)
                            ▼                                       ▼   │ resets B, stays FUNDED
                        BREACHED ◀──────────────────────────────── BREACHED
                            │
                            │ rebuy at the rebuy fee (§3)
                            ▼
                        CHALLENGE (new account)

 CHALLENGE or FUNDED ── violation confirmed (§9) ──▶ TERMINATED (no rebuy, payouts voided, user barred)
```

## 7. Loss limits and breach (both phases)

| Rule | Breach condition | Example: Elite, B = $100,000 |
|---|---|---|
| Daily loss | equity ≤ SOD − 0.03·B | SOD $101,200 → breach at $98,200 |
| Max loss | equity ≤ 0.95·B | breach at $95,000, however much profit came before |

- The daily limit in dollars is fixed at 3% of B and counts down from SOD. The max loss limit is a fixed floor that never trails.
- **On breach:** every position closes at the current mark and all orders cancel. The account becomes read-only. The breach is final, even if price gaps through the limit.
- **Breach screen:** a takeover over the terminal. It shows the rule hit, the time, equity at breach and the limit, the account's equity curve and stats, and the button "Start a new challenge · 20% off".
- **Warnings:** each limit meter is neutral below 70% used, amber at 70% or more, and red at 90% or more. No modal before a breach.
- **Rebuy:** a breach in either phase unlocks the rebuy fee on any package. The rebuy fee is the same every time (it doesn't compound), and the offer stays open until the next purchase. Checkout shows the full fee struck through, the rebuy fee and "Rebuy discount: 20% off". There is no rebuy after a violation termination.

## 8. Graduation, funded account and payouts

**Graduation**
- Condition: equity ≥ 1.10·B **and** the account is flat. If equity reaches the target while positions or orders are open, a banner reads "Target reached. Close positions and cancel orders to graduate."
- Graduation also needs a clean violation check.
- **Graduation screen:** shows the funded account size, the payout rules and "Go to funded account".
- Challenge profit is not paid out. The funded account opens at the package size with B = package size.
- There is no time limit and no minimum number of trading days. An account with no trade in 60 days is closed for inactivity.

**Identity verification**
- Required once, as the first step of the first payout request. Later payouts reuse it.
- Checks: government ID, selfie liveness, sanctions and PEP screening, country of residence.
- Statuses: Not started → In review → Verified, or Needs more info (the trader resubmits), or Rejected.
- **Ordinary rejection:** the trader can retry. The funded account keeps trading, but can't request a payout until verification passes.
- **Rejection for a restricted or sanctioned person, or an identity already used on another profile:** handled as a violation (§9: V8, V7 or V3).
- The 7-day payout clock starts when the request is submitted.

**Payout request**
- Allowed only when all of these hold:
  - the account is funded
  - identity is verified
  - the account is flat
  - realized profit (balance − B) is at least $50
  - no other payout is under review
- The amount is always 100% of realized profit.
- **Payout address:** USDC on **Arbitrum**. The default is the trader's Propfund wallet. The trader may enter another Arbitrum address, which is confirmed with an "I control this address on Arbitrum" checkbox and is locked for that request.
- On submit (day D):
  1. The balance is debited by profit P. The trader is owed 0.80·P; Propfund keeps 0.20·P.
  2. B resets to the new balance.
  3. SOD drops by P.
  4. The status becomes **Under review · pays DD MMM** (D + 7 calendar days).
- Trading continues during review, and those trades are reviewed too. A breach during review doesn't cancel the payout; a confirmed violation does.

| Status | Meaning | Balance effect |
|---|---|---|
| Under review | D to D+7, violation checks running | P already debited |
| Paid | Sent on D+7 in USDC on Arbitrum, tx hash linked to arbiscan.io | none |
| Voided | Violation confirmed (§9) | P forfeited |
| Returned | Non-violation failure (e.g. address rejected) | P credited back; the trader requests again |

## 9. Account violations

Checked on every account, and in full during each payout review and before graduation.

| # | Violation | Covers |
|---|---|---|
| V1 | Algorithmic or automated trading | Bots, expert advisors, scripts, API order placement, macros, auto-clickers, browser automation. Every order is placed by hand in the terminal. |
| V2 | Wash / cross-account hedging | Opposite positions in the same instrument across accounts the trader controls, family or friends' accounts, or coordinated with other traders. |
| V3 | Multiple identities | More than one profile per person, or the same device, IP, wallet, payment method or verified identity behind different profiles. |
| V4 | Copy and signal trading | Mirroring another trader, trade copiers, paid signal groups, coordinated group trading. |
| V5 | Account sharing or paid passing | Anyone else logging in or trading; paying someone to pass or manage the account. |
| V6 | Exploiting the platform | Stale or wrong prices, latency arbitrage, deliberately exploiting bugs. |
| V7 | Payment abuse | Card chargebacks or disputes, stolen cards or wallets, funds linked to sanctioned addresses. |
| V8 | Restricted access | A restricted jurisdiction, or a VPN or proxy used to hide location. |

- **Allowed:** manual trading, news trading, holding overnight or over a weekend while the market is open.
- **If a violation is confirmed:**
  - every payout under review is voided and the profit forfeited
  - all of the user's accounts are terminated
  - fees are not refunded
  - no rebuy is offered
  - the user is barred from buying again
  - payouts already paid are not reversed on-chain; recovery is handled under the Terms
- **Violation screen:** a takeover showing the violation code, a plain-language reason, the voided amount and the appeal contact. It has no rebuy button.

## 10. App screens (`/dashboard`)

Navigation: **Overview · Challenges · Terminal · Payouts · Wallet · History**. The header shows the phase badge, equity, and an account menu (Propfund wallet address with copy, sign out).

1. **Overview:** the active account card (package, phase, equity, P&L, both limit meters, target progress), the rebuy offer if one is open, the payout under review if any, and a list of recent accounts.
2. **Challenges:** five package cards showing size, fee (or the struck-through fee plus rebuy fee), limits and target. Includes a short rules summary and the checkout sheet described in §4.
3. **Terminal:** the GM Markets-style layout.
   - Desktop, top to bottom: the account strip (phase, equity, today's P&L, total P&L vs B, daily-loss meter, max-loss meter, target progress on challenge accounts), then a four-pane row (markets list · price header and chart · order book and recent trades · order form), then bottom tabs Positions / Orders / Trade history.
   - Order form: Buy/Sell toggle, Market or Limit, size in USD notional with 25/50/75/100% chips of buying power, leverage up to 10×, and optional take-profit and stop-loss.
   - Mobile stack order: (1) account strip; (2) price header and chart; (3) sticky Buy/Sell bar that opens the order sheet; (4) tabs; (5) order book and markets behind a switcher.
   - Breach, graduation and violation screens appear over the terminal.
4. **Payouts:** the identity step when it's needed; the request sheet (profit, 80/20 split, new baseline and limits, Arbitrum payout address, pay date, review note, confirm); the under-review card ("Day 3 of 7 · pays Tue 22 Sep"); history with statuses and Arbiscan links.
5. **Wallet:** the Propfund wallet address, and USDC/USDT balances on the four chains, with a chain switcher. Deposit history (chain, token, amount, tx hash linked to that chain's explorer, status). Payment history (card and crypto).
6. **History:** every account with package, fee paid, outcome (Active / Graduated / Breached / Terminated / Closed for inactivity), dates, and a read-only statement.

Every async section shows a skeleton that matches its final size, and a route change shows a top progress bar. No layout shift when data loads.

## 11. Public site

- **Pages:** Home, How it works, Pricing, Rules, Forex, Crypto, Equities, Commodities, **Transparency**, Help, Terms, Privacy, Refunds.
- **Header CTA:** "Start challenge" (opens sign-in, then goes to Challenges).
- **Help** (`/help`, which replaces the developer docs): Getting started, Sign-in and wallet, Paying for a challenge, Challenge rules, Funded account, Payouts and identity verification, Violations, FAQ. The inherited developer docs (API reference, OAuth, API keys, webhooks, quickstart) are removed.

**Transparency page (`/transparency`)**

The layout follows propr.xyz/transparency. The content is Propfund's own.

- Hero "Transparency" with the descriptor "Challenge, payout and treasury figures, updated daily."
- Sticky left section nav on desktop. On mobile it becomes a horizontally scrolling chip row, the only horizontal scroll allowed on the page.
- **Overview:** stat cards for challenge fee revenue (lifetime), annualized run rate (last 30 days excl. today), total payouts (lifetime), largest single payout, median time to pay (request to payment), active traders (30 days), paying traders, funded traders, funded capital, pass rate, and payouts as a share of fee revenue.
- **Activity:** traders over time with a 7d / 30d / 90d / All switch.
- **Revenue:** daily and cumulative fee revenue, split by package.
- **Challenges:** pass rate over time; breaches split by daily vs max loss limit; purchases by package.
- **Trading:** daily notional volume, trade count, share of volume by asset class.
- **Funded:** funded traders and funded capital over time.
- **Payouts:** daily and cumulative payouts. A table of recent payouts shows date, an anonymized trader ID (e.g. `T-4F2A`), amount, and an Arbiscan tx link.
- **Risk:** hedging P&L realized and unrealized, and the share of payouts covered by hedging. No venue name.
- **Addresses:** the Arbitrum payout wallet and the treasury addresses on each deposit chain, each with a copy button and an explorer link.
- **Data rule:** real figures only once live. In build mode the page shows sample data with a visible "Sample data" badge on the hero and on every chart. Addresses that haven't been provided show "Published at launch", never an invented address.

## 12. Build mode: mock service

- All app data lives in a local mock service in the browser, keyed by Privy user ID and saved in `localStorage`. It exposes async functions shaped like future API calls, so a real backend can replace it without UI changes.
- **Simulated prices:** a random walk for 12 markets: BTC, ETH, SOL, XRP, EUR/USD, GBP/USD, USD/JPY, XAU/USD, WTI, NVDA, AAPL, TSLA.
- **Order execution:** market orders fill at the mark; limit orders fill when price crosses. Take-profit and stop-loss are evaluated every tick.
- **Rules:** the engine applies §5–§9 exactly. The rules logic is pure and unit-tested.
- **Card and crypto payments:** simulated, labelled "Test mode". The card path never shows card number fields. The crypto path shows the flow and completes after simulated confirmations.
- **Identity verification:** simulated, labelled "Test mode".
- **Test controls:** a drawer for design review and QA, shown only when `NEXT_PUBLIC_TEST_CONTROLS=true` and never in production builds. It can:
  - move prices up or down
  - jump to a daily breach, a max breach or the target
  - advance the clock to 00:00 UTC, by 1 day, or by 7 days
  - approve, request more info on, or reject identity verification
  - confirm a deposit
  - flag a violation
  - return a payout
  - reset all data

## 13. Settings

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID (required for sign-in) |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | Privy client ID (optional) |
| `NEXT_PUBLIC_TEST_CONTROLS` | `true` shows the test controls drawer (never set in production) |
| `NEXT_PUBLIC_PAYOUT_WALLET_ARBITRUM` | Published payout wallet (transparency page) |
| `NEXT_PUBLIC_TREASURY_ADDRESSES` | JSON map of chain → treasury address (transparency page) |
