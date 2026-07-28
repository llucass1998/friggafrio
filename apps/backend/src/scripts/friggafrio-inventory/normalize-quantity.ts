export function parseQuantity(val: string | number | null): number | null {
  if (val === null || val === undefined) return null

  if (typeof val === "number") return val

  const str = String(val).trim()
  if (str === "") return null

  // Quantity does not usually have thousand separators, but might have commas for decimals
  const cleanStr = str.replace(",", ".")
  const parsed = parseFloat(cleanStr)

  if (isNaN(parsed)) return null

  return parsed
}
