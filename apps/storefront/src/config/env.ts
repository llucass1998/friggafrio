import { resolveMedusaBackendUrl } from "@/config/runtime-backend-url"

const rawBackendUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL?.trim()
const isBrowser = typeof window !== "undefined"
const runtimeHostname = isBrowser ? window.location.hostname : undefined

// Hostnames served by the production reverse proxy. The Medusa backend is
// reachable on the same origin for every one of them, so the browser SDK must
// target the visitor own origin: a fixed cross-domain base would make the
// login POST cross-site (origin rejected) and the host-only session cookie
// would never match the page the user actually opened.
const SAME_ORIGIN_BACKEND_HOSTS = new Set([
  "friggafrio.com.br",
  "friggafrio.istigestao.com.br",
])

// Server-side (SSR) always connects directly to the local backend to prevent
// hair-pinning through external proxies or deadlocking on preview servers.
// In the browser, runtimeHostname ensures the public origin or local dev origin is used.
export const MEDUSA_BACKEND_URL = !isBrowser
  ? (process.env.INTERNAL_MEDUSA_URL?.trim() || "http://127.0.0.1:9000")
  : sameOriginBackendUrl(runtimeHostname) ??
    resolveMedusaBackendUrl(rawBackendUrl, runtimeHostname)

function sameOriginBackendUrl(hostname?: string): string | null {
  if (!hostname || !SAME_ORIGIN_BACKEND_HOSTS.has(hostname.toLowerCase())) {
    return null
  }
  return `${window.location.protocol}//${window.location.host}`
}

export const MEDUSA_PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY?.trim() ?? ""
