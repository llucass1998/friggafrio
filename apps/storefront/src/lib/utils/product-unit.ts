import type { HttpTypes } from "@medusajs/types"

export function getProductUnit(product?: HttpTypes.StoreProduct | null): string | null {
  const meta = product?.metadata as Record<string, unknown> | undefined
  if (!meta) return null
  const rawUnit = (meta.unit || meta.unidade || meta.unidade_medida || meta.unit_of_measure) as string | undefined
  if (typeof rawUnit === "string" && rawUnit.trim()) {
    return rawUnit.trim().toUpperCase()
  }
  return null
}

export function getProductUnitSuffix(product?: HttpTypes.StoreProduct | null): string {
  const unit = getProductUnit(product)
  if (!unit) return ""
  switch (unit) {
    case "KG":
    case "KILO":
    case "QUILO":
      return " / kg"
    case "M":
    case "MT":
    case "METRO":
      return " / m"
    case "L":
    case "LT":
    case "LITRO":
      return " / L"
    default:
      return ""
  }
}

export function getProductDisplayCode(
  product?: HttpTypes.StoreProduct | null,
  fallbackSku?: string | null
): string | null {
  const meta = product?.metadata as Record<string, unknown> | undefined
  const omieCode = (meta?.omie_code || meta?.codigo || meta?.cCodigo) as string | undefined
  if (typeof omieCode === "string" && omieCode.trim()) {
    return omieCode.trim()
  }
  return fallbackSku || product?.variants?.[0]?.sku?.trim() || null
}
