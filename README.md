# Propfund

Front end for **Propfund**, a one-step prop trading challenge. A trader signs in,
pays for one of five challenge packages, trades a simulated account in the
Propfund terminal, graduates to a funded account at +10% and requests payouts of
realized profit (80% to the trader, paid in USDC on Arbitrum 7 days after the
request).

The product spec is [`docs/PRD.md`](./docs/PRD.md). It is the single source of
truth; if code and the PRD disagree, the PRD wins.

## Build mode (v1)

- **Sign-in is real.** It uses the authentication provider configured with
  `NEXT_PUBLIC_PRIVY_APP_ID` (email code, Google, external wallet). Every user
  gets an embedded wallet, shown in the app as "your Propfund wallet".
- **Everything else runs on a local mock service** in the browser
  ([`lib/propfund`](./lib/propfund/README.md)): packages and fees, card and
  stablecoin checkout, simulated prices for 12 markets, order execution, loss
  limits and breach, graduation, identity verification, payouts and violations.
  Data is keyed by the sign-in user id and saved in `localStorage`. Card,
  crypto and identity flows are simulated and labelled "Test mode".
- There is no backend in this repo. The service functions are shaped like
  future API calls, so a real backend can replace them without UI changes.

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 3, Radix UI primitives + `class-variance-authority` in `components/ui`
- `lucide-react` icons, `sonner` toasts, `framer-motion`
- `@privy-io/react-auth` + `viem` chains for sign-in (loaded client-side only)
- `lightweight-charts` (terminal chart), `qrcode.react` (deposit QR)
- Vitest + Testing Library (unit), Playwright (e2e)
- pnpm 11 (`pnpm-workspace.yaml` holds `allowBuilds`)

## Quickstart

Requires Node 20+ and pnpm 11.

```bash
pnpm install
cp .env.example .env.local
pnpm dev                # http://localhost:3000
```

### Local test mode (no sign-in credentials)

Leave `NEXT_PUBLIC_PRIVY_APP_ID` empty and set:

```bash
NEXT_PUBLIC_TEST_CONTROLS=true
```

Visiting `/dashboard` then offers **Continue as test user** (labelled
"Test mode"), and a **Test controls** drawer appears in the app for design
review and QA: move prices, jump to a daily breach / max breach / target,
advance the clock (to 00:00 UTC, +1 day, +7 days), approve / request more info /
reject identity verification, confirm a deposit, flag a violation, return a
payout and reset all data. The drawer never renders in a production build.

With no app ID and test controls off, the sign-in dialog shows "Sign-in isn't
configured".

## Environment variables

Only these variables exist (PRD §13). All are public (`NEXT_PUBLIC_*`) and
inlined at build time; read them through `lib/propfund/config.ts`, never with
`process.env` in components.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Sign-in app ID (required for real sign-in) |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | Sign-in client ID (optional) |
| `NEXT_PUBLIC_TEST_CONTROLS` | `true` shows local test sign-in (when no app ID) and the test controls drawer. Never set in production |
| `NEXT_PUBLIC_PAYOUT_WALLET_ARBITRUM` | Published payout wallet (transparency page) |
| `NEXT_PUBLIC_TREASURY_ADDRESSES` | JSON map of chain → treasury address (transparency page) |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next dev server with HMR |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests (rules engine, mock service, components) |
| `pnpm test:e2e` | Playwright specs in `tests/e2e` (starts its own dev server on :3100) |

## Project structure

```text
app/
  (marketing)/          public site
  dashboard/            signed-in app: Overview, Challenges, Terminal, Payouts, Wallet, History
  providers.tsx         sign-in provider, sign-in dialog, route progress bar
components/
  ui/                   primitives (Radix + cva + Tailwind)
  app-shell.tsx         dashboard shell: sidebar, bottom tabs, header, account menu
  auth-shell.tsx        sign-in panel + dialog
  test-controls.tsx     test controls drawer
lib/propfund/
  config.ts             env access
  auth.tsx              useAuth()
  rules/                pure, unit-tested PRD rules (§3–§9)
  mock/                 local mock service, price feed, engine, test controls
  hooks.ts              React bindings for screens
  README.md             API reference for screen work
docs/PRD.md             product spec
```

## Testing

```bash
pnpm test
pnpm exec playwright install --with-deps chromium   # once
pnpm test:e2e
```

The onboarding e2e spec runs the full flow on test sign-in and is opt-in:
`E2E_RUN_ONBOARDING=1 NEXT_PUBLIC_TEST_CONTROLS=true pnpm test:e2e tests/e2e/onboarding.spec.ts`.

## Deployment

A multi-stage Docker image builds the standalone Next.js output:

```bash
cp .env.example .env    # set NEXT_PUBLIC_PRIVY_APP_ID; leave NEXT_PUBLIC_TEST_CONTROLS unset
./deploy.sh             # docker compose build + up
```

`NEXT_PUBLIC_*` values are build arguments because Next.js inlines them at
build time.

## Contributing, security, license

See [CONTRIBUTING.md](./CONTRIBUTING.md), [SECURITY.md](./SECURITY.md) and
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Licensed under the [MIT License](./LICENSE).
