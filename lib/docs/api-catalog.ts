import type { DocsOperation } from "@/app/actions/docs";

export type AuthKind =
  | "public"
  | "app"
  | "user"
  | "desk"
  | "admin"
  | "partner"
  | "partner-trader"
  | "partner-session"
  | "provider";

export const AUTH_LABEL: Record<AuthKind, string> = {
  public: "Public",
  app: "Privy Bearer",
  user: "Privy Bearer",
  desk: "X-Api-Key",
  admin: "Admin",
  partner: "Partner key",
  "partner-trader": "Partner + Trader-ID",
  "partner-session": "Partner + session",
  provider: "Provider signature",
};

export type Endpoint = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  auth: AuthKind;
  request?: string;
  response?: string;
  note?: string;
  runOp?: DocsOperation;
};

export type ApiArea = {
  id: string;
  title: string;
  description: string;
  docHref?: string;
  endpoints: Endpoint[];
};

export const API_CATALOG: ApiArea[] = [
  {
    id: "meta",
    title: "Meta & health",
    description: "Liveness, version, and the machine-readable OpenAPI spec.",
    endpoints: [
      { method: "GET", path: "/health", summary: "Liveness probe.", auth: "public", response: `{ "status": "ok" }` },
      { method: "GET", path: "/openapi.json", summary: "OpenAPI 3.1 specification.", auth: "public" },
      { method: "GET", path: "/docs", summary: "Swagger UI (interactive reference).", auth: "public" },
      { method: "GET", path: "/redoc", summary: "ReDoc reference.", auth: "public" },
    ],
  },
  {
    id: "apps",
    title: "Apps",
    description: "Tenant profile for the signed-in Privy user.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/apps/me",
        summary: "Current tenant app profile.",
        auth: "user",
        response: `{ "app_id": "app_...", "slug": "acme", "name": "Acme", "entity_hotkey": "5F...", "allowed_scopes": ["api"], "active": true }`,
        runOp: "apps.me",
      },
    ],
  },
  {
    id: "auth",
    title: "Authentication (end users)",
    description: "Sign up, verify, log in, reset passwords, and manage user MFA.",
    docHref: "/docs/authentication",
    endpoints: [
      { method: "POST", path: "/v2/auth/signup", summary: "Create a user and send an email OTP.", auth: "app", request: `{ "email": "trader@example.com", "password": "••••••••" }`, response: `{ "user_id": "usr_...", "email": "trader@example.com", "email_verified": false, "otp_sent": true }` },
      { method: "POST", path: "/v2/auth/verify-email", summary: "Verify the OTP; may return a session.", auth: "app", request: `{ "email": "trader@example.com", "code": "123456" }`, response: `{ "user_id": "usr_...", "email_verified": true, "session_token": "sess_...", "session_expires_at": "2026-06-29T00:00:00Z" }` },
      { method: "POST", path: "/v2/auth/resend-otp", summary: "Resend the verification OTP.", auth: "app", request: `{ "email": "trader@example.com" }`, response: `{ "sent": true }` },
      { method: "POST", path: "/v2/auth/login", summary: "Email + password (+ optional TOTP) login.", auth: "app", request: `{ "email": "trader@example.com", "password": "••••••••", "totp_code": "000000" }`, response: `{ "user_id": "usr_...", "session_token": "sess_...", "session_expires_at": "...", "mfa_required": false }` },
      { method: "POST", path: "/v2/auth/sessions/revoke", summary: "Revoke a session (logout).", auth: "app", request: `{ "session_token": "sess_..." }`, response: `{ "revoked": true }` },
      { method: "GET", path: "/v2/me", summary: "Current end user (provisions + claims the complimentary test desk).", auth: "user", response: `{ "user_id": "usr_...", "app_id": "app_...", "kyc_status": "unverified", "prop_accounts": [] }`, runOp: "auth.me" },
      { method: "POST", path: "/v2/auth/password-reset/request", summary: "Email a password reset token.", auth: "app", request: `{ "email": "trader@example.com" }`, response: `{ "sent": true }` },
      { method: "POST", path: "/v2/auth/password-reset/confirm", summary: "Confirm a password reset.", auth: "app", request: `{ "email": "...", "token": "...", "new_password": "••••••••" }`, response: `{ "reset": true }` },
      { method: "POST", path: "/v2/auth/totp/enroll", summary: "Begin user TOTP enrollment.", auth: "user", response: `{ "secret": "BASE32", "otpauth_uri": "otpauth://totp/..." }` },
      { method: "POST", path: "/v2/auth/totp/confirm", summary: "Confirm user TOTP.", auth: "user", request: `{ "code": "123456" }`, response: `{ "enabled": true }` },
      { method: "POST", path: "/v2/auth/totp/disable", summary: "Disable user TOTP.", auth: "user", response: `{ "enabled": false }` },
    ],
  },
  {
    id: "kyc",
    title: "KYC / Identity",
    description: "Verify a trader's identity with Sumsub or Stripe Identity.",
    docHref: "/docs/kyc",
    endpoints: [
      { method: "GET", path: "/v2/kyc/status", summary: "Read KYC status.", auth: "user", response: `{ "user_id": "usr_...", "kyc_provider": "sumsub", "kyc_status": "verified", "kyc_verified_at": "...", "kyc_failure_reason": null }`, runOp: "kyc.status" },
      { method: "POST", path: "/v2/kyc/sumsub/token", summary: "Mint a Sumsub WebSDK access token.", auth: "user", response: `{ "token": "_act-...", "user_id": "usr_...", "level_name": "basic-kyc-level", "applicant_id": "..." }` },
      { method: "POST", path: "/v2/kyc/stripe-identity/session", summary: "Create a Stripe Identity verification session.", auth: "user", response: `{ "client_secret": "vs_...", "url": "https://...", "session_id": "vs_..." }` },
    ],
  },
  {
    id: "payments",
    title: "Payments & accounts",
    description: "Sell challenges with Stripe and provision funded prop accounts.",
    docHref: "/docs/checkout",
    endpoints: [
      { method: "POST", path: "/v2/payments/checkout", summary: "Create a Stripe PaymentIntent for a challenge.", auth: "user", request: `{ "tier_id": "tier_25k", "market": "crypto", "asset_class": "crypto", "account_size": 25000, "amount_cents": 19900, "currency": "usd" }`, response: `{ "payment_id": "pay_...", "stripe_payment_intent_id": "pi_...", "client_secret": "pi_..._secret_...", "amount_cents": 19900, "currency": "usd", "status": "requires_payment_method" }` },
      { method: "POST", path: "/v2/payments/free", summary: "Claim the one complimentary $10K notional test account (idempotent).", auth: "user", request: `{ "tier_id": "tier_demo", "asset_class": "crypto", "account_size": 10000 }` },
      { method: "GET", path: "/v2/payments/prop-accounts", summary: "List the user's prop accounts.", auth: "user", response: `[ { "id": "prop_...", "tier_id": "tier_25k", "asset_class": "crypto", "account_size": 25000, "status": "active", "subaccount_uuid": "...", "synthetic_hotkey": "5F..." } ]`, runOp: "payments.listPropAccounts" },
      { method: "GET", path: "/v2/payments/prop-accounts/{prop_account_id}", summary: "Get one prop account.", auth: "user" },
      { method: "GET", path: "/v2/payments/{payment_id}", summary: "Get a payment by id.", auth: "user", response: `{ "id": "pay_...", "stripe_payment_intent_id": "pi_...", "amount_cents": 19900, "currency": "usd", "status": "succeeded", "tier_id": "tier_25k", "market": "crypto", "prop_account_id": "prop_..." }` },
    ],
  },
  {
    id: "connect",
    title: "Stripe Connect",
    description: "Onboard payees via Stripe Express to receive payouts.",
    docHref: "/docs/payouts",
    endpoints: [
      { method: "POST", path: "/v2/connect/accounts", summary: "Create an Express account + onboarding link.", auth: "user", request: `{ "country": "US" }`, response: `{ "id": "con_...", "stripe_account_id": "acct_...", "onboarding_url": "https://connect.stripe.com/...", "status": "pending", "payouts_enabled": false }` },
      { method: "POST", path: "/v2/connect/accounts/{stripe_account_id}/onboarding-link", summary: "Refresh an onboarding URL.", auth: "user", response: `{ "onboarding_url": "https://connect.stripe.com/..." }` },
      { method: "GET", path: "/v2/connect/accounts", summary: "List Connect accounts (self-heals status).", auth: "user", response: `[ { "id": "con_...", "stripe_account_id": "acct_...", "status": "active", "payouts_enabled": true, "bank_name": "STRIPE TEST BANK", "last4": "6789", "country": "US" } ]`, runOp: "connect.list" },
    ],
  },
  {
    id: "payouts",
    title: "Payouts",
    description: "Read estimated profit owed and disburse it via Connect.",
    docHref: "/docs/payouts",
    endpoints: [
      { method: "GET", path: "/v2/payouts/estimate", summary: "Estimated payout from validator HWM profit.", auth: "user", note: "Optional X-Prop-Account header.", response: `{ "amount_usd": 412.5, "amount_cents": 41250, "currency": "usd", "available": true }`, runOp: "payouts.estimate" },
      { method: "GET", path: "/v2/payouts", summary: "List the user's payouts.", auth: "user", response: `[ { "id": "po_...", "amount_cents": 41250, "currency": "usd", "status": "paid", "stripe_transfer_id": "tr_...", "completed_at": "..." } ]`, runOp: "payouts.list" },
      { method: "POST", path: "/v2/payouts/request", summary: "Request a payout (creates a pending row).", auth: "user", request: `{ "amount_cents": 41250, "prop_account_id": "prop_..." }` },
      { method: "POST", path: "/v2/payouts/{payout_id}/submit", summary: "Submit a pending payout to Stripe (app approval).", auth: "app" },
    ],
  },
  {
    id: "api-keys",
    title: "API keys",
    description: "Issue scoped, revocable programmatic credentials.",
    docHref: "/docs/api-keys",
    endpoints: [
      { method: "POST", path: "/v2/api-keys", summary: "Mint an API key (secret shown once).", auth: "user", request: `{ "label": "Trading bot", "prop_account_id": "prop_..." }`, response: `{ "id": "key_...", "label": "Trading bot", "key_id": "hskk_...", "key_secret": "shown once", "prop_account_id": "prop_..." }` },
      { method: "GET", path: "/v2/api-keys", summary: "List API keys.", auth: "user", response: `[ { "id": "key_...", "label": "Trading bot", "key_id": "hskk_...", "revoked_at": null } ]`, runOp: "apiKeys.list" },
      { method: "DELETE", path: "/v2/api-keys/{key_id}", summary: "Revoke an API key.", auth: "user", response: `{ "revoked": true }` },
    ],
  },
  {
    id: "webhooks-out",
    title: "Webhooks (outbound)",
    description: "Register endpoints to receive signed, real-time events.",
    docHref: "/docs/webhooks",
    endpoints: [
      { method: "POST", path: "/v2/webhook-endpoints", summary: "Register a webhook endpoint.", auth: "app", request: `{ "url": "https://yourapp.com/api/webhooks", "events": ["payment.succeeded", "kyc.updated"], "description": "Prod" }`, response: `{ "id": "whe_...", "url": "...", "events": ["..."], "active": true, "secret": "whsec_..." }` },
      { method: "GET", path: "/v2/webhook-endpoints", summary: "List webhook endpoints.", auth: "app", response: `[ { "id": "whe_...", "url": "...", "events": ["payment.succeeded"], "active": true } ]`, runOp: "webhooks.list" },
      { method: "DELETE", path: "/v2/webhook-endpoints/{endpoint_id}", summary: "Deactivate an endpoint.", auth: "app", response: `{ "deactivated": true }` },
      { method: "GET", path: "/v2/webhook-endpoints/{endpoint_id}/deliveries", summary: "List delivery attempts.", auth: "app", response: `[ { "id": "whd_...", "event_type": "payment.succeeded", "status": "delivered", "attempts": 1, "response_status": 200 } ]` },
    ],
  },
  {
    id: "webhooks-in",
    title: "Webhooks (inbound receivers)",
    description: "Provider-signed receivers the platform exposes for Stripe and Sumsub.",
    docHref: "/docs/webhooks",
    endpoints: [
      { method: "POST", path: "/v2/webhooks/stripe", summary: "Stripe event receiver (Stripe-Signature).", auth: "provider", response: `{ "received": true }` },
      { method: "POST", path: "/v2/webhooks/sumsub", summary: "Sumsub event receiver (x-payload-digest).", auth: "provider", response: `{ "received": true }` },
    ],
  },
  {
    id: "agreements",
    title: "Agreements",
    description: "Capture and audit trader agreement signatures.",
    docHref: "/docs/agreements",
    endpoints: [
      { method: "POST", path: "/v2/agreements/sign", summary: "Sign an agreement version.", auth: "user", request: `{ "agreement_version": "2026-06-01", "signature_name": "Ada Lovelace" }`, response: `{ "signed": true, "signed_at": "...", "agreement_version": "2026-06-01" }` },
      { method: "GET", path: "/v2/agreements/status", summary: "Current agreement state.", auth: "user", response: `{ "signed": true, "signed_at": "...", "agreement_version": "2026-06-01" }`, runOp: "agreements.status" },
      { method: "GET", path: "/v2/agreements/audits", summary: "List signed agreement audit rows.", auth: "user", response: `[ { "id": "agr_...", "agreement_version": "2026-06-01", "signature_name": "Ada Lovelace", "signed_at": "..." } ]`, runOp: "agreements.audits" },
    ],
  },
  {
    id: "lifecycle",
    title: "Lifecycle",
    description: "Sync funded-account status from the validator.",
    docHref: "/docs/lifecycle",
    endpoints: [
      { method: "POST", path: "/v2/lifecycle/sync/{prop_account_id}", summary: "Sync status (evaluation / funded / eliminated).", auth: "user", response: `{ "prop_account_id": "prop_...", "status": "funded", "subaccount_id": 42, "synthetic_hotkey": "5F..." }` },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Send transactional email and fan out webhook events.",
    docHref: "/docs/notifications",
    endpoints: [
      { method: "POST", path: "/v2/notifications/send", summary: "Send email + optional webhook fan-out.", auth: "app", request: `{ "email": "trader@example.com", "subject": "Welcome", "html": "<h1>Hi</h1>", "fanout_event": "custom.greeting", "payload": {} }`, response: `{ "email_sent": true, "webhook_deliveries_queued": 2 }` },
    ],
  },
  {
    id: "trading",
    title: "Trading",
    description: "Submit orders, manage positions, and read the live desk.",
    docHref: "/docs/trading",
    endpoints: [
      { method: "GET", path: "/v2/trading/markets", summary: "Live perp and USDC spot catalog.", auth: "public", response: `{ "markets": [{ "coin": "BTC", "mid": 76900, "max_leverage": 40 }], "spots": [{ "coin": "PURR", "wire": "PURR/USDC", "mid": 0.11, "max_leverage": 1 }] }` },
      { method: "POST", path: "/v2/trading/orders", summary: "Submit an order.", auth: "desk", note: "X-Api-Key and X-Prop-Account headers.", request: `{ "trade_pair": "BTC", "market_type": "perp", "side": "buy", "value": 200, "leverage": 20 }`, response: `{ "success": true, "order_uuid": "ord_...", "processing_time": 0.42 }` },
      { method: "POST", path: "/v2/trading/close", summary: "Market-close one position.", auth: "desk", note: "X-Api-Key and X-Prop-Account headers.", request: `{ "trade_pair": "BTC", "market_type": "perp" }` },
      { method: "GET", path: "/v2/trading/positions", summary: "Open positions.", auth: "desk", note: "X-Api-Key and X-Prop-Account headers.", runOp: "trading.positions" },
      { method: "GET", path: "/v2/trading/orders", summary: "Pending limit/stop orders.", auth: "desk", note: "X-Api-Key and X-Prop-Account headers.", runOp: "trading.orders" },
      { method: "GET", path: "/v2/trading/history", summary: "Closed positions.", auth: "desk", note: "X-Api-Key and X-Prop-Account headers.", runOp: "trading.history" },
      { method: "GET", path: "/v2/trading/balance", summary: "Account size & balance metrics.", auth: "desk", note: "X-Api-Key and X-Prop-Account headers.", response: `{ "account_size": 25000, "status": "active" }`, runOp: "trading.balance" },
      { method: "GET", path: "/v2/trading/desk-poll", summary: "Bundle: positions + orders + history + balance.", auth: "desk", note: "X-Api-Key and X-Prop-Account headers.", response: `{ "positions": [], "orders": [], "history": [], "balance": { "account_size": 25000, "status": "active" } }`, runOp: "trading.deskPoll" },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    description: "Operator endpoints for managing tenant apps (admin auth + TOTP).",
    endpoints: [
      { method: "POST", path: "/v2/admin/login", summary: "Admin login → cookie + bearer.", auth: "public", request: `{ "email": "ops@taoshi.io", "password": "••••••••", "totp_code": "000000" }` },
      { method: "POST", path: "/v2/admin/logout", summary: "Revoke admin session.", auth: "admin" },
      { method: "GET", path: "/v2/admin/me", summary: "Current admin profile.", auth: "admin", response: `{ "admin_id": "adm_...", "email": "ops@taoshi.io", "is_superadmin": true }` },
      { method: "POST", path: "/v2/admin/totp/enroll", summary: "Begin admin TOTP enrollment.", auth: "admin" },
      { method: "POST", path: "/v2/admin/totp/confirm", summary: "Confirm admin TOTP.", auth: "admin" },
      { method: "POST", path: "/v2/admin/apps", summary: "Register a new tenant app.", auth: "admin", request: `{ "name": "Acme", "slug": "acme", "entity_hotkey": "5F...", "network_api_key": "...", "scopes": ["api"] }`, response: `{ "app_id": "app_...", "client_id": "hsc_...", "client_secret": "hsk_...", "note": "store the secret now" }` },
      { method: "GET", path: "/v2/admin/apps", summary: "List all tenant apps.", auth: "admin" },
      { method: "POST", path: "/v2/admin/apps/{app_id}/disable", summary: "Disable an app.", auth: "admin" },
      { method: "POST", path: "/v2/admin/apps/{app_id}/enable", summary: "Re-enable an app.", auth: "admin" },
      { method: "POST", path: "/v2/admin/apps/{app_id}/rotate-secret", summary: "Rotate a tenant's OAuth secret.", auth: "admin" },
    ],
  },
  {
    id: "legacy",
    title: "Legacy v1 (partner-key API)",
    description:
      "The original partner-key surface. Uses static partner API keys and a Trader-ID header instead of OAuth + sessions. Prefer the v2 endpoints above for new integrations.",
    endpoints: [
      { method: "POST", path: "/v1/sessions", summary: "Enroll a trader's HL agent key.", auth: "partner" },
      { method: "GET", path: "/v1/sessions", summary: "List enrolled traders.", auth: "partner" },
      { method: "DELETE", path: "/v1/sessions/{hl_wallet}", summary: "Revoke an enrollment.", auth: "partner" },
      { method: "GET", path: "/v1/balance", summary: "Unified account info.", auth: "partner-trader" },
      { method: "GET", path: "/v1/balance/limits", summary: "Leverage limits.", auth: "partner-trader" },
      { method: "GET", path: "/v1/positions/vanta", summary: "Open positions (Vanta validator).", auth: "partner-trader" },
      { method: "GET", path: "/v1/positions/hyperscaled", summary: "Open positions (Hyperliquid).", auth: "partner-trader" },
      { method: "POST", path: "/v1/orders/vanta", summary: "Submit a Vanta order.", auth: "partner-trader" },
      { method: "POST", path: "/v1/orders/hyperscaled", summary: "Submit a Hyperliquid order.", auth: "partner-session" },
      { method: "GET", path: "/v1/history/positions", summary: "Closed-position history.", auth: "partner-trader" },
      { method: "GET", path: "/v1/history/orders", summary: "Order history.", auth: "partner-trader" },
      { method: "POST", path: "/v1/register/vanta", summary: "Create a Vanta subaccount.", auth: "partner" },
      { method: "POST", path: "/v1/register/hyperscaled", summary: "Purchase a funded HL account.", auth: "partner" },
      { method: "GET", path: "/v1/rules", summary: "List trading rules.", auth: "partner-trader" },
      { method: "GET", path: "/v1/rules/pairs", summary: "Supported trade pairs.", auth: "partner-trader" },
      { method: "POST", path: "/v1/rules/validate", summary: "Validate a proposed trade.", auth: "partner-trader" },
      { method: "GET", path: "/v1/payouts", summary: "Historical payouts.", auth: "partner-trader" },
      { method: "GET", path: "/v1/payouts/pending", summary: "Pending payout (204 if none).", auth: "partner-trader" },
    ],
  },
];

export const TOTAL_ENDPOINTS = API_CATALOG.reduce((n, a) => n + a.endpoints.length, 0);
