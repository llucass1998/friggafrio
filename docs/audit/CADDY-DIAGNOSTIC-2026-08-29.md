# Caddy read-only diagnostic

Date: 2026-08-29. No process was killed or restarted and no public service,
firewall, DNS, certificate, or Caddy configuration was modified.

## Observed state

- `caddy.service`: `failed`, exited with status `1` on 2026-08-27.
- Port `80`: owned by an existing `nginx` master (`nginx -g daemon off;`) and
  worker processes. Caddy is not the owner of the public HTTP port.
- Active `/etc/caddy/Caddyfile`: validates only after the site environment is
  supplied; with `FRIGGAFRIO_DOMAIN` absent, Caddy parses the outer block as a
  global options block and reports `unrecognized global option: encode`.
- Caddy logs: no retained journal entries for the unit in the inspected window.
- Certificates: no project-specific certificate files were discovered in the
  inspected `/etc/ssl` and `/var/lib/caddy` paths.
- No `import` directives are present in `/etc/caddy`.

## Configuration drift

The WSL active file is an older revision without the report-only Admin CSP and
routes `/app` through the general backend matcher. The canonical Windows
`deploy/Caddyfile.wsl` adds a dedicated `/app` matcher, Admin CSP, and upstream
environment variables. This drift is expected until the normal Git sync and
WSL-only deployment pipeline is explicitly run; it was not changed during this
diagnostic.

## Safe remediation plan (not executed)

1. Confirm the intended ingress owner with the operator. Either keep the
   existing Nginx service and route to the WSL upstream there, or schedule a
   controlled Caddy handover; do not run both on port 80.
2. On the WSL source mirror, synchronize from `origin/Maestro` through Git and
   run `pnpm source:sync:check -- --deploy` before any apply.
3. Provide the real `FRIGGAFRIO_DOMAIN` and upstream environment values on the
   Caddy host, then run `caddy validate --config /etc/caddy/Caddyfile` with the
   environment present.
4. Only after an approved maintenance window, reconcile the active Caddy/Nginx
   owner, certificates, and public smoke checks. No production NF-e or payment
   operation is part of this plan.

`CADDY_SERVICE_PREEXISTING_STATE=FAILED`
`CADDY_CURRENT_STATE=FAILED_CONFIGURATION_AND_PORT_CONFLICT`
`PORT_80_OWNER=nginx(pid=2122, workers=2194-2204)`
`CADDY_ROOT_CAUSE=FRIGGAFRIO_DOMAIN_UNSET_PLUS_PORT_80_ALREADY_BOUND`
