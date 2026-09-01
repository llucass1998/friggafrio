# FriggaFrio Current Release State

- Production SHA: `867780f6c01aedb096c77f8f3e4ac4da41e5e770`.
- Release status: published through immutable replacement after frozen install, Medusa runtime materialization, backup validation, and bounded readiness.
- WSL source mirror: synchronized to the deployed SHA.
- Production database: backup validated before the release; no migration, seed, or restore was performed.
- Preserved failed candidate: `/home/srv/friggafrio/Maestro-deploy-failed-20260824T135300Z` remains available for forensics.
- Public status at record time: `/health` 200, `/br` 200, `/app` and `/app/` 200, Admin assets 200, and anonymous `/admin/products?limit=1` 401 JSON.
- Admin API resilience: the Storefront now proxies only `/admin` and `/admin/*` to its local Medusa backend when an external catch-all ingress sends those requests to the Storefront.
- Next deploy gate: use the immutable workflow with a new official candidate and retain public route validation.
- External configuration: Resend API and webhook values remain pending; this does not block independent site functionality.
- P0 recovery branch: `fix/admin-maps-runtime-alignment` is isolated from the payment patch and contains only the provider/upload, Maps build, and runtime guard corrections. It is not deployed yet.
- Required machine-owned release settings before the next deploy: `FILE_LOCAL_UPLOAD_DIR`, `FILE_LOCAL_BACKEND_URL`, and `VITE_GOOGLE_MAPS_EMBED_API_KEY` (names only; values are never versioned or logged).
