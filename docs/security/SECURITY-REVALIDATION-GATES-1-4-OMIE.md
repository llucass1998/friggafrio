# FriggaFrio - Security Revalidation Gates 1-4 + Gate 5

Date: 2026-08-12
Branch: `Maestro`
HEAD before: `a5d30bdf47026f86558f94918bddf97fca3846ce`

## Executive decision

Gate 5 is authorized for the Backend Agent and formal progress remains `4/14`.

The required Omie read-only discovery was not started in this security pass. The
local secure environment has all required Omie variables present. A historical
JWT remains recoverable from `apps/storefront/token.txt`, originally committed
by `e576de2` and removed by `375859f`; it is expired, has no associated refresh
or session credential in accessible history, and is retained as a
`HISTORICAL_EXPIRED_SECRET` non-blocking warning. Historical exposure remains
recorded even though it is not a current Gate 5 blocker.

No Omie request, Omie write, Medusa catalog write, migration reset, database
reset, volume removal or push was performed.

## Runtime and secrets

- `.env` exists: YES (`apps/backend/.env`).
- `.env` ignored: YES (`apps/backend/.gitignore:2`).
- `.env` tracked: NO.
- `OMIE_API_URL`: PRESENT.
- `OMIE_APP_KEY`: PRESENT.
- `OMIE_APP_SECRET`: PRESENT.
- Values printed: NO.
- Current Omie credentials in tracked/current content: NOT_FOUND.
- Current Omie credentials in Git history: NOT_FOUND.
- Dedicated scanner: unavailable; reusable local scanner added as `pnpm security:secrets`.
- The reusable scanner checks tracked files, staged/unstaged diffs, non-ignored
  untracked files, private-key filenames and accessible Git history.
- Current scanner result: PASS with `HISTORICAL_EXPIRED_SECRET` warning retained.

The historical finding is intentionally reported without exposing its value. It
is a JWT-like token in the removed `apps/storefront/token.txt` file. Historical
exposure remains documented; its expired, non-refreshable state makes it a
non-blocking warning for Gate 5.

## Gate 5 recovery attempt

The Orca runtime itself was healthy (`ready`) and the formal `Maestro` worktree
resolved correctly. The Security Agent could not complete after three justified
attempts because the Codex 0.144.6 runtime failed before accepting the task:

- the persistent Codex configuration contains an incompatible
  `mcp_servers.github` transport (`CONFIGURATION_FAILURE`);
- the optional remote `keyproxy` MCP/provider timed out over HTTP
  (`MCP_SERVER_UNAVAILABLE` / reachability failure);
- recovery profiles with external MCPs disabled still remained stuck during Codex
  startup, without a `worker_done` report.

No FriggaFrio files were changed by those recovery terminals. The agent dispatch
was stopped after the bounded retry limit; Backend, Frontend and QA remained
blocked by the security dependency.

The historical JWT was decoded in memory without printing or saving its value.
The completed Security Agent independently confirmed `alg=HS256`, `typ=JWT`, no
issuer/subject/audience/jti or refresh claim, expiration on 2026-07-26, and no
associated refresh or session credential in accessible history. The current
verifier enforces expiration, so the token is not currently reusable. It is
classified as `HISTORICAL_EXPIRED_SECRET`; P1 is cleared and Security
authorization is `GRANTED`.

## Findings

| Finding | Severity | Gate | File | Exploitability / impact | Status |
| --- | --- | --- | --- | --- | --- |
| Historical JWT remains recoverable from Git history | Warning (`HISTORICAL_EXPIRED_SECRET`) | Gates 1-4 / secret policy | `apps/storefront/token.txt` at `e576de2` | Historical exposure remains; token is expired, expiration is enforced, and no refresh/session credential was found | NON-BLOCKING; retained for audit history |
| Admin one-off scripts contained a shared hardcoded password and printed it | P1 | Gate 1 / secrets | `apps/backend/src/scripts/reset-admin.ts`, `force-reset-admin.ts`, `force-reset-admin2.ts` | Anyone with source access could reuse the credential; logs could leak it | FIXED in worktree; history still requires normal secret-history policy |
| Employee invite list/resend exposed invite tokens | P1 | Gate 1 / auth boundary | `apps/backend/src/api/store/employees/invites/route.ts`, `[id]/resend/route.ts` | Authenticated company users could obtain bearer-like invite material | FIXED; responses now omit tokens |
| Admin quote endpoint logged query fields | P2 | Gate 1 / logging | `apps/backend/src/api/admin/quotes/[id]/route.ts` | Internal schema detail could enter logs | FIXED |
| Missing CSP/HSTS/advanced header policy | P2 | Future Gate 9/12 | deployment edge | Defense-in-depth gap; not a confirmed Gate 5 blocker | DEFERRED |
| Direct service mutations in several API routes | P2 | Gate 1 / architecture | backend lint warnings | Workflow bypass risk requires focused refactor review | DEFERRED |
| Generic `any` and TypeScript suppressions remain in legacy/Admin paths | P2 | Gate 1 | backend/storefront source | Weakens static guarantees; no confirmed exploit in this pass | DEFERRED |

Counts: P0 open `0`; P1 open `0`; historical warnings `1`; P2 deferred `3`; P3 `0`.

## Gate revalidation

### Gate 1

- Type boundary: PASS with documented legacy suppressions; no new suppressions introduced.
- Input validation: PASS for reviewed quote, company, employee and invite routes; Zod middleware is present on mutation boundaries. Legacy company order/quote pagination uses `parseInt` without strict range schemas and remains P2 debt.
- Mass assignment: no confirmed unrestricted `req.body` persistence in reviewed Gate 1 paths.
- Sensitive logging: improved; hardcoded admin credential output and quote field logging removed.
- Security status: `PASS WITH SECURITY DEBT`; the historical expired JWT is a non-blocking warning.

### Gate 2

- Tests/config: PASS; no `.only` found, no active `forceExit`, no tracked test secret fixtures.
- One registration suite is explicitly skipped with a code comment (`tests/register.spec.ts`); this is a known test coverage gap, not a bypass used to claim Gate 5.
- Dependency audit: network audit output was not machine-parseable in this environment; no automatic dependency changes were made.
- Security status: `PASS WITH SECURITY DEBT`.

### Gate 3

- Seed safety: PASS by inspection; seed uses idempotent workflows and no destructive reset was executed.
- Commercial data integrity: PASS for the reviewed Brazil/BRL defaults; no Omie data was imported.
- Destructive behavior: NO destructive command executed.
- Security status: PASS.

### Gate 4

- Local compose Postgres and Redis bind to `127.0.0.1`; production compose does not publish database or Redis ports.
- Local disposable Postgres password is explicit in local-only compose and is not a production claim.
- Production secrets are parameterized environment references; no database or Redis credential was committed.
- Docker critical findings: 0 confirmed; root/container hardening remains future debt.
- Current Docker service is stopped; live stack validation unavailable.
- Security status: PASS WITH INFRASTRUCTURE LIMITATION.

## Backend and storefront smoke

- CORS: PASS by explicit origin configuration; no wildcard with credentials found.
- JWT/session fallback: PASS; production/staging require Redis and configured secrets; no hardcoded signing fallback found.
- Sensitive logging: PASS after fixes; no reviewed path logs passwords, bearer tokens or database URLs.
- Admin auth: PASS by authenticated Medusa request types and admin middleware review.
- Known quote IDOR: PASS for customer routes; customer ownership filters are present in retrieve/preview/workflow inputs.
- Private env exposure: PASS; storefront only uses `VITE_*` public values and has no Omie integration.
- Private secrets in client bundle: `0` for named private secret patterns.
- Direct Omie browser/API calls: `0`.
- XSS blockers: `0` confirmed; one JSON-LD `dangerouslySetInnerHTML` uses application-controlled values.
- Open redirect blockers: `0` confirmed; `returnTo` normalization is covered by unit tests.
- SSR secret exposure: `0` confirmed.

## Omie status

- Auth: NOT RUN in this security-only pass; required credentials are present in the ignored local environment.
- `ListarProdutos`: NOT RUN.
- Read-only writes: `0`.
- Pages/products/normalization/dry-run/import/idempotency: NOT RUN.
- Security authorization for Omie: `GRANTED`; Backend Agent may proceed with read-only discovery.

## Regression after security fixes

- Backend typecheck: PASS.
- Backend unit: PASS, 11 suites / 64 tests.
- Backend lint: PASS, 0 errors / 38 warnings.
- Backend build: PASS.
- Storefront typecheck: PASS.
- Storefront unit: PASS, 30 tests.
- Storefront build client + SSR: PASS.
- `git diff --check`: PASS.
- Live HTTP/Playwright and Docker-backed checks: BLOCKED because Docker and ports `9000`, `55432`, `56379` are unavailable.

## Required external actions

1. Preserve the historical JWT warning in security audit records.
2. Backend Agent executes the authorized Omie `ListarProdutos` read-only discovery.
3. Start Docker/PostgreSQL/Redis and Medusa for live integration checks when required.

Functional completeness remains `65%`; production readiness remains `40%`.
No commit or push was created by this execution.
