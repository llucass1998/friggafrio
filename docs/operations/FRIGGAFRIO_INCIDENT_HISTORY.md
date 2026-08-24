# FriggaFrio Incident History

## FF-20260824-PUBLIC-ADMIN-404

- Date and SHA: 2026-08-24; candidate `26c019e0a812f8c2c07eef493799c5464079246f`.
- Failed stage: post-swap public functional verification.
- Sanitized signature: internal `GET /app` = 200 and public `GET /app` = 404, with public `Via: Caddy`.
- Proven cause: the active public Caddy is external (`177.70.8.202:443`), while WSL has no public TLS listener and its failed Caddy unit is not the serving ingress.
- Non-working action avoided: editing `/etc/caddy/Caddyfile` in WSL without ownership proof.
- Definitive correction: add `/app` and `/app/*` ahead of the Storefront fallback in the externally active Caddy, using the same backend upstream as `/health`.
- Early detection: `verify_public_admin_ingress` runs in WSL preflight and blocks before the release swap when internal Admin is 200 but public Admin is not.
- Regression coverage: `scripts/deploy/public-admin-ingress.test.mjs`.
- Rollback: restore the external ingress configuration backup and gracefully reload it; release rollback remains available independently.
- Last approved gate: candidate build, runtime materialization, Admin assets, immutable preflight, backup, swap, and backend readiness.
- Resume gate: obtain authorized admin access to `177.70.8.202`, validate and reload the active Caddy route, then run the immutable deployment from the latest approved SHA.
- Status: external pending; prevention versioned.

## Imported proven deployment knowledge

- pnpm 10 workspace deployment requires explicit `pnpm deploy --legacy --prod`.
- Medusa production runtime starts in `apps/backend/.medusa/server`, where `public/admin/index.html` is generated.
- Runtime dependencies must be materialized after the final Medusa build; only the authorized pnpm self-link may be removed and all other external links are blocked.
- Immutable replacement preserves a dirty legacy deploy clone by atomic rename; it never loosens the in-place sync guard.
- Backend readiness is bounded to 60 seconds, uses a monotonic clock, permits startup connection refusal, and requires three consecutive 200 responses.
