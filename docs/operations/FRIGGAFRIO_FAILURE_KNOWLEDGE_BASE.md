# FriggaFrio Failure Knowledge Base

| Signature | Proven cause | Prevention | Resume gate |
| --- | --- | --- | --- |
| `ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE` | pnpm 10 deploy requires legacy behavior for this workspace | Explicit `pnpm deploy --legacy --prod` plus contract test | Re-run materialization in a fresh candidate |
| Missing Medusa Admin runtime | Production process started outside generated build server | Systemd runtime contract and Admin asset preflight | Build then materialize `.medusa/server` |
| External pnpm link | Deploy stage retained a link outside runtime | Self-contained node_modules guard | Remove only authorized self-link, reject all others |
| Health probe immediately refused after restart | Backend had not opened its port | 60-second monotonic readiness polling with three consecutive 200s | Wait for readiness, do not roll back on initial refusal |
| Dirty legacy release | In-place sync cannot safely overwrite release-only clone | Explicit immutable replacement with manifest and atomic rename | Build a new official candidate |
| Public `/app` 404 and internal `/app` 200 | External ingress lacks Admin route | Public Admin ingress preflight and regression test | Correct the loaded external proxy config before swap |
| Public `/admin/*` falls through to Storefront | External catch-all masks the Admin API | Storefront server-side Admin proxy with unit coverage preserves method, query, cookies, and upstream status | Deploy the proxy fallback, then require anonymous `401 JSON` |
| Caddy WSL failed while domain responds | WSL Caddy is not public ingress | Ingress ownership rule in `AGENTS.md` and runbook | Identify external proxy host and operator |
| Resend missing | External runtime configuration absent | Fail-closed integration behavior | Configure values through approved secret management |
| `BACKEND_PROCESS_ARTIFACT_RELEASE_MISMATCH` | A resident backend process started before the generated release artifacts | Record release SHA in the runtime, validate service CWD/PID after restart, require three readiness 200s | Restart the controlled service and run runtime SHA verification |
| `WSL_CANONICAL_GIT_INDEX_ROOT_OWNED` | WSL Git index/objects were owned by root, blocking the `srv` operator | Preflight checks the index as a regular non-symlink file and reports a point fix; never run recursive ownership changes | Use a clean Git clone as `srv` when object permissions are mixed |
| `VITE_MAPS_BUILD_ENV_MISSING` | `VITE_GOOGLE_MAPS_EMBED_API_KEY` existed only after or outside the Vite build environment | Preserve existing `VITE_*` values during env projection and fail before build when Maps is required without the key | Provide the public key in the machine-owned storefront build environment |
| `FILE_PROVIDER_CONFIGURATION_MISSING` | Medusa always selected the S3 provider even though neither S3 nor R2 credentials were configured | Select the supported local provider only when S3/R2 is incomplete; require persistent upload directory and URL in production | Configure `FILE_LOCAL_*` or a complete S3/R2 provider before deploy |
| `UPLOAD_RESPONSE_WITHOUT_URL` | A failed/invalid upload response could be forwarded as an image entry without a URL | Validate the upload response before state mutation and block invalid image payloads | Retry after the provider health check passes |
| `IMMUTABLE_ROLLBACK_INTERACTIVE_SUDO` | Rollback used an interactive sudo call after services had stopped | Unit backup is byte-for-byte, unchanged units are skipped, and changed units use `sudo -n` | Use the immutable candidate only after `immutable-release-replacement.test.mjs` passes |

An entry is `LEARNED_AND_PREVENTED` only when its prevention is executable or testable in the repository. The public Admin ingress incident is covered by the preflight guard, regression test, and the narrow Storefront Admin fallback deployed in `867780f6c01aedb096c77f8f3e4ac4da41e5e770`.
