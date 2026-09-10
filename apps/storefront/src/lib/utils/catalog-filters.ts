/** URL-backed catalog filters shared by the route loader and controls. */
export type CatalogSort =
  | "relevance"
  | "-id"
  | "id"
  | "title"
  | "-title"
  | "price_asc"
  | "price_desc"

export type CatalogFilters = {
  category?: string
  q?: string
  sort?: CatalogSort
  page?: number
  brand?: string | string[]
  availability?: "in_stock"
  price_min?: number
  price_max?: number
  promotion?: boolean
  option_value_id?: string | string[]
}

/**
 * Normalizes repeated query values while preserving their first-seen order.
 * TanStack Router can provide either a comma-delimited string or an array.
 */
export function normalizeFilterValues(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  const output: string[] = []
  const seen = new Set<string>()
  for (const item of values) {
    if (typeof item !== "string") continue
    for (const part of item.split(",")) {
      const normalized = part.trim()
      if (!normalized || seen.has(normalized)) continue
      seen.add(normalized)
      output.push(normalized)
    }
  }
  return output
}

/** Converts a URL price value into a non-negative finite number. */
export function normalizeCatalogPrice(value: unknown): number | undefined {
  if (typeof value === "string" && value.trim() === "") return undefined
  const normalized = typeof value === "string"
    ? value.trim().replace(/[^0-9,.-]/g, "").includes(",")
      ? value.trim().replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".")
      : value.trim().replace(/[^0-9.-]/g, "")
    : value
  const parsed = typeof normalized === "number" ? normalized : Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  return Math.round(parsed * 100) / 100
}

/**
 * Keeps a price range coherent. Invalid bounds are removed instead of
 * silently producing a query that can never match products.
 */
export function normalizeCatalogPriceRange(
  minimum: unknown,
  maximum: unknown,
): Pick<CatalogFilters, "price_min" | "price_max"> {
  const priceMin = normalizeCatalogPrice(minimum)
  const priceMax = normalizeCatalogPrice(maximum)
  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
    return {}
  }
  return {
    ...(priceMin === undefined ? {} : { price_min: priceMin }),
    ...(priceMax === undefined ? {} : { price_max: priceMax }),
  }
}

/** Returns a canonical representation suitable for query/cache keys. */
export function normalizeCatalogFilters(input: CatalogFilters): CatalogFilters {
  const brands = normalizeFilterValues(input.brand)
  const optionValues = normalizeFilterValues(input.option_value_id)
  const range = normalizeCatalogPriceRange(input.price_min, input.price_max)
  return {
    ...(input.category?.trim() ? { category: input.category.trim() } : {}),
    ...(input.q?.trim() ? { q: input.q.trim() } : {}),
    ...(input.sort ? { sort: input.sort } : {}),
    ...(typeof input.page === "number" && Number.isFinite(input.page) && input.page > 0
      ? { page: Math.floor(input.page) }
      : {}),
    ...(brands.length > 0 ? { brand: brands } : {}),
    ...(input.availability === "in_stock" ? { availability: "in_stock" } : {}),
    ...(range.price_min === undefined ? {} : { price_min: range.price_min }),
    ...(range.price_max === undefined ? {} : { price_max: range.price_max }),
    ...(input.promotion === true ? { promotion: true } : {}),
    ...(optionValues.length > 0 ? { option_value_id: optionValues } : {}),
  }
}
