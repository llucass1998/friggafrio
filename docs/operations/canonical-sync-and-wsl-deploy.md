# Canonical Git Sync and WSL Deployment

## FRIGGAFRIO_CANONICAL_SYNC_AND_WSL_DEPLOY

`origin/Maestro` is the authoritative release reference. The canonical flow is:

```text
Windows Maestro
  -> validation
  -> one reviewed commit
  -> push origin/Maestro
  -> WSL Maestro Git fast-forward
  -> WSL preflight
  -> release backup metadata
  -> clean WSL deploy clone checkout
  -> build and systemd restart
  -> local healthchecks
  -> public URL verification
  -> rollback on failure
```

"Synchronized" means commit SHA equality. It never means copied files.

## Ownership

- Development source: `C:/Users/lluca/orca/workspaces/projeto friggagafrio/Maestro` on `Maestro`.
- Authoritative release reference: `origin/Maestro`.
- WSL source mirror: `/home/srv/friggafrio/Maestro`.
- WSL release checkout: `/home/srv/friggafrio/Maestro-deploy`.
- Production runtime ownership: WSL and its declared systemd services.

The release checkout is immutable except for an explicit detached Git checkout in a release. It must never contain local source changes or commits. Do not use it for development.

Never use `cp`, `rsync`, shared-folder mirroring, bidirectional sync, or WSL-to-Windows copy-back. Never transfer `.env` through Git. Database data, Redis data, uploads, volumes, Caddy, DNS, and secrets are machine-owned and preserved.

## Windows workflow

1. Work only in Windows Maestro.
2. Run relevant tests, `pnpm worktree:check`, `pnpm policy:check`, and `pnpm source:sync:check`.
3. Review the diff and secret scan.
4. Create one cohesive commit and push it to `origin/Maestro`.
5. Confirm Windows and `origin/Maestro` SHA equality.

Windows cannot deploy. `pnpm deploy:preflight`, `pnpm deploy:wsl`, `pnpm deploy:verify`, and `pnpm deploy:rollback` fail closed outside WSL.

## WSL release workflow

Start only after WSL has been stable and has no recent `InitTerminateInstanceInternal` or poweroff event.

1. Confirm WSL source and deploy clone are clean.
2. Run `pnpm deploy:preflight`. It verifies WSL identity, canonical paths, branch, SHA, `.env` presence without displaying it, Docker/Compose availability, services, health, lock, backup location, and instability evidence.
3. Run `pnpm deploy:wsl -- --apply` only for an approved SHA. It performs the only permitted WSL source sync: `git pull --ff-only origin Maestro`.
4. The release records the previous deploy SHA and an `.env` checksum in protected backup metadata; it never copies `.env`.
5. The release checkout moves only through a detached Git checkout. The existing build and systemd strategy is used; no volume removal or destructive Compose action is permitted.
6. `pnpm deploy:verify` verifies backend, Store API using an existing key without displaying it, storefront, public URL, and prints `DEPLOYED_COMMIT_SHA`.
7. A failed verification restores only the previous application revision. It does not reset the database, delete uploads, modify `.env`, or remove volumes.

## SHA and rollback evidence

The release report contains `SOURCE_SHA`, `REMOTE_SHA`, `PREVIOUS_DEPLOY_SHA`, `DEPLOYED_COMMIT_SHA`, backup metadata, healthchecks, and public URL status.

For the current systemd WSL runtime, the detached release checkout revision is the deployment identity. If the runtime is later moved to container images, the same SHA must become a non-secret image label and equal `DEPLOYED_COMMIT_SHA`.

## Current clone boundary

`Maestro-deploy` was observed dirty during the P0 incident. Do not clean, replace, or recreate it while WSL is unstable. After recovery, validate or create a separate clean release-only clone through the Git procedure and backup metadata. Never use destructive reset, deletion, `wsl --unregister`, or manual source copy.
