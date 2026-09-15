# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately via one of:

- GitHub's [private vulnerability reporting](../../security/advisories/new)
  (preferred), or
- Email **security@taoshi.io**.

Please include:

- A description of the issue and its impact.
- Steps to reproduce (proof-of-concept if possible).
- Affected version / commit and environment details.

We will acknowledge your report within **3 business days** and aim to provide a
remediation timeline after triage. Please give us a reasonable window to fix
the issue before any public disclosure.

## Scope & secret hygiene

This starter is a **client/BFF** app. It stores the Privy identity token in an
httpOnly cookie and sends it to the Flo gateway. There is no app OAuth secret.

- Never expose the Privy identity token to client-side JavaScript beyond Privy
  itself. The BFF copies it into an httpOnly cookie.
- Only `NEXT_PUBLIC_*` variables are safe for client exposure.
- All `.env*` files are gitignored. If you ever commit a secret, **rotate it**
  immediately — removing it from history is not enough.

## Supported versions

Security fixes are applied to the latest release on the default branch.
