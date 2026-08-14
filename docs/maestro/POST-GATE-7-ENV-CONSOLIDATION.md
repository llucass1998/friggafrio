# Post-Gate-7 Local Environment Consolidation

The operational checkout is the `Maestro` worktree at
`C:\Users\lluca\orca\workspaces\projeto friggagafrio\Maestro`.

## Source of truth

- Private backend environment: `C:\Users\lluca\orca\secrets\friggafrio\backend.env`
- The private file is outside every Git worktree and is never committed.
- `scripts/local/sync-backend-env.ps1` projects it to the approved operational
  worktree only. Historical recovery worktrees are not synchronized by default.
- `scripts/local/sync-storefront-env.mjs` derives the active Medusa publishable
  key from the canonical database and creates the ignored storefront projection.

Both scripts are idempotent and report presence/state only; they never print
environment values.

## Runtime contract

- Medusa backend: `http://localhost:9000`
- Storefront: `http://localhost:5173`
- Brazil region: `Brasil`, `brl`, country `br`
- Store default region and publishable-key sales-channel association must exist
  before the storefront is started.
- Payment flags remain disabled; this maintenance does not start Gate 8.

## Safe local setup

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local/sync-backend-env.ps1
node scripts/local/sync-storefront-env.mjs .
pnpm --dir apps/backend dev
pnpm --dir apps/storefront dev --host 127.0.0.1 --port 5173
```

Do not copy the private backend environment into historical worktrees unless a
specific operational task requires it.
