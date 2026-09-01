# FriggaFrio WSL Deploy Runbook

Read this document, the incident history, the current release state, and the failure knowledge base before any WSL sync, build, migration, restart, or deploy.

## Required flow

1. Confirm the approved SHA is equal in the clean Windows clone, `origin/Maestro`, and `/home/srv/friggafrio/Maestro`.
2. Confirm internal and public `/health`, `/br`, and `/app` checks. The public origin is `https://friggafrio.istigestao.com.br`.
3. If internal `/app` is 200 while public `/app` is not 200, stop before the release swap. This is `PUBLIC_ADMIN_404_EXTERNAL_INGRESS_ROUTE_MISSING`, owned by the external ingress operator.
4. Use only `pnpm deploy:wsl -- --apply --immutable` from WSL with an approved SHA. Never reuse a failed candidate or the legacy deploy clone.
5. Require frozen install, Medusa build output, `pnpm deploy --legacy --prod`, a self-contained runtime, no external links, database and unit backups, and the immutable preflight.
6. Restart only the FriggaFrio backend and Storefront services. Readiness waits up to 60 seconds and requires three consecutive backend HTTP 200 responses.
7. Validate internal and public `/health`, `/br`, `/app`, and Admin assets; then observe stable PIDs and HTTP responses for 180 seconds.

## External ingress recovery

The WSL `caddy.service` is not necessarily the public ingress. Identify the process serving the domain from public headers, DNS, listener ownership, and the loaded configuration. Do not edit a local Caddy configuration without proving it serves the domain.

For `friggafrio.istigestao.com.br`, route `/app` and `/app/*` before the Storefront fallback to the same backend upstream already serving `/health`. Back up the loaded configuration, validate it with the proxy's official command, reload gracefully, and verify `/health`, `/br`, `/app`, and two Admin assets. Roll back the proxy configuration immediately on route regression.

## Rollback

If a post-swap readiness or functional check fails, preserve the failed candidate, restore the legacy release and backed-up systemd unit, daemon-reload, restart only the two FriggaFrio services, and verify public `/health` and `/br`. Do not restore the database automatically.
