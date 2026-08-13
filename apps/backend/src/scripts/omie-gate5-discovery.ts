import { OmieCatalogReader, OmieClient, loadOmieConfig, normalizeOmieProduct } from "../integrations/omie"

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" ? String(value) : null

const rawNumber = (record: Record<string, unknown>, keys: string[]) => {
  const key = keys.find((candidate) => record[candidate] !== undefined && record[candidate] !== null)
  if (!key) return { state: "missing" as const, value: null }
  const raw = record[key]
  if ((typeof raw === "string" && !raw.trim()) || typeof raw === "boolean") return { state: "invalid" as const, value: null }
  const value = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."))
  return Number.isFinite(value) && value >= 0
    ? { state: value === 0 ? "zero" as const : "valid" as const, value }
    : { state: "invalid" as const, value: null }
}

const duplicateCount = (values: Array<string | null>) => {
  const frequencies = new Map<string, number>()
  for (const value of values) if (value) frequencies.set(value, (frequencies.get(value) ?? 0) + 1)
  return [...frequencies.values()].filter((count) => count > 1).reduce((total, count) => total + count, 0)
}

const main = async () => {
  const config = loadOmieConfig()
  if (!config) throw new Error("OMIE_CONFIGURATION_MISSING")
  const client = new OmieClient({ ...config, timeoutMs: 15_000, maxAttempts: 3, baseBackoffMs: 300 })
  const reader = new OmieCatalogReader(client)
  const pageSize = 100
  const maxPages = 200
  const records: Record<string, unknown>[] = []
  const signatures = new Set<string>()
  let pages = 0
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await reader.readPage(page, pageSize)
    const signature = JSON.stringify(result.products)
    if (result.products.length && signatures.has(signature)) throw new Error("OMIE_REPEATED_PAGE")
    signatures.add(signature)
    records.push(...result.products)
    pages = page
    if (!result.hasMore || result.products.length === 0) break
    if (page === maxPages) throw new Error("OMIE_MAX_PAGES")
  }

  const normalized = records.map(normalizeOmieProduct)
  const externalIds = normalized.map((product) => product.externalId)
  const skus = normalized.map((product) => product.variants[0]?.sku ?? null)
  const skuValid = (sku: string | null) => Boolean(sku && /^[A-Za-z0-9][A-Za-z0-9._\/-]{0,99}$/.test(sku))
  const externalDupes = new Set(externalIds.filter((id): id is string => Boolean(id) && externalIds.filter((item) => item === id).length > 1))
  const skuDupes = new Set(skus.filter((sku): sku is string => Boolean(sku) && skus.filter((item) => item === sku).length > 1))
  const counts = { priceValid: 0, priceZero: 0, priceMissing: 0, priceInvalid: 0, stockAvailable: 0, stockZero: 0, stockMissing: 0, stockInvalid: 0, active: 0, inactive: 0, sellable: 0, quoteOnly: 0, pricePending: 0, create: 0, update: 0, noOp: 0, conflict: 0, skip: 0 }
  records.forEach((record, index) => {
    const price = rawNumber(record, ["approved_price_brl", "preco_venda", "valor_unitario", "preco"])
    const stock = rawNumber(record, ["initial_inventory", "quantidade_estoque", "estoque", "saldo_estoque"])
    counts[price.state === "valid" ? "priceValid" : price.state === "zero" ? "priceZero" : price.state === "missing" ? "priceMissing" : "priceInvalid"]++
    counts[stock.state === "valid" ? "stockAvailable" : stock.state === "zero" ? "stockZero" : stock.state === "missing" ? "stockMissing" : "stockInvalid"]++
    const inactiveValue = text(record.inativo)?.toUpperCase()
    const active = !["S", "SIM", "Y", "YES", "TRUE", "1"].includes(inactiveValue ?? "")
    counts[active ? "active" : "inactive"]++
    const sellable = active && price.state === "valid" && stock.state === "valid"
    counts[sellable ? "sellable" : "quoteOnly"]++
    if (price.state !== "valid") counts.pricePending++
    const externalId = externalIds[index]
    const sku = skus[index]
    if (!externalId || !sku || !skuValid(sku) || !active) counts.skip++
    else if (externalDupes.has(externalId) || skuDupes.has(sku)) counts.conflict++
    else counts.create++
  })
  process.stdout.write(JSON.stringify({
    auth: "PASS", listarProdutos: "PASS", pages, products: records.length,
    missingExternalIds: externalIds.filter((id) => !id).length, duplicateExternalIds: duplicateCount(externalIds),
    missingSkus: skus.filter((sku) => !sku).length, duplicateSkus: duplicateCount(skus), invalidSkus: skus.filter((sku) => sku && !skuValid(sku)).length,
    ...counts,
  }))
}

export default main
