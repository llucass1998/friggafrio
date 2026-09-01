import { listRegions } from "@/lib/data/regions"
import { DEFAULT_COUNTRY_CODE } from "@/config/commerce"
import {
  COUNTRY_CODE_KEY,
  getDefaultCountryCode,
  isStoreCountryCode,
} from "@/lib/utils/region"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server"

export const getStoredCountryCode = createServerFn().handler(async () => {
  const headers = getRequestHeaders()

  let countryCode: string | undefined

  const cookieHeader = headers?.get("cookie")
  if (cookieHeader) {
    const cookies = cookieHeader.split("; ")
    const countryCodeCookie = cookies.find((row: string) =>
      row.startsWith(`${COUNTRY_CODE_KEY}=`)
    )

    countryCode = countryCodeCookie?.split("=")[1]
  }

  if (!isStoreCountryCode(countryCode)) {
    const maxAge = 60 * 60 * 24 * 365 // 1 year in seconds

    const regions = await listRegions()
    countryCode = getDefaultCountryCode(regions)

    setResponseHeader(
      "Set-Cookie",
      `${COUNTRY_CODE_KEY}=${countryCode}; path=/; max-age=${maxAge}; SameSite=Lax`
    )
  }

  return { countryCode: DEFAULT_COUNTRY_CODE }
})
