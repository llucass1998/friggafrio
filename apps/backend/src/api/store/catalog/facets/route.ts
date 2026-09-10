import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type Query = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
    pagination?: { skip: number; take: number }
  }) => Promise<{ data: unknown[] }>
}

type FacetProduct = {
  metadata?: Record<string, unknown> | null
  collection?: { id?: string | null; title?: string | null } | null
  variants?: Array<{
    options?: Array<{ id?: string | null; value?: string | null; option_id?: string | null; option?: { id?: string | null; title?: string | null } | null }> | null
    prices?: Array<{ amount?: number | null; currency_code?: string | null }> | null
  }> | null
}
const DATASET_LIMIT = 10_000

const asList = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : [value]
  return Array.from(new Set(values.flatMap((entry) => String(entry ?? "").split(",")).map((entry) => entry.trim()).filter(Boolean)))
}

const text = (value: unknown): string => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim()
const publicMetadataSearchValues = (metadata: Record<string, unknown> | null | undefined): unknown[] => Object.entries(metadata ?? {})
  .filter(([key]) => /^(brand|manufacturer|model|reference|ref|omie|codigo|code|sku|ean|upc|barcode|technical|spec)/i.test(key))
  .map(([, value]) => value)

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as Query
  try {
    const productQuery: { entity: string; fields: string[]; filters: Record<string, unknown> } = {
      entity: "product",
      fields: [
        "id",
        "title",
        "metadata",
        "collection.id",
        "collection.title",
        "categories.id",
        "variants.sku",
        "variants.barcode",
        "variants.options.id",
        "variants.options.value",
        "variants.options.option_id",
        "variants.options.option.id",
        "variants.options.option.title",
        "variants.prices.*",
      ],
      filters: { deleted_at: null, status: "published" },
    }
    const [{ data }, { data: regionRows }] = await Promise.all([
      query.graph({ ...productQuery, pagination: { skip: 0, take: DATASET_LIMIT } }),
      query.graph({ entity: "region", fields: ["id", "currency_code"], pagination: { skip: 0, take: 100 } }),
    ])
    if (data.length >= DATASET_LIMIT) {
      const { data: overflow } = await query.graph({ ...productQuery, pagination: { skip: DATASET_LIMIT, take: 1 } })
      if (overflow.length > 0) {
        res.status(503).json({ brands: [], price: {}, options: [], promotion_available: false, unavailable: true, code: "CATALOG_DATASET_LIMIT_EXCEEDED", limit: DATASET_LIMIT })
        return
      }
    }
    const requestedRegion = String(req.query?.region_id ?? "")
    const currency = String((regionRows as Array<{ id?: string; currency_code?: string }>).find((region) => region.id === requestedRegion)?.currency_code ?? "brl")

    const requestedQuery = text(req.query?.q)
    const requestedCategories = new Set(asList(req.query?.category_id ?? req.query?.category))
    const requestedBrands = new Set(asList(req.query?.brand ?? req.query?.collection_id))
    const products = (data as Array<FacetProduct & { title?: string; categories?: Array<{ id?: string }> }>).filter((product) => {
      if (requestedCategories.size > 0 && !((product.categories ?? []).some((category) => category.id && requestedCategories.has(category.id)))) return false
      if (requestedBrands.size > 0 && (!product.collection?.id || !requestedBrands.has(product.collection.id))) return false
      if (!requestedQuery) return true
      const searchable = [product.title, product.collection?.title, ...publicMetadataSearchValues(product.metadata), ...(product.variants ?? []).flatMap((variant) => {
        const candidate = variant as { sku?: string | null; barcode?: string | null }
        return [candidate.sku, candidate.barcode]
      })]
      return searchable.some((value) => text(value).includes(requestedQuery))
    })

    const brandMap = new Map<string, { id: string; name: string; count: number }>()
    const optionMap = new Map<string, { id: string; title: string; values: Map<string, { id: string; value: string; count: number }> }>()
    const prices: number[] = []
    for (const product of products) {
      const metadata = product.metadata ?? {}
      const brand = typeof product.collection?.title === "string" && product.collection.title.trim()
        ? product.collection.title.trim()
        : typeof metadata.brand === "string" && metadata.brand.trim()
          ? metadata.brand.trim()
          : typeof metadata.manufacturer === "string" && metadata.manufacturer.trim()
            ? metadata.manufacturer.trim()
            : ""
      // Only collection-backed brands are filterable through the Store API.
      // Metadata-only labels are intentionally omitted instead of exposing a
      // control that cannot be applied server-side.
      const collectionId = product.collection?.id?.trim()
      if (brand && collectionId) {
        const existing = brandMap.get(collectionId)
        if (existing) {
          existing.count += 1
        } else {
          brandMap.set(collectionId, { id: collectionId, name: brand, count: 1 })
        }
      }
      for (const variant of product.variants ?? []) {
        for (const candidate of variant.prices ?? []) {
          const amount = Number(candidate.amount)
          if ((!candidate.currency_code || candidate.currency_code.toLowerCase() === currency.toLowerCase()) && Number.isFinite(amount) && amount >= 0) prices.push(amount)
        }
        for (const optionValue of variant.options ?? []) {
          const optionId = optionValue.option_id || optionValue.option?.id
          const valueId = optionValue.id
          const value = optionValue.value?.trim()
          if (!optionId || !valueId || !value) continue
          const title = optionValue.option?.title?.trim() || "Opções"
          const option = optionMap.get(optionId) ?? { id: optionId, title, values: new Map() }
          const existingVal = option.values.get(valueId)
          if (existingVal) {
            existingVal.count += 1
          } else {
            option.values.set(valueId, { id: valueId, value, count: 1 })
          }
          optionMap.set(optionId, option)
        }
      }
    }

    res.json({
      brands: Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      price: prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : {},
      // Product metadata is not a commercial promotion contract. The catalog
      // only exposes this control when a region-aware, price-engine-backed
      // promotion projection is implemented; currently it remains hidden.
      promotion_available: false,
      options: Array.from(optionMap.values()).map((option) => ({
        id: option.id,
        title: option.title,
        values: Array.from(option.values.values()).sort((a, b) => a.value.localeCompare(b.value, "pt-BR")),
      })).sort((a, b) => a.title.localeCompare(b.title, "pt-BR")),
    })
  } catch {
    // Facets are an enhancement; never make the catalog fail closed when a
    // deployment lacks one of the optional expandable relations.
    res.status(503).json({ brands: [], price: {}, options: [], unavailable: true, code: "CATALOG_FACETS_UNAVAILABLE" })
  }
}
