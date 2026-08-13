# Responsive Storefront Homologation

Date: 2026-08-12
Branch: `Maestro`

## Scope

The responsive suite covers the Brazil home route at mobile, tablet and desktop
widths; horizontal overflow; mobile navigation and cart drawer lifecycle; the
single-store route; browser history; and reduced-motion behavior.

## Static evidence

- Storefront typecheck: PASS.
- Storefront lint: PASS, 0 errors and 68 inherited warnings.
- Storefront unit tests: PASS, 30 tests.
- Storefront client and SSR build: PASS.
- Backend typecheck: PASS.
- Backend lint: PASS, 0 errors and 35 inherited warnings.
- Backend unit tests: PASS, 11 suites and 64 tests.
- Backend build: PASS.
- Playwright discovery: PASS, 88 tests across Chromium and Mobile Chrome.
- `git diff --check`: PASS.

## Live E2E status

The responsive suite was started with:

```text
pnpm exec playwright test tests/responsive-homologation.spec.ts --project=chromium
```

It could not complete against a real storefront because the Medusa backend was
not listening on `127.0.0.1:9000`. The root loader therefore received no Brazil
region and rendered the fail-closed error boundary. The run produced 1 passing
test and 16 failures caused by the unavailable backend, not by a confirmed
layout regression.

The disposable dependencies are also unavailable: Docker Desktop's
`com.docker.service` is stopped, and ports `55432` (PostgreSQL) and `56379`
(Redis) are closed. Starting the local stack and Medusa backend is required
before this gate can be marked passed.

## Gate decision

Status: `BLOCKED_BY_LOCAL_INFRASTRUCTURE`

No responsive release claim is made from this run. Once Docker Desktop is
available, run the local compose stack, apply migrations and seed the isolated
database, start Medusa on port `9000`, then rerun the responsive suite and the
full Playwright matrix.
