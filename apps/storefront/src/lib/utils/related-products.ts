import type { HttpTypes } from "@medusajs/types"
import { getProductPurchaseState } from "@/lib/utils/product-state"

type ProductMetadata = Record<string, unknown>

const EXPLICIT_RELATION_KEYS = [
  "related_product_ids",
  "related_products",
  "complementary_product_ids",
  "complementary_products",
  "accessory_product_ids",
  "accessory_products",
  "compatible_product_ids",
  "compatible_products",
  "alternative_product_ids",
  "alternative_products",
] as const

const readMetadata = (product: HttpTypes.StoreProduct): ProductMetadata =>
  (product.metadata ?? {}) as ProductMetadata

const normalizeTokens = (value: unknown): string[] => {
  if (typeof value !== "string") return []
  return value
    .toLocaleLowerCase("pt-BR")
    .split(/[;,|/]+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

const readRelationIds = (value: unknown): string[] => {
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return readRelationIds(parsed)
    } catch {
      // Legacy catalogs may store IDs as a delimited string.
    }
    return trimmed.split(/[;,|/]+/).map((id) => id.trim()).filter(Boolean)
  }
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (typeof entry === "string") return [entry.trim()]
    if (!entry || typeof entry !== "object") return []
    const relation = entry as { id?: unknown; product_id?: unknown }
    const id = typeof relation.id === "string" ? relation.id : relation.product_id
    return typeof id === "string" ? [id.trim()] : []
  }).filter(Boolean)
}

const explicitRelationMap = (product: HttpTypes.StoreProduct): Map<string, number> => {
  const metadata = readMetadata(product)
  const result = new Map<string, number>()
  EXPLICIT_RELATION_KEYS.forEach((key, keyIndex) => {
    readRelationIds(metadata[key]).forEach((id, index) => {
      if (!result.has(id)) result.set(id, 1000 - keyIndex * 20 - index)
    })
  })
  return result
}

const categoryIds = (product: HttpTypes.StoreProduct): string[] =>
  (product.categories ?? []).map((category) => category.id).filter(Boolean)

const categoryParentIds = (product: HttpTypes.StoreProduct): string[] =>
  (product.categories ?? [])
    .map((category) => (category as { parent_category_id?: string | null }).parent_category_id)
    .filter((id): id is string => Boolean(id))

const productBrand = (product: HttpTypes.StoreProduct): string => {
  const metadata = readMetadata(product)
  const brand = metadata.brand ?? metadata.manufacturer ?? product.collection?.title
  return typeof brand === "string" ? brand.trim().toLocaleLowerCase("pt-BR") : ""
}

const productType = (product: HttpTypes.StoreProduct): string => {
  const type = product.type?.value
  return typeof type === "string" ? type.trim().toLocaleLowerCase("pt-BR") : ""
}

const productPrice = (product: HttpTypes.StoreProduct): number | null => {
  const amounts = (product.variants ?? [])
    .map((variant) => variant.calculated_price?.calculated_amount)
    .filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount) && amount > 0)
  return amounts.length ? Math.min(...amounts) : null
}

const hasImage = (product: HttpTypes.StoreProduct): boolean =>
  Boolean(product.thumbnail || product.images?.some((image) => typeof image.url === "string" && image.url.trim()))

const isAvailable = (product: HttpTypes.StoreProduct): boolean => {
  const state = getProductPurchaseState(product)
  return state.status === "purchasable" || state.status === "select_variant"
}

const stableTieBreak = (seed: string, candidateId: string): number => {
  let hash = 2166136261
  for (const char of `${seed}:${candidateId}`) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const compatibilityTokens = (product: HttpTypes.StoreProduct): string[] => {
  const metadata = readMetadata(product)
  return [
    metadata.compatibility,
    metadata.compatibilidade,
    metadata.compatibility_group,
    metadata.compatibilityGroup,
    metadata.compatible_with,
    metadata.compatibleWith,
  ].flatMap(normalizeTokens)
}

const applicationTokens = (product: HttpTypes.StoreProduct): string[] => {
  const metadata = readMetadata(product)
  return [metadata.application, metadata.aplicacao, metadata.aplicação].flatMap(normalizeTokens)
}

const overlaps = (left: string[], right: string[]): boolean => left.some((token) => right.includes(token))

const isKnownIncompatible = (source: HttpTypes.StoreProduct, candidate: HttpTypes.StoreProduct): boolean => {
  const sourceCompatibility = compatibilityTokens(source)
  const candidateCompatibility = compatibilityTokens(candidate)
  return sourceCompatibility.length > 0 && candidateCompatibility.length > 0 && !overlaps(sourceCompatibility, candidateCompatibility)
}

const scoreCandidate = ({ source, candidate, explicitScore, selected }: { source: HttpTypes.StoreProduct; candidate: HttpTypes.StoreProduct; explicitScore: number; selected: HttpTypes.StoreProduct[] }): number => {
  const sourceCategories = categoryIds(source)
  const candidateCategories = categoryIds(candidate)
  const sourceParents = categoryParentIds(source)
  const candidateParents = categoryParentIds(candidate)
  const sourceApplications = applicationTokens(source)
  const candidateApplications = applicationTokens(candidate)
  const sourcePrice = productPrice(source)
  const candidatePrice = productPrice(candidate)
  const candidateBrand = productBrand(candidate)
  const candidateType = productType(candidate)
  let score = explicitScore
  if (sourceCategories.some((id) => candidateCategories.includes(id))) score += 320
  else if (sourceParents.some((id) => candidateParents.includes(id))) score += 180
  if (source.collection_id && source.collection_id === candidate.collection_id) score += 220
  if (source.tags?.some((tag) => candidate.tags?.some((other) => other.id === tag.id))) score += 150
  if (productType(source) && productType(source) === candidateType) score += 100
  if (overlaps(sourceApplications, candidateApplications)) score += 120
  if (overlaps(compatibilityTokens(source), compatibilityTokens(candidate))) score += 180
  if (sourcePrice !== null && candidatePrice !== null) {
    const ratio = Math.max(sourcePrice, candidatePrice) / Math.min(sourcePrice, candidatePrice)
    score += ratio <= 1.5 ? 70 : ratio <= 2.5 ? 25 : 0
  }
  if (hasImage(candidate)) score += 45
  if (isAvailable(candidate)) score += 35
  if (candidatePrice !== null) score += 25
  if (candidate.description?.trim() && candidate.variants?.length) score += 10
  const sameBrandCount = selected.filter((item) => productBrand(item) === candidateBrand && candidateBrand).length
  const sameCategoryCount = selected.filter((item) => categoryIds(item).some((id) => candidateCategories.includes(id))).length
  const sameTypeCount = selected.filter((item) => productType(item) === candidateType && candidateType).length
  if (sameBrandCount) score -= sameBrandCount * 120
  if (sameCategoryCount) score -= sameCategoryCount * 180
  if (sameTypeCount) score -= sameTypeCount * 80
  return score
}

export function rankRelatedProducts(source: HttpTypes.StoreProduct, candidates: HttpTypes.StoreProduct[], limit = 4): HttpTypes.StoreProduct[] {
  const explicit = explicitRelationMap(source)
  const unique = new Map<string, HttpTypes.StoreProduct>()
  for (const candidate of candidates) {
    if (!candidate?.id || candidate.id === source.id || unique.has(candidate.id)) continue
    if (isKnownIncompatible(source, candidate) && !explicit.has(candidate.id)) continue
    unique.set(candidate.id, candidate)
  }

  const selected: HttpTypes.StoreProduct[] = []
  const remaining = Array.from(unique.values())
  while (selected.length < limit && remaining.length) {
    remaining.sort((left, right) => {
      const leftScore = scoreCandidate({ source, candidate: left, explicitScore: explicit.get(left.id) ?? 0, selected })
      const rightScore = scoreCandidate({ source, candidate: right, explicitScore: explicit.get(right.id) ?? 0, selected })
      return rightScore - leftScore || stableTieBreak(source.id, left.id) - stableTieBreak(source.id, right.id)
    })
    selected.push(remaining.shift()!)
  }
  return selected
}
