# WSL OpenVPN deployment

The WSL application listens on all interfaces. Caddy reaches it through the
OpenVPN address `172.25.20.159`; this private address must not be embedded in
the public storefront bundle.

The WSL release keeps `DISABLE_MEDUSA_ADMIN=false` because `/app` is served by
the production Medusa build. The backend systemd service runs from
`apps/backend/.medusa/server` after the deploy preflight verifies the generated
Admin index and its referenced assets. After the backend build, the release
uses the root frozen lockfile to materialize production dependencies and places
them in `.medusa/server/node_modules` before the service can restart.

Set the public origin in the WSL deployment environment before building:

```sh
VITE_MEDUSA_BACKEND_URL=https://YOUR_PUBLIC_DOMAIN
STOREFRONT_URL=https://YOUR_PUBLIC_DOMAIN
STORE_CORS=https://YOUR_PUBLIC_DOMAIN
AUTH_CORS=https://YOUR_PUBLIC_DOMAIN
ADMIN_CORS=https://YOUR_PUBLIC_DOMAIN
```

Use the included helper rather than editing secrets by hand. For the direct
OpenVPN smoke test, run:

```sh
bash deploy/wsl/configure-network.sh . \
  http://172.25.20.159:5173 \
  http://172.25.20.159:9000
```

For Caddy, pass the same public HTTPS origin for both final arguments, then
rebuild the storefront.

Before the next release, install the versioned backend service contract once:

```sh
sudo bash deploy/wsl-install-backend-service.sh --apply
```

The deployment checkout is on the `Maestro` branch, so the existing worktree
guard continues to validate it without a bypass.
