# FriggaFrio - Worktree Policy

## Canonical Local Worktree

    CANONICAL_LOCAL_WORKTREE: Discovered via git worktree list --porcelain (refs/heads/Maestro)
    LOCAL_BRANCH:             Maestro
    POLICY:                   FAIL_CLOSED
    CI:                       PATH_AGNOSTIC (GITHUB_ACTIONS only)

## Guard Script

- **File:** scripts/worktree-guard.mjs
- **Check command:** pnpm worktree:check
- **Discovery:** git worktree list --porcelain -> finds worktree bound to refs/heads/Maestro
- **Validation:** Current worktree path AND current branch must match

## Integration Points

| Script | Package | Guard Hook |
|--------|---------|------------|
| dev | root | predev |
| backend:dev | root | prebackend:dev |
| storefront:dev | root | prestorefront:dev |
| dev | storefront | predev |
| dev | backend | predev |
| seed | backend | preseed |
| start | backend | prestart |

## Two-Layer Protection

### Layer 1 - Orchestrator/IDE

The guard cannot prevent file edits in other worktrees.
Every agent/IDE session MUST use the Maestro worktree as workspace.
Every agent MUST begin by running: pnpm worktree:check

### Layer 2 - Project Guard (Automatic)

Blocks execution of protected scripts (dev, seed, start) when run
from a non-canonical worktree. Works automatically via pnpm pre-scripts.

## CI Bypass

- GITHUB_ACTIONS=true: Allowed (project CI uses GitHub Actions exclusively)
- CI=true: NOT allowed (too permissive, can be set locally)
- No override flags exist: No --force, --skip-check, IGNORE_WORKTREE, etc.

## What the Guard Does NOT Do

- Run git switch/checkout/reset/clean
- Move or copy files
- Auto-correct anything
- Provide override mechanisms

It only VALIDATES or BLOCKS.

## Legacy Worktrees

Worktrees created before the guard was implemented do NOT inherit the
protection. Only worktrees created from commits AFTER the guard was merged
will have the predev hooks.

## Agent Instructions

1. Set workspace to the Maestro worktree
2. Run pnpm worktree:check as first command
3. If FAIL -> STOP immediately. Do not proceed.
4. Never set GITHUB_ACTIONS=true locally to bypass the guard
5. Never create bypass environment variables or flags