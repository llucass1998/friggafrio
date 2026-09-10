import type { HttpTypes } from "@medusajs/types"
import { getProductPurchaseState } from "@/lib/utils/product-state"

const fold = (value: unknown): string => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/\s+/g, " ")
  .trim()

const tokens = (value: string): string[] => fold(value).split(" ").filter(Boolean)

const searchableCodes = (product: HttpTypes.StoreProduct): string[] =>
  (product.variants ?? []).flatMap((variant) => [variant.sku, variant.barcode, variant.ean, variant.upc])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)

export const normalizeProductSearch = (value: string): string => fold(value)

export const scoreProductRelevance = (product: HttpTypes.StoreProduct, query: string): number => {
  const normalizedQuery = fold(query)
  if (!normalizedQuery) return 0

  const name = fold(product.title)
  const subtitle = fold(product.subtitle)
  const brand = fold(product.collection?.title)
  const codes = searchableCodes(product).map(fold)
  const queryTokens = tokens(normalizedQuery)
  const codeExact = codes.some((code) => code === normalizedQuery)
  const nameExact = name === normalizedQuery
  const nameContains = name.includes(normalizedQuery)
  const allTermsMatch = queryTokens.every((token) => [name, subtitle, brand, ...codes].some((field) => field.includes(token)))
  const codePartial = codes.some((code) => code.includes(normalizedQuery))

  let score = 0
  if (codeExact) score += 1000
  else if (nameExact) score += 900
  else if (codePartial) score += 750
  else if (nameContains) score += 650
  else if (allTermsMatch) score += 500
  else if (queryTokens.some((token) => [name, subtitle, brand, ...codes].some((field) => field.includes(token)))) score += 250

  const purchaseState = getProductPurchaseState(product)
  if (purchaseState.status === "purchasable") score += 80
  if (purchaseState.status === "out_of_stock") score -= 25
  return score
}

export const sortProductsByRelevance = <T extends HttpTypes.StoreProduct>(products: T[], query: string): T[] =>
  products
    .map((product, index) => ({ product, index, score: scoreProductRelevance(product, query) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ product }) => product)

