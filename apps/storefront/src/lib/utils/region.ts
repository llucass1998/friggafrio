import { HttpTypes } from "@medusajs/types"
import { DEFAULT_COUNTRY_CODE, DEFAULT_CURRENCY_CODE } from "@/config/commerce"

// ============ STORED COUNTRY CODE ============

export const COUNTRY_CODE_KEY = "medusa_country_code"

export class StoreRegionResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StoreRegionResolutionError"
  }
}

export function isStoreCountryCode(countryCode: string | null | undefined): boolean {
  return countryCode?.toLowerCase() === DEFAULT_COUNTRY_CODE
}

export function resolveStoreRegion(
  regions: HttpTypes.StoreRegion[],
  countryCode: string = DEFAULT_COUNTRY_CODE
): HttpTypes.StoreRegion {
  const normalizedCountryCode = countryCode.toLowerCase()

  if (normalizedCountryCode !== DEFAULT_COUNTRY_CODE) {
    throw new StoreRegionResolutionError(
      `Unsupported storefront country code "${countryCode}". Expected "${DEFAULT_COUNTRY_CODE}".`
    )
  }

  const brazilRegions = regions.filter((candidate) =>
    candidate.countries?.some(
      (country) => country.iso_2?.toLowerCase() === DEFAULT_COUNTRY_CODE
    )
  )

  if (brazilRegions.length === 0) {
    throw new StoreRegionResolutionError(
      `Brazil storefront region is missing. Configure a region containing country code "${DEFAULT_COUNTRY_CODE}".`
    )
  }

  if (brazilRegions.length > 1) {
    throw new StoreRegionResolutionError(
      'Multiple storefront regions contain country code "br". Configure exactly one Brazil region.'
    )
  }

  const region = brazilRegions[0]

  if (region.currency_code?.toUpperCase() !== DEFAULT_CURRENCY_CODE) {
    throw new StoreRegionResolutionError(
      `Brazil storefront region must use currency "${DEFAULT_CURRENCY_CODE}"; received "${region.currency_code || "missing"}".`
    )
  }

  return region
}

export function getStoredCountryCode(): string | undefined {
  if (typeof document === "undefined") return undefined

  const cookies = document.cookie.split("; ")
  const countryCodeCookie = cookies.find((row) =>
    row.startsWith(`${COUNTRY_CODE_KEY}=`)
  )

  const countryCode = countryCodeCookie?.split("=")[1]
  return isStoreCountryCode(countryCode) ? DEFAULT_COUNTRY_CODE : undefined
}

export function setStoredCountryCode(countryCode: string): void {
  if (typeof document === "undefined") return

  if (!isStoreCountryCode(countryCode)) {
    throw new StoreRegionResolutionError(
      `Cannot persist unsupported storefront country code "${countryCode}".`
    )
  }

  const maxAge = 60 * 60 * 24 * 365 // 1 year in seconds
  document.cookie = `${COUNTRY_CODE_KEY}=${DEFAULT_COUNTRY_CODE}; path=/; max-age=${maxAge}; SameSite=Lax`
}

// ============ COUNTRY CODE FROM PATH ============

export function getCountryCodeFromPath(pathname: string): string | undefined {
  const segments = pathname.split("/").filter(Boolean)
  const potentialCountryCode = segments[0]?.toLowerCase()

  if (potentialCountryCode && potentialCountryCode.length === 2) {
    return potentialCountryCode
  }

  return undefined
}

// ============ DEFAULT COUNTRY CODE ============

export default function getDefaultCountryCode(regions: HttpTypes.StoreRegion[]): string {
  resolveStoreRegion(regions)
  return DEFAULT_COUNTRY_CODE
}

// Also export as named export for flexibility
export { getDefaultCountryCode }

// ============ BUILD PATH WITH COUNTRY CODE ============

export function buildPathWithCountryCode(currentPath: string, countryCode: string): string {
  if (!isStoreCountryCode(countryCode)) {
    throw new StoreRegionResolutionError(
      `Cannot build a storefront path for unsupported country code "${countryCode}".`
    )
  }

  const currentCountryCode = getCountryCodeFromPath(currentPath)
  const pathWithoutCountry = currentCountryCode
    ? currentPath.replace(new RegExp(`^/${currentCountryCode}(?=/|$)`), "") || "/"
    : currentPath
  const currentSearch = typeof location === "undefined" ? "" : location.search
  const searchParams = currentSearch
    ? `?${new URLSearchParams(currentSearch).toString()}`
    : ""
  return `/${DEFAULT_COUNTRY_CODE}${pathWithoutCountry === "/" ? "" : pathWithoutCountry}${searchParams}`
}
