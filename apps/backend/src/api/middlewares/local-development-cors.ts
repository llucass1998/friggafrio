import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])
const LOCAL_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
])

const getHostname = (value: string | undefined): string | null => {
  if (!value) return null

  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname.replace(/^\[|\]$/g, "")
  } catch {
    return null
  }
}

/** Keeps local forwarded runtime checks isolated from public CORS policy. */
export const allowLocalDevelopmentCors = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): void => {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : null
  const requestHost = getHostname(
    typeof req.headers.host === "string" ? req.headers.host : undefined,
  )

  if (!origin || !LOCAL_ORIGINS.has(origin) || !requestHost || !LOCAL_HOSTS.has(requestHost)) {
    next()
    return
  }

  res.setHeader("Access-Control-Allow-Origin", origin)
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Publishable-Api-Key")
  res.setHeader("Vary", "Origin")

  if (req.method.toUpperCase() === "OPTIONS") {
    res.status(204).end()
    return
  }

  next()
}
