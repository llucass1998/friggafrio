const supportedProtocols = new Set(["http:", "https:"])

/** Keeps customer pages from forwarding arbitrary URLs into Admin. */
export const configuredAdminOrigin = (value: unknown): string | null => {
  if (typeof value !== "string" || value.trim() === "") return null

  try {
    const url = new URL(value.trim())
    if (!supportedProtocols.has(url.protocol) || url.username || url.password) {
      return null
    }
    return url.origin
  } catch {
    return null
  }
}
