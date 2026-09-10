import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type Query = { graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown>; pagination?: { skip: number; take: number } }) => Promise<{ data: unknown[] }> }
type VariantOption = { id?: string | null; option_id?: string | null }
type VariantInventoryItem = { inventory_item_id?: string | null }
type Variant = {
  sku?: string | null
  barcode?: string | null
  ean?: string | null
  upc?: string | null
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
  inventory_quantity?: number | null
  prices?: Array<{ amount?: number | null; currency_code?: string | null }> | null
  options?: VariantOption[] | null
  inventory_items?: VariantInventoryItem[] | null
}
type Product = { id?: string; title?: string; subtitle?: string | null; metadata?: Record<string, unknown> | null; collection?: { id?: string | null; title?: string | null }; categories?: Array<{ id?: string | null }>; variants?: Variant[] | null; created_at?: string | Date | null }
const DATASET_LIMIT = 10_000

const list = (value: unknown): string[] => Array.from(new Set((Array.isArray(value) ? value : [value]).flatMap((item) => String(item ?? "").split(",")).map((item) => item.trim()).filter(Boolean)))
const fold = (value: unknown): string => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim()
const publicMetadataSearchValues = (metadata: Record<string, unknown> | null | undefined): unknown[] => Object.entries(metadata ?? {})
  .filter(([key]) => /^(brand|manufacturer|model|reference|ref|omie|codigo|code|sku|ean|upc|barcode|technical|spec)/i.test(key))
  .map(([, value]) => value)
const amountFor = (variant: Variant, currency: string): number | null => {
  const prices = variant.prices ?? []
  // A price in another currency is not a valid regional catalog price.
  const match = prices.find((price) => String(price.currency_code ?? "").toLowerCase() === currency.toLowerCase())
  const amount = Number(match?.amount)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

const relevanceScore = (
  product: Product,
  query: string,
  variants = product.variants ?? [],
  hasStockFn: (variant: Variant) => boolean = () => true,
): number => {
  if (!query) return 0
  const name = fold(product.title)
  const subtitle = fold(product.subtitle)
  const brand = fold(product.metadata?.brand)
  const collection = fold(product.collection?.id)
  const codes = (product.variants ?? []).flatMap((variant) => [variant.sku, variant.barcode, variant.ean, variant.upc]).map(fold).filter(Boolean)
  const exactCode = codes.some((code) => code === query)
  const exactName = name === query
  const codeMatch = codes.some((code) => code.includes(query))
  const nameMatch = name.includes(query)
  const terms = query.split(" ").filter(Boolean)
  const metadataValues = publicMetadataSearchValues(product.metadata).map(fold)
  const allTerms = terms.every((term) => [name, subtitle, brand, collection, ...metadataValues, ...codes].some((field) => field.includes(term)))
  let score = exactCode ? 1000 : exactName ? 900 : codeMatch ? 750 : nameMatch ? 650 : allTerms ? 500 : 0
  if (score === 0 && terms.some((term) => [name, subtitle, brand, collection, ...metadataValues, ...codes].some((field) => field.includes(term)))) score = 250
  const hasStock = variants.some(hasStockFn)
  if (hasStock) score += 80
  return score
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as Query
  try {
    const productQuery: { entity: string; fields: string[]; filters: Record<string, unknown> } = {
      entity: "product",
      fields: [
        "id",
        "title",
        "subtitle",
        "metadata",
        "created_at",
        "collection.id",
        "collection.title",
        "categories.id",
        "variants.sku",
        "variants.barcode",
        "variants.ean",
        "variants.upc",
        "variants.manage_inventory",
        "variants.allow_backorder",
        "variants.inventory_quantity",
        "variants.prices.*",
        "variants.options.id",
        "variants.options.option_id",
        "variants.inventory_items.inventory_item_id",
      ],
      filters: { deleted_at: null, status: "published" },
    }
    const [{ data: products }, { data: regions }] = await Promise.all([
      query.graph({ ...productQuery, pagination: { skip: 0, take: DATASET_LIMIT } }),
      query.graph({ entity: "region", fields: ["id", "currency_code"], pagination: { skip: 0, take: 100 } }),
    ])

    // Resolve inventory levels from Medusa v2 Inventory Module
    const stockByItem = new Map<string, number>()
    try {
      const { data: levelRows } = await query.graph({
        entity: "inventory_level",
        fields: ["inventory_item_id", "stocked_quantity", "reserved_quantity"],
        pagination: { skip: 0, take: 10_000 },
      })
      for (const level of (levelRows ?? []) as Array<{ inventory_item_id?: string; stocked_quantity?: number | null; reserved_quantity?: number | null }>) {
        if (level.inventory_item_id) {
          const available = Math.max(0, Number(level.stocked_quantity ?? 0) - Number(level.reserved_quantity ?? 0))
          stockByItem.set(level.inventory_item_id, (stockByItem.get(level.inventory_item_id) ?? 0) + available)
        }
      }
    } catch {
      // Optional fallback for mock/minimal test environments
    }

    const hasAvailableStock = (variant: Variant): boolean => {
      if (variant.allow_backorder === true) return true
      if (variant.manage_inventory === false) return true
      const itemIds = (variant.inventory_items ?? []).map((item) => item.inventory_item_id).filter(Boolean) as string[]
      if (itemIds.length === 0) {
        return typeof variant.inventory_quantity === "number" && variant.inventory_quantity > 0
      }
      return itemIds.some((itemId) => (stockByItem.get(itemId) ?? 0) > 0)
    }
    if (products.length >= DATASET_LIMIT) {
      // Probe one row past the bounded projection. Never report a truncated
      // dataset as a complete filtered count.
      const { data: overflow } = await query.graph({ ...productQuery, pagination: { skip: DATASET_LIMIT, take: 1 } })
      if (overflow.length > 0) {
        res.status(503).json({ product_ids: [], count: 0, unavailable: true, code: "CATALOG_DATASET_LIMIT_EXCEEDED", limit: DATASET_LIMIT })
        return
      }
    }
    const regionId = String(req.query?.region_id ?? "")
    const currency = String((regions as Array<{ id?: string; currency_code?: string }>).find((region) => region.id === regionId)?.currency_code ?? "brl")
    const q = fold(req.query?.q)
    const brands = new Set(list(req.query?.brand ?? req.query?.collection_id))
    const categories = new Set(list(req.query?.category_id ?? req.query?.category))
    const min = Number(req.query?.price_min)
    const max = Number(req.query?.price_max)
    const inStock = ["true", "1", "in_stock"].includes(String(req.query?.availability ?? req.query?.in_stock))
    const promotionOnly = ["true", "1"].includes(String(req.query?.promotion ?? ""))
    const optionValues = new Set(list(req.query?.option_value_id))
    const matchingVariantsByProduct = new Map<string, Variant[]>()
    const rows = (products as Product[]).filter((product) => {
      if (!product.id) return false
      if (brands.size && (!product.collection?.id || !brands.has(product.collection.id))) return false
      if (categories.size && !(product.categories ?? []).some((category) => category.id && categories.has(category.id))) return false
      const variants = product.variants ?? []
      // Catalog promotion eligibility is intentionally not inferred from
      // arbitrary product metadata. Until a region-aware Medusa price
      // projection is available here, a promotion query is unsupported and
      // must not return products that merely carry a promotion label.
      if (promotionOnly) return false

      // Variant-level predicates must be evaluated on the same variant. This
      // prevents combining an option from one variant with stock or price from
      // another variant of the same product.
      const valueToOption = new Map<string, string>()
      for (const variant of variants) {
        for (const option of variant.options ?? []) {
          if (option.id && option.option_id) valueToOption.set(option.id, option.option_id)
        }
      }
      const selectedByOption = new Map<string, Set<string>>()
      const unknownOptionValues = new Set<string>()
      for (const valueId of optionValues) {
        const optionId = valueToOption.get(valueId)
        if (optionId) {
          const values = selectedByOption.get(optionId) ?? new Set<string>()
          values.add(valueId)
          selectedByOption.set(optionId, values)
        } else {
          unknownOptionValues.add(valueId)
        }
      }
      const variantHasSelectedOptions = (variant: Variant): boolean => {
        if (!optionValues.size) return true
        const options = variant.options ?? []
        if (unknownOptionValues.size && !options.some((option) => option.id && unknownOptionValues.has(option.id))) return false
        for (const [optionId, values] of selectedByOption) {
          if (!options.some((option) => option.option_id === optionId && option.id && values.has(option.id))) return false
        }
        return true
      }
      const matchingVariants = variants.filter(variantHasSelectedOptions)
      const hasVariantPredicate = optionValues.size > 0
        || inStock
        || (Number.isFinite(min) && min >= 0)
        || (Number.isFinite(max) && max >= 0)
      if (hasVariantPredicate && !matchingVariants.length) return false
      const scopedVariants = matchingVariants.length > 0 ? matchingVariants : variants
      matchingVariantsByProduct.set(product.id, scopedVariants)
      const searchable = [
        product.title,
        product.subtitle,
        product.collection?.title,
        ...publicMetadataSearchValues(product.metadata),
        ...variants.flatMap((variant) => [variant.sku, variant.barcode, variant.ean, variant.upc]),
      ]
      if (q && !searchable.some((value) => fold(value).includes(q))) return false
      const prices = scopedVariants.map((variant) => amountFor(variant, currency)).filter((value): value is number => value !== null)
      const price = prices.length ? Math.min(...prices) : null
      if (Number.isFinite(min) && min >= 0 && (price === null || price < min)) return false
      if (Number.isFinite(max) && max >= 0 && (price === null || price > max)) return false
      if (inStock && !scopedVariants.some(hasAvailableStock)) return false
      return true
    })
    const sort = String(req.query?.sort ?? "-id")
    rows.sort((a, b) => {
      if (sort === "relevance") {
        return (
          relevanceScore(b, q, matchingVariantsByProduct.get(b.id ?? ""), hasAvailableStock) -
          relevanceScore(a, q, matchingVariantsByProduct.get(a.id ?? ""), hasAvailableStock) ||
          (new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime()) ||
          String(a.id).localeCompare(String(b.id))
        )
      }
      if (sort === "title" || sort === "-title") return fold(a.title).localeCompare(fold(b.title), "pt-BR") * (sort === "-title" ? -1 : 1) || String(a.id).localeCompare(String(b.id))
      if (sort === "price_asc" || sort === "price_desc") {
        const ap = Math.min(...(matchingVariantsByProduct.get(a.id ?? "") ?? a.variants ?? []).map((variant) => amountFor(variant, currency) ?? Number.POSITIVE_INFINITY))
        const bp = Math.min(...(matchingVariantsByProduct.get(b.id ?? "") ?? b.variants ?? []).map((variant) => amountFor(variant, currency) ?? Number.POSITIVE_INFINITY))
        return (ap - bp) * (sort === "price_desc" ? -1 : 1) || String(a.id).localeCompare(String(b.id))
      }
      return (new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime()) || String(a.id).localeCompare(String(b.id))
    })
    const offset = Math.max(0, Number(req.query?.offset) || 0)
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit) || 24))
    res.json({ product_ids: rows.slice(offset, offset + limit).map((product) => product.id), count: rows.length })
  } catch {
    // Keep backend failures distinct from a valid zero-result catalog.
    res.status(503).json({ product_ids: [], count: 0, unavailable: true, code: "CATALOG_QUERY_FAILED" })
  }
}
