# WSL OpenVPN deployment

The WSL application listens on all interfaces. Caddy reaches it through the
OpenVPN address `172.25.20.159`; this private address must not be embedded in
the public storefront bundle.

The WSL deployment exposes the Medusa Admin dashboard at `/app` through the
backend upstream. Keep the dashboard enabled for the admin login handoff.

Set the public origin in the WSL deployment environment before building:

```sh
VITE_MEDUSA_BACKEND_URL=https://YOUR_PUBLIC_DOMAIN
VITE_MEDUSA_ADMIN_URL=https://YOUR_PUBLIC_DOMAIN
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

For Caddy, pass the same public HTTPS origin for the storefront and backend
arguments, then rebuild both the backend and storefront. For a direct WSL
smoke test, the helper points the admin handoff at the backend origin so
`/app` remains reachable.

The deployment checkout is on the `Maestro` branch, so the existing worktree
guard continues to validate it without a bypass.
