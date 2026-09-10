import { resolveMedusaBackendUrl } from "@/config/runtime-backend-url"

const rawBackendUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL?.trim()
const isBrowser = typeof window !== "undefined"
const runtimeHostname = isBrowser ? window.location.hostname : undefined

// Server-side (SSR) always connects directly to the local backend to prevent
// hair-pinning through external proxies or deadlocking on preview servers.
// In the browser, runtimeHostname ensures the public origin or local dev origin is used.
export const MEDUSA_BACKEND_URL = !isBrowser
  ? (process.env.INTERNAL_MEDUSA_URL?.trim() || "http://127.0.0.1:9000")
  : resolveMedusaBackendUrl(rawBackendUrl, runtimeHostname)

export const MEDUSA_PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY?.trim() ?? ""
