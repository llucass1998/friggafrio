import { request as httpRequest, type IncomingMessage, type ServerResponse } from "node:http"
import type { Connect } from "vite"

const ADMIN_PROXY_ORIGIN = "http://127.0.0.1:9000"

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
])

function forwardedHeaders(headers: Headers) {
  const result = new Headers(headers)
  for (const header of Array.from(HOP_BY_HOP_HEADERS)) result.delete(header)
  result.delete("host")
  return result
}

function upstreamUrl(request: Request) {
  const incoming = new URL(request.url)
  if (incoming.pathname !== "/admin" && !incoming.pathname.startsWith("/admin/")) {
    throw new Error("ADMIN_PROXY_PATH_DENIED")
  }
  return new URL(`${incoming.pathname}${incoming.search}`, ADMIN_PROXY_ORIGIN)
}

/**
 * Keeps the Admin API reachable when an external catch-all proxy forwards an
 * /admin request to the Storefront. Only the Admin namespace is forwarded.
 */
export async function proxyAdminRequest(request: Request) {
  const method = request.method.toUpperCase()
  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers: forwardedHeaders(request.headers),
    redirect: "manual",
  }
  if (method !== "GET" && method !== "HEAD") {
    init.body = request.body
    init.duplex = "half"
  }

  const upstream = await fetch(upstreamUrl(request), init)
  const headers = forwardedHeaders(upstream.headers)
  headers.delete("content-length")
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

export const adminProxyHandlers = {
  GET: ({ request }: { request: Request }) => proxyAdminRequest(request),
  HEAD: ({ request }: { request: Request }) => proxyAdminRequest(request),
  OPTIONS: ({ request }: { request: Request }) => proxyAdminRequest(request),
  POST: ({ request }: { request: Request }) => proxyAdminRequest(request),
  PUT: ({ request }: { request: Request }) => proxyAdminRequest(request),
  PATCH: ({ request }: { request: Request }) => proxyAdminRequest(request),
  DELETE: ({ request }: { request: Request }) => proxyAdminRequest(request),
}

/**
 * Vite preview serves the Storefront fallback before TanStack route handlers
 * for multi-segment paths. Intercept the whole Admin namespace at the server
 * boundary so `/admin/products/:id` keeps the same path and credentials.
 */
export const adminProxyMiddleware: Connect.NextHandleFunction = (
  request: IncomingMessage,
  response: ServerResponse,
  next,
) => {
  const incoming = new URL(request.url ?? "/", "http://localhost")
  if (incoming.pathname !== "/admin" && !incoming.pathname.startsWith("/admin/")) {
    next()
    return
  }

  const headers = { ...request.headers }
  delete headers.host

  const upstream = httpRequest(
    {
      hostname: "127.0.0.1",
      port: 9000,
      method: request.method,
      path: `${incoming.pathname}${incoming.search}`,
      headers,
    },
    (upstreamResponse) => {
      response.statusCode = upstreamResponse.statusCode ?? 502
      for (const [name, value] of Object.entries(upstreamResponse.headers)) {
        if (value !== undefined) response.setHeader(name, value)
      }
      upstreamResponse.pipe(response)
    },
  )

  upstream.once("error", (error) => {
    if (response.headersSent) {
      response.destroy(error)
      return
    }
    next(error)
  })

  request.pipe(upstream)
}
