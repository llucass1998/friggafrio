# FriggaFrio Known Issues

Updated: 2026-08-10

## P0

- `apps/storefront/src/components/product-actions.tsx`: undefined `inStock` and `variant` references break typecheck and quote CTA behavior.
- `apps/storefront/src/pages/settings.tsx`: four `preventPadrão` typos break typecheck.
- Storefront lint is not green: 570 errors and 93 warnings.
- Backend typecheck is not green: 24 errors, including unresolved service types and stale `@ts-expect-error` directives.
- Backend Jest cannot parse the TypeScript/ESM test suites; 9 suites fail before executing tests.
- Payment processing is disabled by environment flags; Mercado Pago webhook intentionally returns HTTP 503.
- PostgreSQL/migration/integration validation is blocked by local database connectivity/authentication issues.
- A historical JWT remains recoverable from Git history and must be revoked/rotated.

## P1

- Playwright has 46 tests, but the full suite is not validated against real backend/database fixtures.
- Several storefront pages default `countryCode` to `us` although the commercial target is Brazil.
- Google customer authentication endpoint is intentionally disabled with HTTP 503 until a real provider flow exists.
- `/health/ready` verifies that `DATABASE_URL` exists but does not perform a real database ping.
- Catalog/inventory status must be verified in the target database; documentation contains conflicting snapshots.
- Production Compose keeps payments disabled and requires explicit secrets and provider configuration.
- Legal, LGPD, accessibility and backup/restore evidence still need staging validation.

## P2

- Duplicate legacy files exist under `apps/storefront/apps/storefront`.
- `apps/storefront/src/components/footer.tsx` is legacy/dead code according to the gap analysis.
- Some placeholders and English labels remain in account/settings screens.
- Google Places IDs and related store media configuration are incomplete in the local config.
- Audit documents contain conflicting completion claims and need one authoritative release status.
