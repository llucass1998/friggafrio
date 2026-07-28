import { NormalizedInventoryUnit } from "./types"

export function normalizeUnit(original: string): NormalizedInventoryUnit {
  const upper = original.trim().toUpperCase()

  if (["PC", "PÇ", "PEÇA", "UN", "UNID", "Pç", "Pçs"].includes(upper)) {
    return "unit"
  }

  if (["LATA"].includes(upper)) {
    return "can"
  }

  if (["KG"].includes(upper)) {
    return "kg"
  }

  return "unit" // Default to unit if unknown, but could flag an issue
}
