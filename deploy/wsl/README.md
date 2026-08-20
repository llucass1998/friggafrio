# WSL OpenVPN deployment

The WSL application listens on all interfaces. Caddy reaches it through the
OpenVPN address `172.25.20.159`; this private address must not be embedded in
the public storefront bundle.

The WSL storefront deployment sets `DISABLE_MEDUSA_ADMIN=true`, so the Medusa
Admin dashboard is not exposed through this public Caddy route.

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

The deployment checkout is on the `Maestro` branch, so the existing worktree
guard continues to validate it without a bypass.
