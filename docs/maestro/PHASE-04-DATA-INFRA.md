# Phase 4: Persistent Data Infrastructure

Date: 2026-08-11

## Scope and Decision

This phase validates the local, disposable Medusa 2.18.0 data lifecycle with a real PostgreSQL database and Redis instance. It covers migrations, Brazil/BRL bootstrap persistence, concurrency, HTTP health checks, restart recovery and inherited regressions. It does not introduce catalog, pricing, stock, cart, shipping, checkout, payment, authentication or deployment work.

Compose was retained instead of adding Testcontainers: the repository already has a reproducible, loopback-bound Compose stack, and Medusa's HTTP test utility creates its own isolated temporary PostgreSQL database. This provides a persistent developer lifecycle and non-destructive HTTP isolation without a second container orchestration dependency.

## Local Contract

| Resource | Value |
| --- | --- |
| Compose project | `frigga-maestro-local` |
| PostgreSQL container | `frigga-maestro-postgres` |
| PostgreSQL image | PostgreSQL 16.14 (`postgres:16-alpine`, digest pinned) |
| PostgreSQL host binding | `127.0.0.1:55432` |
| Development database | `frigga` |
| Integration-test database | `frigga_test` |
| Redis container | `frigga-maestro-redis` |
| Redis image | Redis 7.4.9 (`redis:7-alpine`, digest pinned) |
| Redis host binding | `127.0.0.1:56379` |
| PostgreSQL volume | `frigga-maestro-local-postgres-data` |
| Redis volume | `frigga-maestro-local-redis-data` |

`DATABASE_URL`, `TEST_DATABASE_URL` and `REDIS_URL` are supplied only through the local environment templates. Source code does not hardcode hosts, users, passwords or connection URLs. Templates contain explicitly local-only placeholders; no `.env` file is tracked.

For the evidence runs, the shell supplied the sanitized local contracts from the table above; no ignored `.env` file was created or committed. A developer may copy a template to an ignored local `.env` before running Medusa commands.

Use the guarded helper from the repository root:

```powershell
.\deploy\local-infra.ps1 config
.\deploy\local-infra.ps1 up
.\deploy\local-infra.ps1 stop
.\deploy\local-infra.ps1 start
.\deploy\local-infra.ps1 status
.\deploy\local-infra.ps1 verify-reset-targets
```

The destructive reset path requires `-ConfirmReset` and re-verifies the exact container and labeled volume targets before removal. It was not used for the persistent evidence database. Do not use broad Docker prune commands or `docker compose down -v`; unrelated local containers and volumes are outside this project's scope.

## Infrastructure Evidence

Validated on Windows with Node 24.15.0, pnpm 9.4.0, Docker Engine 29.5.3 and Docker Compose 5.1.4.

| Check | Result |
| --- | --- |
| Compose configuration | PASS: exact project/container names, digest-pinned images, loopback bindings, persistent labeled volumes and health checks. |
| PostgreSQL startup | PASS: PostgreSQL 16.14 became healthy; `frigga` and `frigga_test` are available. |
| Redis startup | PASS: Redis 7.4.9 became healthy and returned `PONG`. |
| Backend PostgreSQL connection | PASS: backend readiness queried the active PG connection and returned HTTP 200. |
| Backend Redis connection | PASS: Redis `CLIENT LIST` showed active `ioredis` 5.9.3 clients from the backend. |
| Compose stop/start persistence | PASS: both services became healthy again; `frigga` retained its commercial state and Redis returned `PONG`. |

The standard ports 5432, 5433 and 6379 were already used by unrelated local projects. The dedicated loopback ports avoid interference.

## Migrations

The initially empty `frigga` database had zero public tables and no Medusa migration history. The official Medusa V2 command was run:

```powershell
pnpm --dir apps/backend db:migrate:safe
```

This executes `medusa db:migrate --all-or-nothing --execute-safe-links --concurrency 1`.

| Check | Result |
| --- | --- |
| Fresh database migration | PASS |
| Public tables after migration | 156 |
| `mikro_orm_migrations` history | 187 |
| `script_migrations` history | 5 |
| Failed migrations | 0 |
| Second migration invocation | PASS; module databases reported up to date |
| Unexpected pending migrations | 0 |

Medusa logs `create-super-admin-role.js` as pending when checking scripts. Its installed source explicitly disables it while the RBAC feature flag is disabled, so it is not an applicable pending migration. No migration was edited, deleted or manually marked as applied.

## Brazil Seed and Persistence

The real seed was executed against the migrated, previously empty `frigga` database:

```powershell
pnpm --dir apps/backend seed
pnpm --dir apps/backend seed:validate
```

`seed:validate` uses Medusa Graph Query rather than relying only on SQL. The first execution produced exactly one persisted commercial configuration:

| Resource | Persisted result |
| --- | --- |
| Store | `FriggaFrio` |
| Region | `Brasil` |
| Country | `br` |
| Currency | `brl`, set as the store default |
| Store locale | `pt-BR` |
| Sales channel | `Canal Brasil` |

The second seed completed as a no-op (`region=none sales_channel=none store=none`). Counts remained Store/Region/Sales Channel `1/1/1`; the original IDs were preserved. A temporary, non-bootstrap Store metadata probe survived the seed and was removed afterward, proving that legitimate metadata is preserved rather than replaced.

Database integrity checks after the seed found zero active duplicate Store, Region or Sales Channel names; zero dangling default Store region/channel links; zero orphan active Store currency/locale rows; and zero invalid non-null `region_country` links. The 249 `region_country` rows with a null `region_id` are Medusa's built-in country reference rows, not orphans. The single active `br` row is linked to `Brasil`. PostgreSQL reports 97 configured foreign keys. Primary and soft-delete indexes are present for Store, Region and Sales Channel.

## Concurrency

Two seed processes were launched against a fresh disposable database. The first attack exposed a real Medusa first-boot race: each process could create a pristine `Medusa Store` before the custom seed acquired its own lock. The seed initially failed closed rather than selecting or deleting an ambiguous Store.

The correction keeps the existing transaction-scoped PostgreSQL advisory lock and adds narrowly constrained reconciliation for only that exact race artifact. A candidate must be a pristine default Store, share a single sales channel and equivalent currency setup, have no metadata, region, location or locale, and be created within ten seconds of the duplicate. Any legitimate variation is refused and left untouched. The reconciliation uses the Medusa delete workflow inside the advisory-lock transaction; it is not an in-memory mutex.

After correction, two simultaneous first seeds on a new disposable PostgreSQL database completed with final active Store/Region/Sales Channel counts of `1/1/1`. Graph validation passed. A unit test covers both recognition of the safe race artifact and refusal to remove legitimate variant state.

## HTTP, Health and Recovery

The real persistent backend was started against `frigga` and Redis.

| Scenario | Result |
| --- | --- |
| `GET /health/live` | PASS: HTTP 200 |
| `GET /health/ready` with PostgreSQL available | PASS: HTTP 200 and `database=up` |
| Store regions API with an in-memory existing publishable key | PASS: HTTP 200 with the persisted `Brasil`/`brl`/`br` region |
| Backend restart | PASS: readiness returned 200; Store/Region/Sales Channel stayed `1/1/1` |
| PostgreSQL stopped | PASS: readiness returned controlled HTTP 503 with `database=down`, without credentials or stack trace |
| PostgreSQL restarted | PASS: container became healthy, backend readiness returned 200 and commercial state remained `1/1/1` |
| Redis stopped | PASS: backend remained live and database-ready; no client-facing stack trace |
| Redis restarted | PASS: `PONG` returned and new backend `ioredis` clients appeared |
| Compose stop then start | PASS: both health checks passed, PostgreSQL commercial state remained `1/1/1`, Redis returned `PONG` |

Redis is used by Medusa's service infrastructure. The database readiness endpoint intentionally reports database availability only; it does not disclose connection strings, credentials or internal exceptions.

## HTTP Integration and Jest Lifecycle

The isolated HTTP suite creates and migrates its own `medusa-*-integration-1` PostgreSQL database, rather than using `frigga`:

```powershell
pnpm --dir apps/backend test:integration:http
```

Result: `health.spec.ts` PASS, 1 suite, 2 tests, 0 failures, 0 skips. The suite proves liveness and readiness through a real Medusa HTTP server and PostgreSQL connection. The test process emits transient Knex `Connection ended unexpectedly` logs while Medusa test utilities terminate snapshot-template connections; the suite passes and `--detectOpenHandles` reports no lingering handle.

Controlled unit and HTTP runs with `--detectOpenHandles` both passed and exited naturally:

| Suite | Result |
| --- | --- |
| Backend unit | 10 suites, 50 tests, 0 failures |
| Backend HTTP integration | 1 suite, 2 tests, 0 failures |
| Open-handle report | None |

`--forceExit` was removed from all backend Jest scripts. The previously observed workaround is no longer required for the discovered unit and HTTP suites. No custom PostgreSQL, Redis or HTTP connection leak was found.

## Inherited Regression Evidence

| Gate | Command/result |
| --- | --- |
| Backend TypeScript | PASS: `pnpm --dir apps/backend typecheck` |
| Backend unit | PASS: 10 suites, 50 tests |
| Backend HTTP integration | PASS: 1 suite, 2 tests |
| Storefront TypeScript | PASS: `pnpm --dir apps/storefront typecheck` |
| Storefront ESLint | PASS: 0 errors, 77 inherited warnings |
| Storefront unit | PASS: 14/14 |
| Storefront production build | PASS: client and SSR |

The final backend typecheck exposed eight existing nullable Medusa Graph Query assumptions outside the Phase 4 diff. They were corrected with inferred nullable types and explicit null filtering; no `any`, TypeScript suppression or eslint suppression was added. This was necessary to preserve the inherited gate under the current installed Medusa 2.18.0 type declarations.

## Outcome

**TASKS:** DB-P0-001, BE-P0-005, INFRA-P0-001, DB-P0-002 and BE-P0-006: PASS. BE-P0-007: PASS; `--forceExit` removed after controlled evidence.

**GATE 4:** PASS. The local data lifecycle is reproducible and evidence-backed. This does not alter Functional 65% or Production readiness 40%, because no formula in `PROGRESS.json` authorizes changing those frozen baseline metrics.
