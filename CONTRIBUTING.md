# Contributing to Vanta Starter

Thanks for your interest in improving Vanta Starter! This project is the
reference example for building on `hyperscaled-api`, so clarity and correctness
matter as much as features.

## Ways to contribute

- **Report bugs** or confusing docs via [issues](../../issues).
- **Suggest improvements** to the onboarding/trading flows or DX.
- **Open pull requests** for fixes and features.

## Development setup

See the [README](./README.md) for full setup. The short version:

```bash
pnpm install
cp .env.example .env.local   # NEXT_PUBLIC_GATEWAY_URL + NEXT_PUBLIC_PRIVY_APP_ID
pnpm dev
```

You'll need a running Flo gateway and Vanta for anything that hits the network.

## Before you open a PR

Run the full local check suite — CI runs the same steps:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e   # optional locally; requires `pnpm exec playwright install` once
```

Guidelines:

- Keep PRs focused and small where possible.
- Add or update tests for behavior you change. Unit tests are colocated
  (`*.test.ts[x]`); e2e tests live in `tests/e2e/`.
- Never commit secrets. `.env.local` and other `.env*` files are gitignored —
  keep it that way.
- Match the existing code style (TypeScript, Tailwind tokens, Server Actions as
  the BFF layer). Run `pnpm lint` to autoformat what it can.
- Update the README / in-app `/docs` when you change developer-facing behavior.

## Commit messages

Use clear, imperative messages (e.g. `fix: handle expired session token`).
[Conventional Commits](https://www.conventionalcommits.org/) are appreciated but
not required.

## Code of Conduct

By participating you agree to uphold our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
