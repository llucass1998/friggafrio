# FriggaFrio Failure Knowledge Base

| Signature | Proven cause | Prevention | Resume gate |
| --- | --- | --- | --- |
| `ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE` | pnpm 10 deploy requires legacy behavior for this workspace | Explicit `pnpm deploy --legacy --prod` plus contract test | Re-run materialization in a fresh candidate |
| Missing Medusa Admin runtime | Production process started outside generated build server | Systemd runtime contract and Admin asset preflight | Build then materialize `.medusa/server` |
| External pnpm link | Deploy stage retained a link outside runtime | Self-contained node_modules guard | Remove only authorized self-link, reject all others |
| Health probe immediately refused after restart | Backend had not opened its port | 60-second monotonic readiness polling with three consecutive 200s | Wait for readiness, do not roll back on initial refusal |
| Dirty legacy release | In-place sync cannot safely overwrite release-only clone | Explicit immutable replacement with manifest and atomic rename | Build a new official candidate |
| Public `/app` 404 and internal `/app` 200 | External ingress lacks Admin route | Public Admin ingress preflight and regression test | Correct the loaded external proxy config before swap |
| Caddy WSL failed while domain responds | WSL Caddy is not public ingress | Ingress ownership rule in `AGENTS.md` and runbook | Identify external proxy host and operator |
| Resend missing | External runtime configuration absent | Fail-closed integration behavior | Configure values through approved secret management |

An entry is `LEARNED_AND_PREVENTED` only when its prevention is executable or testable in the repository. The public Admin ingress incident is covered by the preflight guard and regression test, but remediation still requires authorized access to the external host.
