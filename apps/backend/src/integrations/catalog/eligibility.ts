export type CatalogCategory = { handle?: string | null }

export type CatalogVariant = {
  id?: string | null
  sku?: string | null
  inventory_item_id?: string | null
  inventory_items?: Array<{ inventory_item_id?: string | null }> | null
  metadata?: Record<string, unknown> | null
}

export type CatalogInventoryLevel = {
  inventory_item_id?: string | null
  location_id?: string | null
  stocked_quantity?: number | null
  reserved_quantity?: number | null
}

export type CatalogProduct = {
  id: string
  status?: string | null
  metadata?: Record<string, unknown> | null
  categories?: CatalogCategory[] | null
  variants?: CatalogVariant[] | null
}

export type CatalogEligibilityReason =
  | "MISSING_OMIE_CODE"
  | "MISSING_VARIANT_MAPPING"
  | "MISSING_SKU"
  | "DUPLICATE_OMIE_CODE"
  | "DUPLICATE_SKU"
  | "NOT_PUBLISHED"
  | "STOREFRONT_EXCLUDED"
  | "CATEGORY_NOT_ALLOWED"
  | "CATALOG_NOT_APPROVED"
  | "PURCHASE_DISABLED"
  | "INVALID_UNIT"
  | "NO_POSITIVE_STOCK"
  | "AMBIGUOUS_INVENTORY"

export type CatalogEligibility = {
  eligible: boolean
  reasons: CatalogEligibilityReason[]
  omieCode: string | null
  skus: string[]
  availableQuantity: number
}

export type CatalogFilterResult = {
  included: CatalogProduct[]
  excluded: Array<{ product: CatalogProduct; reasons: CatalogEligibilityReason[] }>
}

export const DEFAULT_COMMERCIAL_CATEGORY_HANDLES = new Set([
  "bombas-de-vacuo",
  "camara-fria",
  "cilindros-de-recolhimento",
  "componentes",
  "compressores",
  "conexoes",
  "detectores-de-vazamento",
  "ferramentas-manuais",
  "gases-refrigerantes",
  "isolamento-termico",
  "manifolds-e-manometros",
  "materiais-para-revenda",
  "materiais-revenda-gas-cobre",
  "oleos",
  "outros",
  "produtos-quimicos",
  "recolhedoras",
  "tubos-de-cobre",
])

const truthy = (value: unknown): boolean =>
  value === true || ["true", "1", "sim", "yes"].includes(String(value ?? "").trim().toLowerCase())

export const isValidOmieCode = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/.test(value.trim())

const normalized = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const result = value.trim()
  return result || null
}

const firstNonEmpty = (...values: unknown[]): string | null => {
  for (const value of values) {
    const candidate = normalized(value)
    if (candidate) return candidate
  }
  return null
}

const canonicalIdentifier = (value: string): string => value.trim().toUpperCase()

const VALID_UNITS = new Set(["UN", "UNID", "PC", "PCA", "KG", "G", "L", "ML", "M", "CM", "CX", "PCT", "KIT"])

export const evaluateCatalogEligibility = (
  product: CatalogProduct,
  levels: readonly CatalogInventoryLevel[],
  locationId: string,
  allowedCategories: ReadonlySet<string> = DEFAULT_COMMERCIAL_CATEGORY_HANDLES,
): CatalogEligibility => {
  const metadata = product.metadata ?? {}
  const omieCode = firstNonEmpty(metadata.omie_external_id, metadata.omie_code)
  const variants = product.variants ?? []
  const skus = variants.map((variant) => normalized(variant.sku)).filter((value): value is string => Boolean(value))
  const reasons: CatalogEligibilityReason[] = []
  const variantInventoryIds = variants.map((variant) => new Set([
    variant.inventory_item_id,
    ...(variant.inventory_items ?? []).map((item) => item.inventory_item_id),
  ].filter((value): value is string => Boolean(value))))

  if (!isValidOmieCode(omieCode)) reasons.push("MISSING_OMIE_CODE")
  if (variants.length === 0 || variants.some((variant, index) => !variant.id || variantInventoryIds[index]?.size !== 1)) reasons.push("MISSING_VARIANT_MAPPING")
  if (skus.length === 0 || skus.length !== variants.length) reasons.push("MISSING_SKU")
  if (product.status !== "published") reasons.push("NOT_PUBLISHED")
  if (truthy(metadata.storefront_excluded) || metadata.storefront_visible === false) reasons.push("STOREFRONT_EXCLUDED")
  // The public catalog already treats an absent approval marker as neutral.
  // Only an explicitly required approval workflow may remove a product.
  if (
    truthy(metadata.catalog_homologation_required) &&
    String(metadata.catalog_homologation_status ?? "").trim().toLowerCase() !== "approved"
  ) reasons.push("CATALOG_NOT_APPROVED")
  if (metadata.purchase_enabled === false) reasons.push("PURCHASE_DISABLED")

  const units = variants
    .map((variant) => normalized(variant.metadata?.omie_unit ?? metadata.omie_unit ?? metadata.unit)?.toUpperCase())
    .filter((unit): unit is string => Boolean(unit))
  // A missing legacy unit is not proof that the unit is invalid. When Omie
  // supplied a unit, however, an unknown value remains fail-closed.
  if (units.some((unit) => !VALID_UNITS.has(unit))) reasons.push("INVALID_UNIT")

  const categoryHandles = new Set((product.categories ?? []).map((category) => normalized(category.handle)?.toLowerCase()).filter((value): value is string => Boolean(value)))
  if (![...categoryHandles].some((handle) => allowedCategories.has(handle))) reasons.push("CATEGORY_NOT_ALLOWED")

  const itemIds = new Set(variantInventoryIds.flatMap((ids) => [...ids]))
  const mappedLevels = levels.filter((level) => level.location_id === locationId && level.inventory_item_id && itemIds.has(level.inventory_item_id))
  const levelKeys = new Set<string>()
  if (mappedLevels.some((level) => {
    const key = `${level.inventory_item_id}:${level.location_id}`
    if (levelKeys.has(key)) return true
    levelKeys.add(key)
    return false
  })) reasons.push("AMBIGUOUS_INVENTORY")
  const availableQuantity = mappedLevels.reduce((total, level) => total + Math.max(0, Number(level.stocked_quantity ?? 0) - Number(level.reserved_quantity ?? 0)), 0)
  if (!(availableQuantity > 0)) reasons.push("NO_POSITIVE_STOCK")

  return { eligible: reasons.length === 0, reasons, omieCode: isValidOmieCode(omieCode) ? omieCode.trim() : null, skus, availableQuantity }
}

export const filterEligibleCatalog = (
  products: readonly CatalogProduct[],
  levels: readonly CatalogInventoryLevel[],
  locationId: string,
  allowedCategories: ReadonlySet<string> = DEFAULT_COMMERCIAL_CATEGORY_HANDLES,
): CatalogFilterResult => {
  const externalCounts = new Map<string, number>()
  const skuCounts = new Map<string, number>()
  for (const product of products) {
    const code = firstNonEmpty(product.metadata?.omie_external_id, product.metadata?.omie_code)
    if (code) {
      const canonicalCode = canonicalIdentifier(code)
      externalCounts.set(canonicalCode, (externalCounts.get(canonicalCode) ?? 0) + 1)
    }
    for (const variant of product.variants ?? []) {
      const sku = normalized(variant.sku)
      if (sku) {
        const canonicalSku = canonicalIdentifier(sku)
        skuCounts.set(canonicalSku, (skuCounts.get(canonicalSku) ?? 0) + 1)
      }
    }
  }

  const included: CatalogProduct[] = []
  const excluded: CatalogFilterResult["excluded"] = []
  for (const product of products) {
    const result = evaluateCatalogEligibility(product, levels, locationId, allowedCategories)
    const reasons = [...result.reasons]
    if (result.omieCode && (externalCounts.get(canonicalIdentifier(result.omieCode)) ?? 0) > 1) reasons.push("DUPLICATE_OMIE_CODE")
    if (result.skus.some((sku) => (skuCounts.get(canonicalIdentifier(sku)) ?? 0) > 1)) reasons.push("DUPLICATE_SKU")
    if (reasons.length === 0) included.push(product)
    else excluded.push({ product, reasons: [...new Set(reasons)] })
  }
  return { included, excluded }
}
