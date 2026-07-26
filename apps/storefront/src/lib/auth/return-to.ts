const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/
const COUNTRY_CODE = /^[a-z]{2}$/i

export const defaultAuthenticatedPath = (countryCode: string): string => {
  const normalizedCountryCode = COUNTRY_CODE.test(countryCode)
    ? countryCode.toLowerCase()
    : "br"

  return `/${normalizedCountryCode}`
}

export const normalizeReturnTo = (
  returnTo: unknown,
  countryCode: string,
): string => {
  const fallback = defaultAuthenticatedPath(countryCode)
  if (typeof returnTo !== "string") {
    return fallback
  }

  const candidate = returnTo.trim()
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    CONTROL_CHARACTER.test(candidate)
  ) {
    return fallback
  }

  try {
    const parsed = new URL(candidate, "https://friggafrio.invalid")
    const expectedPrefix = `${fallback}/`
    if (
      parsed.pathname !== fallback &&
      !parsed.pathname.startsWith(expectedPrefix)
    ) {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
