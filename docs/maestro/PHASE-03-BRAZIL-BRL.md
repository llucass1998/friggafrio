# Phase 03 - Brazil and BRL commerce defaults

Status: PASS
Date: 2026-08-10
Commit: `CURRENT_PHASE_COMMIT`
Author: Lucas <llucass_souza@hotmail.com>

## Scope

- BE-P1-001: define a reproducible Medusa V2 bootstrap for Brazil, BRL, the main Store, and the default Sales Channel.
- FE-P1-001: centralize the storefront country, currency, and locale contract and remove foreign runtime defaults.
- Normalize the Phase 2 commit references without creating a residual Phase 2 commit.
- No database, migration, payment, shipping, catalog, or complete checkout work was executed.

## Discovery

| Item | Current repository state | Expected state | Risk treatment |
| --- | --- | --- | --- |
| Medusa | 2.18.0 | Use Medusa V2 workflows and Graph Query | V1 APIs were not used |
| Country | Foreign `us` defaults existed in routes and forms | `br` | Centralized and validated |
| Currency | USD/EUR fallbacks existed in quotes and email defaults | `brl` backend / `BRL` presentation | Foreign fallbacks removed from active defaults |
| Locale | Mixed `en-US` and `pt-BR` formatting | `pt-BR` | Centralized for storefront dates and money |
| Region | Storefront could fall back to the first API region | Exactly one region containing BR and using BRL | Ambiguity and missing configuration fail diagnostically |
| Store | Seed script target was configured but the file did not exist | Main FriggaFrio Store with BRL default | Reproducible bootstrap added; database execution deferred |
| Sales Channel | Runtime state cannot be proven without a database | Existing default channel reused or Canal Brasil created | Stable references and conflict detection added |
| Money unit | One product JSON-LD path divided Medusa values by 100 | Medusa V2 major-unit decimals | Factor-100 conversion removed and tested |

## Implementation

- Added centralized backend defaults in `apps/backend/src/lib/commerce-defaults.ts`.
- Added the configured `pnpm seed` target at `apps/backend/src/scripts/seed.ts`.
- The seed uses Medusa V2 region, sales-channel, and store workflows.
- The bootstrap resolves records by stored metadata, BR country membership, stable names, and Store references.
- Conflicting records fail closed instead of selecting an arbitrary region, Store, or Sales Channel.
- Existing Region countries, Store currencies, Store locales, metadata, and tax-inclusive currency flags are preserved during updates.
- BRL is the sole default currency; preserved currencies are explicitly non-default.
- The storefront accepts only the `br` route scope and rejects missing, foreign, or ambiguous region configuration.
- Currency display uses `Intl.NumberFormat` with `pt-BR` and `BRL`.
- Structured product prices keep Medusa V2 major units and do not divide by 100.
- Company and address country inputs are restricted to Brazil in the Phase 3 storefront scope.

## Idempotency

- The planner returns `create`, `update`, or `none` before mutation.
- A conforming state produces a no-op plan on repeated sequential runs.
- Partial records are resolved by stable Store references, country membership, names, and bootstrap metadata.
- Duplicate or conflicting identifiers cause a diagnostic error instead of another blind create.
- Concurrent seed execution is not claimed as database-validated. PostgreSQL locking and real record counts must be homologated in Phase 4.

## Money representation

- Medusa 2.18 values are treated as major-unit decimal amounts.
- No multiplication or division by 100 is applied to storefront or admin presentation.
- Schema.org price strings use the direct decimal amount with two fraction digits.
- No conversion of historical USD/EUR prices was attempted.

## Test evidence

| Gate | Command | Result |
| --- | --- | --- |
| Storefront TypeScript | `pnpm --dir apps/storefront typecheck` | PASS - zero errors |
| Storefront ESLint | `pnpm --dir apps/storefront lint` | PASS - 0 errors, 77 documented warnings |
| Storefront build | `pnpm --dir apps/storefront build` | PASS - client and SSR bundles generated |
| Storefront unit | `pnpm --dir apps/storefront test:unit` | PASS - 14 passed, 0 failed, 0 skipped |
| Backend TypeScript | `pnpm --dir apps/backend typecheck` | PASS - zero errors |
| Backend unit | `pnpm --dir apps/backend test:unit` | PASS - 9 suites, 46 tests, 0 failed, 0 skipped |
| Diff check | `git diff --check` | PASS |

New coverage includes:

- fixed Brazil/BRL/pt-BR contracts;
- missing, foreign, and ambiguous storefront regions;
- direct major-unit formatting for 0, 1, 10, 99.90, 1000, 0.01, and 1.23;
- direct structured-data money values;
- bootstrap create/update/no-op planning;
- preservation of additional country, currency, locale, and tax settings;
- conflicting Region, Store, and Sales Channel detection;
- absence of foreign fallbacks in the seed.

## Gate 3

- [x] Brazil is the commercial default country.
- [x] Country code BR is configured as `br` where required by Medusa and routes.
- [x] BRL is the backend and presentation currency default.
- [x] The Brazil region contract is defined and reproducible.
- [x] No active fallback to USD/EUR remains in the audited commerce paths.
- [x] Store and Sales Channel resolution is coherent and conflict-aware.
- [x] The seed/bootstrap is reproducible without blind duplicate creation.
- [x] Sequential idempotency is covered without a real database.
- [x] Medusa V2 money values are handled without a factor-100 conversion.
- [x] Backend and storefront tests cover the Phase 3 contract.
- [x] Gates 1 and 2 remain green.
- [x] Documentation and the cohesive Phase 3 commit are part of this gate.

## Limitations and next dependencies

- The seed was not executed because Phase 3 explicitly excludes a real database.
- Current database Store, Region, currency, locale, and Sales Channel rows are therefore not claimed as homologated.
- Concurrent seed execution, fresh/existing database runs, and HTTP integration remain Phase 4 evidence.
- Payment, tax, fulfillment, shipping, catalog, cart, and checkout providers were audited only for defaults; none were implemented here.
- Jest still reports the inherited `--forceExit` open-handle warning.

Functional progress remains 65% and production readiness remains 40%. Gate 3 completes the repository-level Brazil/BRL capability, but no objective weighting model authorizes changing the frozen overall percentages.
