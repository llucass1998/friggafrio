export function parseBrazilianMoney(val: string | number | null): number | null {
  if (val === null || val === undefined) return null

  if (typeof val === "number") return val

  const str = String(val).trim()
  if (str === "") return null

  // Remove R$, espaços, e pontos de milhar
  const cleanStr = str
    .replace(/^R\$\s*/, "")
    .replace(/\./g, "")
    .replace(",", ".")

  const parsed = parseFloat(cleanStr)

  if (isNaN(parsed)) return null

  return parsed
}
