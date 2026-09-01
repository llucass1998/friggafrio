const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"])
const PUBLIC_MEDIA_HOSTNAMES = new Set(["friggafrio.istigestao.com.br"])

type MediaRuntime = {
  hostname?: string
  isDevelopment?: boolean
}

/**
 * Product media can be stored as an absolute public URL. During a local
 * preview, route that same path through the canonical local backend so a
 * missing local upload fails quickly instead of leaving the browser waiting
 * on the public ingress.
 */
export const resolveMediaUrl = (value: string | null | undefined, runtime?: MediaRuntime): string | undefined => {
  if (!value?.trim()) return undefined

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return value
  }

  const runtimeHostname = (runtime?.hostname ?? (typeof window !== "undefined" ? window.location.hostname : "localhost")).toLowerCase()
  const isDevelopment = runtime?.isDevelopment ?? import.meta.env?.DEV === true
  if (!isDevelopment || !LOCAL_HOSTNAMES.has(runtimeHostname) || !PUBLIC_MEDIA_HOSTNAMES.has(url.hostname.toLowerCase())) {
    return value
  }

  return `http://localhost:9000${url.pathname}${url.search}`
}
