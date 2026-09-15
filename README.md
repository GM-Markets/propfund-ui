# Vanta Starter

[![CI](https://github.com/taoshidev/vanta-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/taoshidev/vanta-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

A **Next.js 15 (TypeScript)** desk UI for Flo. Traders sign in with the same
**Privy** identity as GM Markets. This app stores that identity token and
sends it as `Authorization: Bearer` to the **Flo gateway** (`/van`). The
gateway verifies the JWT and proxies to Vanta. There is no app OAuth
`client_id` / `client_secret`.

> Fastest path: gateway + Vanta running → set `NEXT_PUBLIC_PRIVY_APP_ID` and
> `NEXT_PUBLIC_GATEWAY_URL` → `pnpm dev`. The [Quickstart](#quickstart) below
> walks through every step.

## Table of contents

- [What you get](#what-you-get)
- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Auth](#auth)
- [Quickstart](#quickstart)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Branding & theming](#branding--theming)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## What you get

- **Privy sign-in** — same identity as GM Markets; complimentary $10K notional
  test desk claimed on first `GET /van/v2/me`.
- **Stripe Identity KYC** and **Privy checkout** (Arbitrum USDC) for paid desks.
- **Trading terminal** — ticket, blotter, and desk poll through Vanta.
- **In-app docs** at `/docs` — gateway-prefixed curls and runnable reads.
- **Re-skinnable UI** built on Tailwind + Radix-style primitives.

## How it works

```text
Browser
   │  Privy identity token
   ▼
Next.js (this app) — httpOnly cookie
   │  Authorization: Bearer <token>
   ▼
Flo gateway /van
   │  verifies JWT, injects x-user-*
   ▼
Vanta (desk, checkout, KYC)
```

- **Gateway client:** `lib/hsc/`
- **Session cookie:** `lib/session.ts`
- **Server Actions:** `app/actions/`

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org) | `22.13+` | See [`.nvmrc`](./.nvmrc). `nvm use` picks it up. |
| [pnpm](https://pnpm.io) | `11.16.0` | `corepack prepare pnpm@11.16.0 --activate`. npm / yarn / bun also work. |
| **Flo gateway + Vanta** | running | Gateway default `http://localhost:5400`. This app calls `/van` only. |
| Privy app id | ✅ | Same app as GM Markets (`NEXT_PUBLIC_PRIVY_APP_ID`). |

This app only needs Node, Privy, and a reachable gateway.

## Auth

Sign in with Privy. The BFF copies the identity token into an httpOnly cookie
and every Vanta call is `Authorization: Bearer` to `${GATEWAY}/van`. Desk bots
use a Vanta-minted `X-Api-Key` on `/van/v2/trading/*` only.

## Quickstart

```bash
# 1) Install dependencies
pnpm install

# 2) Configure environment
cp .env.example .env.local
# set NEXT_PUBLIC_PRIVY_APP_ID (and NEXT_PUBLIC_GATEWAY_URL if not localhost:5400)

# 3) Run the gateway + Vanta, then this app
pnpm dev
# open http://localhost:3000
```

## Environment variables

Copy [`.env.example`](./.env.example) to `.env.local` and fill it in. Anything
prefixed `NEXT_PUBLIC_` is exposed to the browser — never put a secret there.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_GATEWAY_URL` | ✅ | `http://localhost:5400` | Flo gateway origin. |
| `VANTA_API_BASE_URL` | — | `{GATEWAY}/van` | BFF base URL (must be the gateway `/van` prefix). |
| `NEXT_PUBLIC_PRIVY_APP_ID` | ✅ | — | Same Privy app as GM Markets. |
| `SESSION_COOKIE_NAME` | — | `vanta_privy_session` | HttpOnly cookie holding the Privy identity token. |
| `NEXT_PUBLIC_SITE_URL` | — | `http://localhost:3000` | Public site origin. |
| `NEXT_PUBLIC_APP_NAME` | — | `PropFund` | Display name shown in the UI. |
| `VANTA_WEBHOOK_SECRET` | — | — | Shared secret to verify inbound webhooks. |

## Project structure

```text
app/
  page.tsx              Marketing landing page
  login/ signup/        Auth pages (email OTP, password reset)
  verify-email/
  reset-password/
  request-access/       Self-service "request app credentials" flow
  dashboard/            Authenticated product
    kyc/                Sumsub KYC
    checkout/           Stripe Payment Intents
    trading/            Trading terminal (SSE live data)
    payouts/            Stripe Connect + payout requests
    api-keys/           Issue/manage end-user API keys
    webhooks/           Register/manage outbound webhook endpoints
  docs/                 In-app interactive API reference
  actions/              Server Actions — BFF (Privy cookie → gateway Bearer)
  api/                  Route handlers (webhooks, api-keys)
lib/
  hsc/                  Typed gateway `/van` client + config
  docs/                 API catalog + docs navigation data
  errors.ts             API error → friendly message mapping
  session.ts            Privy identity-token cookie helpers
  utils.ts              Misc helpers (cn, etc.)
components/             UI primitives (ui/), motion, brand, forms, status
tests/                  Playwright e2e (tests/e2e/); unit tests are colocated
```

## Available scripts

| Script | What it does |
|--------|--------------|
| `pnpm dev` | Start the dev server on `http://localhost:3000`. |
| `pnpm build` | Production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint (`next lint`). |
| `pnpm typecheck` | Type-check with `tsc --noEmit`. |
| `pnpm test` | Run unit/component tests once (Vitest). |
| `pnpm test:watch` | Vitest in watch mode. |
| `pnpm test:e2e` | Run Playwright end-to-end tests. |

## Testing

Unit and component tests use [Vitest](https://vitest.dev) +
[Testing Library](https://testing-library.com) and live next to the code they
cover (`*.test.ts` / `*.test.tsx`). End-to-end tests use
[Playwright](https://playwright.dev) under `tests/e2e/`.

```bash
pnpm test            # unit + component
pnpm test:e2e        # end-to-end (spawns its own dev server on port 3100)
```

First time running e2e? Install the browsers once:

```bash
pnpm exec playwright install
```

See [`tests/e2e/README.md`](./tests/e2e/README.md) for details.

## Deployment

This is a standard Next.js app and deploys anywhere Next.js runs (Vercel,
Node server, container).

1. Set every required variable from the [environment table](#environment-variables)
   in your host's secret manager. **Never** ship the Privy identity token or
   webhook secrets to client-side bundles.
2. Build and start:

   ```bash
   pnpm build
   pnpm start
   ```

3. Point `NEXT_PUBLIC_GATEWAY_URL` at the deployed Flo gateway.

## Branding & theming

The UI is themed with design tokens (HSL CSS variables) in `app/globals.css`
and Tailwind config, with the logo/wordmark in `components/brand.tsx`. Re-skin
by editing those tokens — every component reads from them, so a palette swap
propagates across the whole app.

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| `fetch failed` / `ECONNREFUSED` on login | Gateway isn't running or `NEXT_PUBLIC_GATEWAY_URL` / `VANTA_API_BASE_URL` is wrong. |
| `401` after Privy | Gateway rejected the identity token — check Privy app id and gateway JWT verify. |
| OTP email never arrives | SMTP isn't configured on the **API** side (`V2_SMTP_*`). |
| Trades submit but positions stay empty | The API's validator read key is missing — see `hyperscaled-api` `.env`. |
| Stripe checkout button missing | Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) and
our [Code of Conduct](./CODE_OF_CONDUCT.md) before opening an issue or PR.

## Security

Found a vulnerability? Please **do not** open a public issue — follow the
process in [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © Taoshi
