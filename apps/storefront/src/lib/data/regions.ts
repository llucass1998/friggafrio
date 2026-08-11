import { sdk } from "@/lib/medusa"
import { resolveStoreRegion } from "@/lib/utils/region"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

export const listRegions = cache(async ({ fields }: { fields?: string } = {}): Promise<HttpTypes.StoreRegion[]> => {
  return sdk.store.region.list({ fields }, { next: { tags: ["regions"] } })
    .then(({ regions }) => regions)
    .catch((error) => {
      throw new Error("Failed to load storefront regions from Medusa.", {
        cause: error,
      })
    })
})

export const retrieveRegion = cache(async ({ id, fields }: { id: string; fields?: string }): Promise<HttpTypes.StoreRegion> => {
  return sdk.store.region.retrieve(id, { fields }, { next: { tags: ["regions"] } })
    .then(({ region }) => region)
    .catch((error) => {
      // Logging silenced for production
      throw error
    })
})

export const getRegion = cache(async ({ country_code, fields }: { country_code: string; fields?: string }): Promise<HttpTypes.StoreRegion> => {
  const regions = await listRegions({ fields })
  return resolveStoreRegion(regions, country_code)
})
