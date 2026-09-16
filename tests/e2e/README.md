# E2E tests (Playwright)

Browser-level coverage for Propfund. Everything runs against the local mock
service, so no backend is needed.

| Spec | Needs |
|---|---|
| `marketing.spec.ts`, `docs.spec.ts` | A bare dev server |
| `auth.spec.ts` | A bare dev server; the test sign-in block needs `NEXT_PUBLIC_TEST_CONTROLS=true` and no sign-in app ID |
| `onboarding.spec.ts` | `E2E_RUN_ONBOARDING=1` and `NEXT_PUBLIC_TEST_CONTROLS=true` (opt-in; depends on the app screens) |

Page objects live in `fixtures/pages.ts`. Prefer extending those over
duplicating selectors inside specs.

## Running

```bash
pnpm exec playwright install --with-deps chromium   # once per machine

NEXT_PUBLIC_TEST_CONTROLS=true pnpm test:e2e
pnpm test:e2e tests/e2e/auth.spec.ts
E2E_RUN_ONBOARDING=1 NEXT_PUBLIC_TEST_CONTROLS=true pnpm test:e2e tests/e2e/onboarding.spec.ts
```

The HTML report is written to `playwright-report/`
(`pnpm exec playwright show-report`).

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `E2E_PORT` | `3100` | Port of the test dev server |
| `E2E_BASE_URL` | `http://localhost:${E2E_PORT}` | Target an already-running server |
| `E2E_SKIP_WEB_SERVER` | unset | `1` when you started the server yourself |
| `E2E_RUN_ONBOARDING` | unset | `1` runs the full sign-in → buy → trade flow |
