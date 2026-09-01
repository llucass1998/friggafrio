# FriggaFrio Agent Policy

## Canonical source

Windows:
`C:/Users/lluca/orca/workspaces/projeto friggagafrio/Maestro`

WSL:
`/home/srv/friggafrio/Maestro`

Branch: `Maestro`

Remote: `origin/Maestro`

## Production checkout

`/home/srv/friggafrio/Maestro-deploy`

## Source synchronization

Código-fonte é sincronizado exclusivamente por Git:

Windows Maestro
-> origin/Maestro
-> WSL Maestro.

É proibido copiar source manualmente entre ambientes.

## Codex structural rule

Every Codex task must treat this flow as a fail-closed invariant:

```text
Windows Maestro -> origin/Maestro -> WSL Maestro -> deploy/wsl-deploy.sh
```

- Windows Maestro is the only development source.
- WSL Maestro is only a Git-synchronized source mirror.
- `Maestro-deploy` is release-only and never a source worktree.
- Production deployment is allowed only from WSL through `deploy/wsl-deploy.sh`.
- Do not use file copies, rsync, shared-folder mirroring, or WSL-to-Windows copy-back for source synchronization.
- Before a release, run `pnpm source:sync:check -- --deploy` in WSL and stop if it fails.

## Deployment ownership

PRODUCTION DEPLOYMENT = WSL ONLY.

Never deploy from Windows.

Never deploy from Nautilus.

## Production runtime

WSL + systemd.

Services:

- `friggafrio-backend.service` - backend `9000`
- `friggafrio-storefront.service` - storefront `5173`

## Runtime ownership

Somente systemd pode manter os processos permanentes de produção.

Never start a second production Medusa process.

## Forbidden actions

- Never edit `Maestro-deploy` as development source.
- Never disable production systemd services to solve a development problem.
- Never create automatic worktrees.
- Never use Nautilus as source of truth.
- Never guess ports.
- Never guess an Admin URL.
- Never manually copy source to WSL.
- Never overwrite production `.env`.
- Never use force push.
- Never run destructive Git automatically.

## Git policy

One cohesive commit por wave.

No AI co-author trailer.

Do not commit `.env`, secrets, runtime logs or temporary screenshots.

## Deployment pipeline

Windows Maestro
-> validation
-> commit
-> push origin/Maestro
-> WSL Maestro sync
-> `deploy/wsl-deploy.sh`
-> Maestro-deploy
-> build
-> systemd
-> healthcheck
-> Caddy
-> public smoke QA.

## Deployment SHA rule

`SOURCE_SHA`, `REMOTE_SHA`, `WSL_SOURCE_SHA` and `DEPLOY_SHA` precisam representar a mesma release.

## Environment policy

Secrets permanecem machine-specific.

`.env` nunca é transferido via Git.

## Safety

DB, Redis, uploads, `.env`, Caddy e DNS devem ser preservados salvo task explícita que exija alteração.

## P0 recovery guards

- A release must prove runtime SHA/CWD/PID alignment after a service restart; health from an old resident process is not release evidence.
- File uploads must use a complete S3/R2 configuration or the official local provider with a persistent machine-owned directory and public URL.
- Vite Maps configuration is build-time input. A deploy preflight must fail before build when Maps is required and `VITE_GOOGLE_MAPS_EMBED_API_KEY` is absent.
- Upload responses must be validated before product/company image state is mutated; an empty URL is never a valid image.
- If WSL Git ownership is mixed, fix only the explicitly authorized regular file or use a clean clone as `srv`; never use recursive ownership changes.

## FRIGGAFRIO_CANONICAL_SYNC_AND_WSL_DEPLOY

## FRIGGAFRIO_TWO_ENVIRONMENTS_ONLY

## FRIGGAFRIO_SOURCE_INTEGRITY_GUARD

## TESTS_AND_REGRESSION_MUST_NEVER_RESTORE_OR_MODIFY_SOURCE

Tests and regression commands must be observational with respect to source.
They may create only excluded generated artifacts and must never restore,
overwrite, remove, stash, reset, revert, or copy source files. Snapshot source
before a focused wave and verify it afterwards with the source-integrity guard.

Before any focused test wave, create a source manifest with
`pnpm source:integrity:snapshot`. After the wave, run
`pnpm source:integrity:verify`. If source files under backend/storefront `src`,
scripts, config, or package manifests differ, the guard fails with
`SOURCE_MUTATION_DURING_TEST` and writes mutation evidence to the system
temporary directory. The guard never restores, deletes, resets, or overwrites
source. Run test/cleanup commands through `node scripts/source-integrity-guard.mjs run -- <command> <args>`; destructive Git commands and source-copy operations are rejected with
`DESTRUCTIVE_COMMAND_BLOCKED`.

Only two operational environments exist: Windows `Maestro` for development and
validation, and WSL for Git-synchronized release/deployment. GitHub is transport
only. Never develop in WSL or in `Maestro-deploy`.

Shipping is backend-authoritative. `SHIPPING_POLICY_VERSION` and all commercial
values live in `apps/backend/src/utils/commercial-shipping-policy.ts`; changing
prices or coverage must change configuration and its tests, not frontend logic.
Pickup is only `FriggaFrio Loja 1` and is always zero-priced.

Known prevention guards:

- `LOCAL_ADMIN_UPLOAD_PROVIDER_MISCONFIGURED`: startup asserts local file storage
  and the upload URL is covered by provider tests.
- `INVALID_PRODUCT_IMAGE_WITHOUT_URL`: gallery state accepts an image only after
  a non-empty upload URL is validated.
- `WORKFLOW_CONTAINER_RESOLVE_TYPE_LOSS`: workflow typecheck is a required gate.
- `CHECKOUT_CEP_NOT_CONNECTED`: CEP lookup is exercised by Checkout and PDP tests.
- `SHIPPING_STALE_SELECTION`: prepare revalidates the persisted shipping method,
  amount, currency, and cart total server-side.
- `FRIGGAFRIO_THREE_MODALITIES_HIDDEN_BY_ELIGIBILITY_FILTER`: checkout always
  renders pickup, Carro FriggaFrio, and Motoboy in fixed order; unavailable
  cards remain visible, disabled, and explain the server-derived reason.
- `FRIGGAFRIO_SINGLE_STORE_PICKUP`: pickup is restricted to Loja 1, starts as
  `awaiting_preparation`, and only an authenticated Admin operator can make the
  advisory-lock-protected `ready_for_pickup` then `collected` transitions.
- `MERCADO_PAGO_WEBHOOK_IDEMPOTENCY`: webhook event and operation tables use
  unique idempotency keys and duplicate races return an accepted duplicate.
- `MERCADO_PAGO_SECRET_BOUNDARIES`: Mercado Pago provider is opt-in only when
  sandbox credentials and both payment flags are present; otherwise it fails closed.
- `ACCESSIBILITY_SOURCE_OR_RUNTIME_REGRESSION`: the approved Local button and
  panel are compared with the WSL release source by SHA-256. The regression
  suite verifies focus-visible styling, semantic icon, mobile safe-area sizing,
  Dialog description, focus return, and typed preference updates.

This is a fail-closed rule for every human, script, and Codex task:

```text
Windows Maestro -> validation -> commit -> origin/Maestro -> WSL Maestro -> WSL deploy clone -> public verification
```

- `origin/Maestro` is the authoritative release reference. Windows Maestro is the only development worktree.
- Synchronize source only through Git. Manual copies, `cp`, `rsync`, shared-folder mirrors, and WSL-to-Windows copy-back are forbidden.
- The WSL source is a Git mirror. The WSL deploy clone is release-only: do not edit source, commit there, or tolerate local source changes.
- Production deployment is WSL-only. Windows and Nautilus deployment commands must fail before making runtime changes.
- Run `pnpm source:sync:check` before a release and `pnpm source:sync:check -- --deploy` from the WSL source before an apply.
- A release requires equal Windows, `origin/Maestro`, WSL source, and deploy SHA values, a clean source/deploy clone, required local secrets, healthy dependencies, a deployment lock, backup metadata, and public URL verification.
- A recent `InitTerminateInstanceInternal`, WSL poweroff, or unstable backend/storefront is a hard deploy block: `DEPLOY_BLOCKED_WSL_UNSTABLE=YES`.
- Never delete or reset databases, `.env`, uploads, Docker volumes, or release history. Never use `docker compose down -v`, Docker prune, or volume removal in a release workflow.
- Every sync/deploy report must state SHA values, backup/rollback state, healthcheck results, and public URL result. Do not claim a deployment completed without public verification.

## Mandatory Operational Learning

Before any WSL source sync, build, migration, service restart, or deployment, read these files in full:

- `docs/operations/FRIGGAFRIO_WSL_DEPLOY_RUNBOOK.md`
- `docs/operations/FRIGGAFRIO_INCIDENT_HISTORY.md`
- `docs/operations/FRIGGAFRIO_CURRENT_RELEASE_STATE.md`
- `docs/operations/FRIGGAFRIO_FAILURE_KNOWLEDGE_BASE.md`

Known incident signatures must be handled through their recorded resume gate instead of reinvestigated. A newly proven failure is only `LEARNED_AND_PREVENTED` after it has a versioned test, guard, preflight, or deploy check and its entry is added to the incident history and knowledge base.

The public ingress can be external to WSL. Never edit the WSL Caddy configuration merely because an external domain fails. Identify the active ingress and prove its configuration ownership first. For Medusa Admin, `GET /app` must return HTTP 200 both internally and from the configured public origin before an immutable release swap. If internal `/app` is 200 and public `/app` is 404, stop before the swap with `DEPLOY_BLOCKED_PUBLIC_ADMIN_INGRESS_ROUTE_MISSING` and require the external ingress operator.
