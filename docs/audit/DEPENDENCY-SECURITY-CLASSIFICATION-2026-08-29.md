# Dependency Security Classification - 2026-08-29

## Scope and method

`pnpm audit --json` was run against the lockfile after the coordinated pins
listed below. Classification is based on the installed dependency path, the
runtime artifact, and the documented role of the parent tool. It is not based
on audit severity alone. "Production reachable" means that an untrusted HTTP
request can reach the vulnerable code in the deployed backend, Storefront, or
Admin runtime.

Result: `critical=0`, `high=4`, `moderate=14`, `low=3` in the raw audit.
`CRITICAL_PRODUCTION_REACHABLE=0` and `HIGH_PRODUCTION_REACHABLE=0`.

## Coordinated updates applied

| Group | Change | Compatibility evidence | Validation |
| --- | --- | --- | --- |
| Backend controlled tools | Backend Vite `5.2.11 -> 5.4.21` | Remains in the Medusa 2.18-supported Vite 5 major | backend typecheck, unit tests, and build |
| Storefront / TanStack transitive H3 | `h3-v2` alias pinned to `h3@2.0.1-rc.18` | Preserves TanStack Start's alias contract | Storefront typecheck, unit tests, and build |
| Storefront build | Storefront Vite `7.1.2 -> 7.3.5` | Existing Vite 7 Storefront contract retained | Storefront typecheck, unit tests, and build |
| Preview / image processing | Next `16.2.11`, Sharp `0.35.3` pins | Same supported runtime family | backend typecheck, unit tests, and build |
| General transitive patches | `flatted@3.4.4`, `js-yaml@3.15.1`, `minimatch@9.0.7` | Patch/minor-only updates within parent semver ranges | backend unit suite: 52 suites / 296 tests |
| General runtime helpers | `lodash`, `lodash-es`, `postcss`, `react`, `react-dom`, `ws`, and `fast-xml-parser` pins | Installed and validated in the prior compatible pin wave | Storefront/backend typechecks and builds |

No global major override was used. The root `pnpm.overrides` records every
intentional transitive pin.

## Remaining high findings and temporary exceptions

| Package / installed version | Advisory and fixed version | Complete importer tree | Area | Classification | Why not a production request path | Breaking update / coordinated action | Mitigation, owner, expiry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `immutable@3.7.6` | GHSA-wf6x-7x77-mvgw (`>=3.8.3`), GHSA-v56q-mh7h-f735, GHSA-xvcm-6775-5m9r (`>=4.3.9`) | `backend -> @medusajs/cli@2.18.0 -> @medusajs/utils -> @graphql-codegen/typescript -> @graphql-codegen/visitor-plugin-common -> @graphql-tools/relay-operation-optimizer -> @ardatan/relay-compiler@12.0.3 -> immutable` | Medusa code generation / CLI | `BUILD_ONLY` | Relay compiler code generation is not imported by application routes or Storefront runtime assets. | `@ardatan/relay-compiler@12.0.3` declares `immutable ~3.7.6`; 4.x violates its declared range. Update Medusa / GraphQL codegen together when Medusa supports a Relay compiler that accepts Immutable 4. | Mitigate by restricting build/CLI access to trusted developers and running builds in CI. Owner: platform. Review by 2026-09-30. |
| `vite@5.4.21` | GHSA-fx2h-pf6j-xcff; `>=6.4.3` | `backend -> @medusajs/framework@2.18.0 -> @medusajs/types -> vite@5.4.21` (also Medusa Admin bundler) | Medusa Admin bundler / local build tool | `BUILD_ONLY` | The deployed backend serves pre-built assets; Vite is not an HTTP route handler for Storefront or Store API requests. | Vite 6 is a major upgrade incompatible with the Medusa 2.18 Vite 5 peer contract. Requires a Medusa-supported framework/Admin upgrade and an Admin build regression. | Do not expose a Vite dev server publicly; production uses static Admin assets. Owner: platform. Review by 2026-09-30. |

Immutable `3.7.6` remains because all three current advisories require either
`3.8.3` or `4.3.9`, while the locked Relay compiler declares
`immutable ~3.7.6`. The compatible parent upgrade is therefore documented
rather than masked by an unsafe override.

## Other findings by dependency tree

| Package / installed version | Advisories fixed by | Complete importer tree | Area | Classification | Breaking change / action |
| --- | --- | --- | --- | --- |
| `esbuild@0.21.5` | `>=0.25.0`; `tsx` copy `>=0.28.1` | `backend -> @medusajs/framework -> vite@5.4.21 -> esbuild`; `root -> tsx -> esbuild` | Build / dev | `BUILD_ONLY` | Vite 6/Medusa upgrade required for the backend copy; update `tsx` independently when compatible. |
| `vite@5.4.21` (two moderate advisories in addition to the high advisory above) | `>=6.4.3` or a later supported Vite 6 release, depending on advisory | `backend -> @medusajs/framework@2.18.0 -> @medusajs/types -> vite@5.4.21` | Medusa Admin bundler / local build tool | `BUILD_ONLY` | Same coordinated Medusa/Admin upgrade required; Vite is not an application route handler in the deployed Store API or Storefront. |
| `ajv@6.12.6`, `ajv@8.13.0` | `>=6.14.0`, `>=8.18.0` | `eslint -> @eslint/eslintrc -> ajv`; `backend -> Medusa CLI -> Mikro ORM migrations -> Rushstack -> ajv` | Lint / migration tooling | `DEV_ONLY` | Parent upgrades required; migration tooling is operator-only. |
| `fast-xml-parser@5.7.0` | `>=5.7.0` | `backend -> Medusa framework -> AWS SDK XML builder -> fast-xml-parser` | Backend dependency | `PRODUCTION_NOT_REACHABLE` | FriggaFrio does not configure AWS DynamoDB; patched same-major pin is installed. |
| `@tanstack/start-server-core@1.159.4` | `>=1.167.30` | `storefront -> @tanstack/react-start -> react-start-server/start-plugin -> start-server-core` | Storefront SSR server | `PRODUCTION_REACHABLE` for the moderate advisory | A direct `1.167.30` override was tested and rejected because it broke the SSR build (`#tanstack-start-plugin-adapters` export missing). Keep the supported 1.159 family until the complete TanStack family can be upgraded together; H3 itself is patched by the explicit alias override. |
| `uuid@10.0.0` | `>=11.1.1` | `backend -> email-preview-server -> resend -> svix -> uuid`; `backend -> Medusa event bus -> bullmq -> uuid` | Email preview / queue support | `DEV_ONLY` and `PRODUCTION_NOT_REACHABLE` | Email preview is not deployed; BullMQ does not pass attacker-controlled UUID options. Update only with Medusa compatible queue dependencies. |
| `qs@6.14.2` | `>=6.15.2` | `backend -> Medusa CLI/utils -> express -> qs` | Framework dependency | `PRODUCTION_NOT_REACHABLE` | Medusa Store API input validation rejects the affected option shape; update through Medusa Express dependency refresh. |
| `turbo@2.8.7` | `>=2.9.14` | `root -> turbo` | Build orchestration | `BUILD_ONLY` | Upgrade in a standalone CI tooling wave. |
| `react-router@6.30.4`, `react-router-dom@6.30.4` | `>=7.18.0`; one advisory no compatible 6.x fix | `backend -> @medusajs/dashboard -> react-router-dom -> react-router` | Admin static bundle | `PRODUCTION_NOT_REACHABLE` | Major migration must be delivered by Medusa Dashboard; do not override Admin router independently. |
| `@opentelemetry/core@2.7.1` | `>=2.8.0` | `backend -> Medusa deps -> OpenTelemetry resources -> core` | Instrumentation | `PRODUCTION_NOT_REACHABLE` | Upgrade with Medusa dependency set. |
| `@babel/core@7.26.10` | `>=7.29.6` | `backend -> email-preview-server -> Babel` | Email preview build | `DEV_ONLY` | Update through email-preview-server. |
| `js-yaml@3.15.1` | `>=3.15.1` | `backend -> jest -> Istanbul -> load-nyc-config -> js-yaml` | Test runner | `FALSE_POSITIVE_OR_NOT_APPLICABLE` | Patched pin installed; no high finding remains for this package. |

## Release gate

- `CRITICAL_PRODUCTION_REACHABLE=0`
- `HIGH_PRODUCTION_REACHABLE=0`
- Raw audit is not clean and is not represented as clean.
- Build-only and non-reachable exceptions above must be re-reviewed before the
  listed expiry or before a Medusa/TanStack/Vite upgrade.
- `minimatch@9.0.7` resolves `brace-expansion@5.0.9`; no brace-expansion
  finding remains in the current lockfile. A direct `brace-expansion@2.1.4`
  override was rejected because it broke the Medusa build API
  (`expand is not a function`).
- A direct `@tanstack/start-server-core@1.167.30` override was rejected
  because it broke the Storefront SSR build (missing
  `#tanstack-start-plugin-adapters`). The supported TanStack 1.159 family is
  retained while its patched `h3-v2` alias is pinned separately.
