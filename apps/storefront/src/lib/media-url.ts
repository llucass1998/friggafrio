const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"])
const PUBLIC_MEDIA_HOSTNAMES = new Set(["friggafrio.istigestao.com.br"])

type MediaRuntime = {
  hostname?: string
  isDevelopment?: boolean
}

export const isLoopbackMediaUrl = (value: string | null | undefined): boolean => {
  if (!value?.trim()) return false
  try {
    return LOCAL_HOSTNAMES.has(new URL(value).hostname.toLowerCase())
  } catch {
    return false
  }
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
  const mediaHostname = url.hostname.toLowerCase()

  // A loopback URL persisted by an older upload provider only resolves on the
  // machine that wrote it. Never send public visitors to their own localhost.
  if (isLoopbackMediaUrl(value) && (!isDevelopment || !LOCAL_HOSTNAMES.has(runtimeHostname))) {
    return undefined
  }

  if (!isDevelopment || !LOCAL_HOSTNAMES.has(runtimeHostname) || !PUBLIC_MEDIA_HOSTNAMES.has(mediaHostname)) {
    return value
  }

  return `http://localhost:9000${url.pathname}${url.search}`
}
