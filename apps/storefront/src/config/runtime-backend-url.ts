const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "::1"])
const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"])

const normalizeConfiguredUrl = (configuredUrl: string | undefined): string | null => {
  const candidate = configuredUrl?.trim().replace(/\/+$/, "")
  if (!candidate) return null

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    throw new Error("VITE_MEDUSA_BACKEND_URL invalida. Use uma URL HTTP ou HTTPS.")
  }

  if (
    !SUPPORTED_PROTOCOLS.has(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("VITE_MEDUSA_BACKEND_URL invalida. Use uma origem HTTP ou HTTPS sem credenciais.")
  }

  return candidate
}

/**
 * Local storefront previews must use an explicitly configured local API when
 * present, while preventing a production origin from being used locally.
 */
export function resolveMedusaBackendUrl(
  configuredUrl: string | undefined,
  runtimeHostname?: string,
): string {
  const hostname = runtimeHostname?.trim().toLowerCase()
  const normalizedUrl = normalizeConfiguredUrl(configuredUrl)

  if (hostname && LOCALHOST_NAMES.has(hostname)) {
    if (normalizedUrl) {
      const configuredHost = new URL(normalizedUrl).hostname.toLowerCase().replace(/^\[|\]$/g, "")
      if (LOCALHOST_NAMES.has(configuredHost)) {
        return normalizedUrl
      }
    }

    return hostname === "127.0.0.1" ? "http://127.0.0.1:9000" : "http://localhost:9000"
  }

  if (!normalizedUrl) {
    throw new Error("VITE_MEDUSA_BACKEND_URL nao foi configurada. Verifique seu arquivo .env.")
  }

  return normalizedUrl
}
