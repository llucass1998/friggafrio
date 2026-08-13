# FriggaFrio Finalization Baseline

Date: 2026-08-10
Branch: `Maestro`
Commit: `5d9b5a8`

## Environment

- Node: `v24.15.0`
- pnpm: `9.4.0` (repository package manager declares pnpm `10.12.3`)
- Git worktree: clean apart from the new `docs/maestro/` files
- PostgreSQL/Redis: not validated as live services during this baseline

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Git status | PASS | `git status --short --branch` |
| Storefront typecheck | FAIL | 6 errors |
| Backend typecheck | FAIL | 24 errors |
| Storefront lint | FAIL | 570 errors, 93 warnings |
| Storefront unit tests | PASS | 6 tests passed |
| Backend unit tests | FAIL | 9 suites failed, 0 tests executed |
| Storefront build | PASS | Client and SSR bundles built; large chunk warning |
| Playwright discovery | PASS | 46 tests in 11 files listed |

## Current TypeScript Failures

### Storefront

- `apps/storefront/src/components/product-actions.tsx`: undefined `inStock` and `variant` references.
- `apps/storefront/src/pages/settings.tsx`: four `preventPadrão` calls.

### Backend

- Obsolete `@ts-expect-error` directives in company, employee, quote and workflow routes.
- `customerProfileService` resolves as `unknown`.
- `companyModuleService` resolves as `unknown`.

## Current Test Failures

- Backend Jest is not transforming the TypeScript/ESM test suites correctly.
- Failures occur during parsing, including `Cannot use import statement outside a module`.
- Integration tests have not been validated against a live PostgreSQL/Redis stack.

## Services and External Dependencies Required

- PostgreSQL with valid migrations and credentials.
- Redis for production/staging session persistence.
- Approved catalog, inventory, stock location, shipping profile and prices.
- Explicit payment provider decision and sandbox credentials.
- Secret revocation/rotation for the historical JWT.
- CI runner with Chromium and Mobile Chrome for full E2E.

## Baseline Decision

Fase 0 is recorded, but the project is not ready for the next release gate. Fase 1 must reach zero TypeScript errors before quality, database, commerce or payment phases advance.
