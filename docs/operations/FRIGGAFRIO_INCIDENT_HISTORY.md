# FriggaFrio Incident History

## FF-20260824-PUBLIC-ADMIN-404

- Date and SHA: 2026-08-24; candidate `26c019e0a812f8c2c07eef493799c5464079246f`.
- Failed stage: post-swap public functional verification.
- Sanitized signature: internal `GET /app` = 200 and public `GET /app` = 404, with public `Via: Caddy`.
- Proven cause: the active public Caddy is external (`177.70.8.202:443`), while WSL has no public TLS listener and its failed Caddy unit is not the serving ingress.
- Non-working action avoided: editing `/etc/caddy/Caddyfile` in WSL without ownership proof.
- Definitive correction: add `/app` and `/app/*` ahead of the Storefront fallback in the externally active Caddy, using the same backend upstream as `/health`. The deployed Storefront also has a narrow server-side `/admin` fallback that proxies only that namespace to local Medusa if an external catch-all misses the Admin API.
- Early detection: `verify_public_admin_ingress` runs in WSL preflight and blocks before the release swap when internal Admin is 200 but public Admin is not.
- Regression coverage: `scripts/deploy/public-admin-ingress.test.mjs`.
- Rollback: restore the external ingress configuration backup and gracefully reload it; release rollback remains available independently.
- Last approved gate: candidate build, runtime materialization, Admin assets, immutable preflight, backup, swap, and backend readiness.
- Resume gate: run the standard immutable workflow from a new approved SHA; retain external route validation and the Storefront Admin fallback test.
- Status: resolved in release `867780f6c01aedb096c77f8f3e4ac4da41e5e770`; prevention versioned.

## FF-20260824-P0-RUNTIME-UPLOAD-MAPS

- Date and SHA: 2026-08-24; diagnostic branch based on `8602ff2a2a78ffd768a1948a14b1d7c33702e17f`.
- Failed stages: Admin upload returned 500; a later product update received an image without `url`; the public Storefront build did not contain the Maps key.
- Proven causes: no S3/R2 variables were present while `medusa-config.ts` always selected `file-s3`; the upload UI did not reject an empty URL; Vite only injects `VITE_*` during build and the projection script replaced the existing Maps value.
- Correction: select `@medusajs/file-local` when object storage is not fully configured, serve public local uploads through a traversal-safe `/uploads/:file_key` route, validate upload responses, preserve `VITE_*` values, and add deploy preflights for provider/Maps configuration.
- Non-working attempt: adding a Maps variable after the build; it cannot change an already generated Vite bundle.
- Regression coverage: local provider upload smoke, public-upload path unit tests, storefront build-env test, typechecks, builds and route lint.
- Rollback: restore the previous release and keep machine-owned upload data untouched; no migration is involved.
- Resume gate: configure machine-owned `FILE_LOCAL_*` and `VITE_GOOGLE_MAPS_EMBED_API_KEY`, then run the immutable WSL deploy and authenticated Admin smoke.
- Status: code correction validated locally; public deployment validation remains pending the controlled release gates.

## Imported proven deployment knowledge

- pnpm 10 workspace deployment requires explicit `pnpm deploy --legacy --prod`.
- Medusa production runtime starts in `apps/backend/.medusa/server`, where `public/admin/index.html` is generated.
- Runtime dependencies must be materialized after the final Medusa build; only the authorized pnpm self-link may be removed and all other external links are blocked.
- Immutable replacement preserves a dirty legacy deploy clone by atomic rename; it never loosens the in-place sync guard.
- Backend readiness is bounded to 60 seconds, uses a monotonic clock, permits startup connection refusal, and requires three consecutive 200 responses.
