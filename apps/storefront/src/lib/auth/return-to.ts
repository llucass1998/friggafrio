const COUNTRY_CODE = /^[a-z]{2}$/i

const hasControlCharacter = (value: string): boolean =>
  Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0)
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)
  })

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
    hasControlCharacter(candidate)
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

    if (parsed.pathname === `${fallback}/account/login`) {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
