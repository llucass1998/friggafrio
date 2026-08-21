const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "::1"])

/**
 * Local storefront previews must use the canonical local API even when a
 * production env file was used to build the preview bundle.
 */
export function resolveMedusaBackendUrl(
  configuredUrl: string | undefined,
  runtimeHostname?: string,
): string {
  const hostname = runtimeHostname?.trim().toLowerCase()

  if (hostname && LOCALHOST_NAMES.has(hostname)) {
    return hostname === "127.0.0.1" ? "http://127.0.0.1:9000" : "http://localhost:9000"
  }

  const normalizedUrl = configuredUrl?.trim().replace(/\/+$/, "")
  if (!normalizedUrl) {
    throw new Error("VITE_MEDUSA_BACKEND_URL nao foi configurada. Verifique seu arquivo .env.")
  }

  return normalizedUrl
}
