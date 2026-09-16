# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report them privately through GitHub's
[private vulnerability reporting](../../security/advisories/new), or email
**support@propfund.io** with "Security" in the subject.

Please include:

- A description of the issue and its impact.
- Steps to reproduce (proof of concept if possible).
- Affected commit and environment details.

We acknowledge reports within **3 business days** and share a remediation
timeline after triage. Please allow a reasonable window for a fix before any
public disclosure.

## Scope and secret hygiene

- This app has no server-side secrets. Every environment variable is a public
  `NEXT_PUBLIC_*` value inlined into the browser bundle; never put a secret in one.
- `NEXT_PUBLIC_TEST_CONTROLS` must never be set in production.
- In build mode all app data is simulated and stored in the browser's
  `localStorage`; nothing in it is authoritative.
- `.env*` files other than `.env.example` are gitignored. If a secret is ever
  committed, rotate it immediately.

## Supported versions

Security fixes are applied to the latest commit on the default branch.
