# FriggaFrio Runtime and Deployment Policy

## Canonical release path

```text
WINDOWS MAESTRO
      |
      v
origin/Maestro
      |
      v
WSL Maestro
      |
      v
deploy/wsl-deploy.sh
      |
      v
Maestro-deploy
      |
      v
systemd
      |
      +--> 5173 storefront
      +--> 9000 backend
      |
      v
Caddy
      |
      v
friggafrio.istigestao.com.br
```

## Ownership

- **Windows Maestro** is the canonical development/source worktree. It may validate, commit and push; it never deploys production.
- **WSL Maestro** is the Git-synchronized source mirror and release input.
- **Maestro-deploy** is the production checkout. It is not a development workspace and must not be edited manually.
- **systemd** owns the permanent production Node processes through `friggafrio-backend.service` and `friggafrio-storefront.service`.
- **Caddy** is the public ingress and routes the public origin to the production runtime.

## Invariants

1. The release branch is `Maestro` and the release identity is a Git SHA.
2. `SOURCE_SHA`, `REMOTE_SHA`, `WSL_SOURCE_SHA` and `DEPLOY_SHA` must match before a release is accepted.
3. Production ports are backend `9000` and storefront `5173`.
4. A second manual Medusa process must never compete with the systemd backend.
5. Production `.env`, database, Redis, uploads, Caddy and DNS remain machine-owned and are not copied through Git.
6. The only production entrypoint is `deploy/wsl-deploy.sh`, executed inside WSL.
7. Source synchronization is Git-only: `Windows Maestro -> origin/Maestro -> WSL Maestro`.
8. Manual source copies in either direction, rsync, shared-folder mirrors, and direct edits in `Maestro-deploy` are forbidden.
9. `pnpm source:sync:check` is fail-closed: it validates the canonical source location, branch, Git identity, and, for a deployment check, the WSL-only release context.

## Guard commands

```text
pnpm worktree:check
pnpm policy:check
pnpm runtime:check
pnpm source:sync:check
pnpm release:check
```

The first three are read-only checks. `release:check` validates source hygiene and does not deploy or restart services.

## Troubleshooting

- If `WORKTREE` fails, change to the canonical Maestro worktree. Do not use Nautilus or create an automatic worktree.
- If a `.env` is tracked, remove it from Git tracking through an explicitly reviewed change; never print or copy its values.
- If a forbidden port or Admin origin is detected, correct the environment/configuration rather than disabling production services.
- If `DUPLICATE_RUNTIME_DETECTED` appears, identify the exact process owner before taking any runtime action. Never kill processes by a generic name.
- If a release SHA differs, stop and synchronize through `origin/Maestro`; never copy source files manually. A deployment must be initiated only inside WSL with `pnpm source:sync:check -- --deploy` followed by the reviewed WSL release procedure.
