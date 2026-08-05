# Vanta Starter

[![CI](https://github.com/taoshidev/vanta-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/taoshidev/vanta-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

A production-grade **Next.js 15 (TypeScript)** reference app that shows how to
build a complete trading product on top of
**hyperscaled-api `/v2`** — the multi-tenant platform that
exposes Vanta network onboarding, Stripe checkout, Sumsub KYC, Stripe Connect
payouts, and trading behind a single OAuth2-authenticated REST API.

This is the canonical example for external developers. **Fork it, brand it,
ship it.**

> New here? The fastest path is: run `hyperscaled-api` locally → request app
> credentials → drop them into `.env.local` → `pnpm dev`. The
> [Quickstart](#quickstart) below walks through every step.

## Table of contents

- [What you get](#what-you-get)
- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Get your API credentials](#get-your-api-credentials)
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

- **Full onboarding funnel** — signup → email OTP → KYC → checkout →
  subaccount provisioning → trade.
- **Stripe Payment Intents** (challenge / funded purchase) with idempotent
  provisioning.
- **Stripe Connect Express** linking + payout requests, with live payout
  estimates.
- **Sumsub KYC** integration via the WebSDK.
- **Trading terminal** — submit, close, bulk-close, edit, TP/SL, cancel.
- **Live positions/orders** via Server-Sent Events.
- **Self-service API access** — a `/request-access` flow that lets new
  developers request their own app credentials.
- **In-app docs** at `/docs` — an interactive API reference with runnable
  examples.
- **Webhook consumer example** with signature verification.
- **Re-skinnable UI** built on Tailwind + Radix-style primitives.

## How it works

```text
Browser
   │
   ▼
Next.js (this app)
   │  Server Actions = BFF layer holding the partner OAuth client_id/secret
   ▼
hyperscaled-api /v2
   │
   ▼
vanta-network (entity miner, validator), Stripe, Sumsub
```

The partner OAuth **client secret never reaches the browser**. Server Actions
exchange it for a short-lived bearer token, then attach the end-user's
`X-Session-Token` so each call is scoped to the logged-in trader.

- **OAuth + BFF layer:** `lib/hsc/`
- **Server Actions (the only place secrets live):** `app/actions/`
- **Route handlers (webhooks, key issuance):** `app/api/`

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org) | `20+` | See [`.nvmrc`](./.nvmrc). `nvm use` picks it up. |
| [pnpm](https://pnpm.io) | `11.16.0` | `corepack prepare pnpm@11.16.0 --activate`. npm / yarn / bun also work. |
| **hyperscaled-api** | running | The platform API this app talks to — local (`http://localhost:8000`) or the hosted deployment at [staging.api.vantanetwork.io](https://api.staging.vantanetwork.io/docs). |
| Stripe test keys | optional | Only needed to exercise the checkout UI. |

You do **not** need Postgres, Redis, Stripe, or Sumsub locally — those are owned
by `hyperscaled-api`. This app only needs Node and a reachable API.

## Get your API credentials

Every app authenticates to `hyperscaled-api` with an OAuth `client_id` /
`client_secret` pair. There are two ways to obtain them:

1. **Self-service (recommended for developers).** Run this starter, open
   [`/request-access`](http://localhost:3000/request-access), and submit your
   app details. An operator approves the request and you receive a **one-time
   claim link** that reveals your `client_id` / `client_secret` exactly once.
   Store them in your secret manager immediately.
2. **Operator-issued.** Whoever runs the platform can mint credentials directly
   from the `hyperscaled-api` admin console, or via its CLI:

   ```bash
   # run from the hyperscaled-api repo
   python scripts/register_app.py \
     --name "My Partner App" \
     --slug my-partner \
     --entity-hotkey 5Grwva... \
     --network-api-key k_live_xxx
   ```

Either way you end up with an `HSC_CLIENT_ID` and `HSC_CLIENT_SECRET` to put in
`.env.local`.

## Quickstart

```bash
# 1) Install dependencies
pnpm install            # or: npm install / yarn / bun install

# 2) Configure environment
cp .env.example .env.local
# fill in HSC_CLIENT_ID / HSC_CLIENT_SECRET (see "Get your API credentials")
# and set a 32+ char SESSION_COOKIE_SECRET

# 3) Run the dev server
pnpm dev
# open http://localhost:3000
```

Generate a strong session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Running the full stack locally

This app needs a reachable `hyperscaled-api`. In a separate terminal:

```bash
# in ../hyperscaled-api
docker compose up -d          # Postgres + Redis
cp .env.example .env          # then fill in secrets
alembic -c alembic.ini upgrade head
uvicorn hyperscaled_api.main:app --reload
```

Point this app at it with `HSC_API_BASE_URL=http://localhost:8000` (the default
in `.env.example`).

## Environment variables

Copy [`.env.example`](./.env.example) to `.env.local` and fill it in. Anything
prefixed `NEXT_PUBLIC_` is exposed to the browser — never put a secret there.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HSC_API_BASE_URL` | ✅ | `http://localhost:8000` | Base URL of `hyperscaled-api`. |
| `HSC_CLIENT_ID` | ✅ | — | Your app's OAuth client id. |
| `HSC_CLIENT_SECRET` | ✅ | — | Your app's OAuth client secret. **Server-only.** |
| `HSC_SCOPE` | — | `api` | OAuth scope requested at the token endpoint. |
| `SESSION_COOKIE_SECRET` | ✅ | — | 32+ byte random string used to sign the end-user session cookie. |
| `SESSION_COOKIE_NAME` | — | `hsc_starter_session` | Name of the session cookie. |
| `NEXT_PUBLIC_SITE_URL` | — | `http://localhost:3000` | Public site origin used to resolve canonical social metadata URLs. |
| `NEXT_PUBLIC_HSC_API_BASE_URL` | ✅ | `http://localhost:8000` | API base URL used by browser-side widgets. |
| `NEXT_PUBLIC_APP_NAME` | — | `Vanta Starter` | Display name shown in the UI. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — | — | Stripe publishable key for the checkout UI. |
| `HSC_WEBHOOK_SECRET` | — | — | Shared secret to verify inbound webhooks in `app/api/hsc-webhook`. |

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
  actions/              Server Actions — the BFF layer (holds OAuth secret)
  api/                  Route handlers (hsc-webhook consumer, api-keys, webhooks)
lib/
  hsc/                  Typed API client, OAuth token exchange, config
  docs/                 API catalog + docs navigation data
  errors.ts             API error → friendly message mapping
  session.ts            Signed session cookie helpers
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
   in your host's secret manager. **Never** ship `HSC_CLIENT_SECRET` or
   `SESSION_COOKIE_SECRET` to the client.
2. Build and start:

   ```bash
   pnpm build
   pnpm start
   ```

3. Point `HSC_API_BASE_URL` / `NEXT_PUBLIC_HSC_API_BASE_URL` at your deployed
   `hyperscaled-api`, and update Stripe Connect return/refresh URLs on the API
   side to your deployed origin.

## Branding & theming

The UI is themed with design tokens (HSL CSS variables) in `app/globals.css`
and Tailwind config, with the logo/wordmark in `components/brand.tsx`. Re-skin
by editing those tokens — every component reads from them, so a palette swap
propagates across the whole app.

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| `fetch failed` / `ECONNREFUSED` on login | `hyperscaled-api` isn't running or `HSC_API_BASE_URL` is wrong. |
| `401`/`invalid_client` at startup | `HSC_CLIENT_ID` / `HSC_CLIENT_SECRET` are wrong or for a different environment. |
| Session won't persist / logged out instantly | `SESSION_COOKIE_SECRET` is missing or shorter than 32 bytes. |
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
