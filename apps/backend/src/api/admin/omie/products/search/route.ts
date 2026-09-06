import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  findOmieProductsByCode,
  loadOmieConfig,
  OmieCatalogReader,
  OmieClient,
  normalizeOmieProductCode,
} from "../../../../../integrations/omie"
import { ContainerRegistrationKeys as Keys } from "@medusajs/framework/utils"

type Query = { graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown>; pagination?: { skip: number; take: number } }) => Promise<{ data: unknown[] }> }
type Variant = { id?: string; title?: string | null; sku?: string | null; metadata?: Record<string, unknown> | null; inventory_quantity?: number | null }
type LocalProduct = { id?: string; title?: string | null; handle?: string | null; status?: string | null; metadata?: Record<string, unknown> | null; variants?: Variant[] | null }
type PrivateLink = { id: string; code_display: string; code_normalized: string; product_id: string; variant_id?: string | null; source?: string }

const MAX_RESULTS = 25
const canonical = (value: unknown): string => (typeof value === "string" ? value.trim().toLocaleUpperCase("pt-BR") : "")
const validTerm = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.trim().length <= 100
const localCodes = (product: LocalProduct): string[] => {
  const metadata = product.metadata ?? {}
  return [metadata.omie_product_code, metadata.omie_code, metadata.omie_external_id, ...(product.variants ?? []).flatMap((v) => {
    const vm = v.metadata ?? {}
    return [vm.omie_product_code, vm.omie_code, vm.omie_external_id]
  })].filter((value): value is string => typeof value === "string")
}
const variantFor = (product: LocalProduct, term: string): Variant | undefined => (product.variants ?? []).find((v) => [v.sku, ...(Object.values(v.metadata ?? {}))].some((value) => canonical(value) === canonical(term))) ?? product.variants?.[0]
const localResult = (product: LocalProduct, term: string) => {
  const metadata = product.metadata ?? {}
  const variant = variantFor(product, term)
  return {
    source: "Medusa" as const,
    medusa_product_id: product.id ?? null,
    medusa_variant_id: variant?.id ?? null,
    title: product.title ?? null,
    code: localCodes(product)[0] ?? null,
    sku: variant?.sku ?? null,
    status: product.status ?? null,
    inventory_quantity: typeof variant?.inventory_quantity === "number" ? variant.inventory_quantity : null,
    linked: true,
    omie_product_id: typeof metadata.omie_product_id === "string" ? metadata.omie_product_id : null,
  }
}
const omieResult = (product: Record<string, unknown>) => ({
  source: "Omie" as const,
  medusa_product_id: null,
  medusa_variant_id: null,
  title: String(product.descricao ?? product.descricao_produto ?? product.nome ?? product.titulo ?? ""),
  code: String(product.cCodigo ?? product.codigo ?? product.codigo_produto ?? product.cCodInt ?? ""),
  sku: String(product.sku ?? product.cCodInt ?? product.cCodigo ?? "") || null,
  status: "Ainda não vinculado",
  inventory_quantity: null,
  linked: false,
  omie_product_id: String(product.nCodProd ?? product.id_produto ?? product.codigo_produto ?? "") || null,
})

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const raw = req.query?.q ?? req.query?.code
  if (!validTerm(raw)) {
    res.status(400).json({ code: "OMIE_PRODUCT_SEARCH_REQUIRED" })
    return
  }
  const term = raw.trim()
  if (!/^[A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ ._/-]{0,99}$/.test(term)) {
    res.status(400).json({ code: "OMIE_PRODUCT_SEARCH_INVALID" })
    return
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as Query
  let privateLinks: PrivateLink[] = []
  try {
    const linkQuery = req.scope.resolve(Keys.QUERY) as Query
    const result = await linkQuery.graph({ entity: "frigga_omie_product_link", fields: ["id", "code_display", "code_normalized", "product_id", "variant_id", "source"], filters: { deleted_at: null }, pagination: { skip: 0, take: 5_000 } })
    privateLinks = result.data as PrivateLink[]
  } catch {
    privateLinks = []
  }
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "status", "metadata", "variants.id", "variants.title", "variants.sku", "variants.metadata", "variants.inventory_quantity"],
    filters: { deleted_at: null },
    pagination: { skip: 0, take: 5_000 },
  })
  const products = data as LocalProduct[]
  const folded = canonical(term)
  const localExact = products.filter((p) => localCodes(p).some((v) => canonical(v) === folded) || (p.variants ?? []).some((v) => canonical(v.sku) === folded))
  const localMatches = (localExact.length ? localExact : products.filter((p) => {
    const haystack = [p.title, p.handle, ...localCodes(p), ...(p.variants ?? []).flatMap((v) => [v.title, v.sku])].filter(Boolean).map(canonical)
    return haystack.some((v) => v.includes(folded))
  })).slice(0, MAX_RESULTS)
  const localResults = localMatches.map((p) => localResult(p, term))
  const privateExact = privateLinks.filter((link) => canonical(link.code_normalized) === folded)
  const privateResults = privateExact.map((link) => {
    const product = products.find((p) => p.id === link.product_id)
    return product ? { ...localResult(product, link.code_normalized), code: link.code_display, medusa_variant_id: link.variant_id ?? localResult(product, link.code_normalized).medusa_variant_id, source: "Medusa" as const } : null
  }).filter(Boolean)

  let omieStatus: "credentials_missing" | "unavailable" | "ok" = "credentials_missing"
  let omieResults: ReturnType<typeof omieResult>[] = []
  const config = loadOmieConfig()
  if (config) {
    omieStatus = "ok"
    try {
      const records = await new OmieCatalogReader(new OmieClient({ ...config, timeoutMs: 8_000, maxAttempts: 2 })).readAll({ pageSize: 100, maxPages: 50 })
      const codeMatches = findOmieProductsByCode(records, term)
      const candidates = codeMatches.length ? codeMatches : records.filter((p) => Object.values(p).some((v) => typeof v === "string" && v.toLocaleUpperCase("pt-BR").includes(folded)))
      omieResults = candidates.slice(0, MAX_RESULTS).map(omieResult)
    } catch {
      omieStatus = "unavailable"
    }
  }
  const omieKeys = new Set(omieResults.map((r) => `${canonical(r.code)}|${canonical(r.title)}`))
  const merged = [
    ...privateResults,
    ...localResults.map((r) => omieKeys.has(`${canonical(r.code)}|${canonical(r.title)}`) ? { ...r, source: "Medusa + Omie" as const } : r),
    ...omieResults.filter((r) => !localResults.some((local) => `${canonical(local.code)}|${canonical(local.title)}` === `${canonical(r.code)}|${canonical(r.title)}`)),
  ].slice(0, MAX_RESULTS)
  res.status(200).json({ query: term, found: merged.length > 0, results: merged, product: merged[0] ?? null, local: { count: localResults.length }, omie: { status: omieStatus, count: omieResults.length, consulted: omieStatus !== "credentials_missing" } })
}
