import { sdk } from "@/lib/medusa"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

export const listRegions = cache(async ({ fields }: { fields?: string } = {}): Promise<HttpTypes.StoreRegion[]> => {
  return sdk.store.region.list({ fields }, { next: { tags: ["regions"] } })
    .then(({ regions }) => regions)
    .catch((error) => {
      // Logging silenced for production
      return []
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

export const getRegion = cache(async ({ country_code, fields }: { country_code: string; fields?: string }): Promise<HttpTypes.StoreRegion | null> => {
  try {
    const regions = await listRegions({ fields })
    if (!regions || regions.length === 0) {
      return null
    }
    
    // Find region that has the country code
    const region = regions.find((r) => 
      r.countries?.some((c) => c.iso_2 === country_code)
    )
    
    // If not found, just return the first region as fallback
    return region || regions[0]
  } catch (error) {
    // Logging silenced for production
    return null
  }
})
