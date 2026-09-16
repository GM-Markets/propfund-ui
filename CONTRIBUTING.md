# Contributing to Propfund

## Development setup

See the [README](./README.md). The short version:

```bash
pnpm install
cp .env.example .env.local   # leave the sign-in app ID empty and set NEXT_PUBLIC_TEST_CONTROLS=true for local test mode
pnpm dev
```

No backend is needed: app data runs on the local mock service in `lib/propfund/mock`.

## Before you open a PR

Run the same checks CI runs:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e   # optional locally; requires `pnpm exec playwright install` once
```

Guidelines:

- `docs/PRD.md` is the source of truth for product rules and copy.
- Keep PRs focused. Add or update tests for behavior you change. Unit tests are
  colocated (`*.test.ts[x]`); e2e specs live in `tests/e2e/`.
- Rules logic stays pure in `lib/propfund/rules` with unit tests.
- Screens read data through `lib/propfund/hooks.ts`, never with fetch in components.
- Read environment variables only through `lib/propfund/config.ts`.
- Build UI primitives in `components/ui` (Radix + `cva` + Tailwind); use `cn()` for class names.
- User-facing copy never names vendors or venues.
- Never commit secrets. `.env*` files other than `.env.example` are gitignored.

## Commit messages

Clear, imperative messages (e.g. `fix: reset SOD at 00:00 UTC`).

## Code of Conduct

By participating you agree to uphold the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

Contributions are licensed under the project's [MIT License](./LICENSE).
