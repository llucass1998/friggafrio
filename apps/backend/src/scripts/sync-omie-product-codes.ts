import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { FRIGGA_OMIE_PRODUCT_LINK_MODULE } from "../modules/frigga-omie-product-link"
import { OmieCatalogReader, OmieClient, loadOmieConfig } from "../integrations/omie"

const APPLY_FLAG = "OMIE_CODE_SYNC_APPLY"
const BATCH_SIZE = 100

type Product = {
  id: string
  title?: string | null
  metadata?: Record<string, unknown> | null
  variants?: Array<{ id?: string | null; sku?: string | null }> | null
}

type Link = {
  id: string
  code_display: string
  code_normalized: string
  product_id: string
  variant_id?: string | null
  source?: string | null
}

type Query = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
    pagination?: { skip: number; take: number }
  }) => Promise<{ data: unknown[] }>
}

type LinkService = {
  createFriggaOmieProductLinks: (input: Record<string, unknown> | Array<Record<string, unknown>>) => Promise<unknown>
}

const text = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return null
}

const canonical = (value: unknown): string => text(value)?.toLocaleUpperCase("pt-BR") ?? ""

const validCode = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/.test(value.trim())

const activeOmie = (value: unknown): boolean => !["S", "SIM", "Y", "YES", "TRUE", "1"].includes(canonical(value))

const omieCode = (record: Record<string, unknown>): string | null =>
  text(record.codigo) ?? text(record.cCodigo) ?? text(record.cCodInt) ?? null

const omieExternalId = (record: Record<string, unknown>): string | null =>
  text(record.codigo_produto) ?? text(record.nCodProd) ?? text(record.id_produto) ?? null

export default async function syncOmieProductCodes({ container }: ExecArgs): Promise<void> {
  if (process.env[APPLY_FLAG] === "true" && process.env.NODE_ENV === "production") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "OMIE_CODE_SYNC_APPLY is Local-only")
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const config = loadOmieConfig()
  if (!config) throw new MedusaError(MedusaError.Types.INVALID_DATA, "OMIE_CONFIGURATION_MISSING")

  const [records, productResult, linkResult] = await Promise.all([
    new OmieCatalogReader(new OmieClient({ ...config, timeoutMs: 15_000, maxAttempts: 2 })).readAll({ pageSize: 100, maxPages: 200 }),
    query.graph({ entity: "product", fields: ["id", "title", "metadata", "variants.id", "variants.sku"], filters: { deleted_at: null }, pagination: { skip: 0, take: 5_000 } }),
    query.graph({ entity: "frigga_omie_product_link", fields: ["id", "code_display", "code_normalized", "product_id", "variant_id", "source"], filters: { deleted_at: null }, pagination: { skip: 0, take: 5_000 } }),
  ])

  const products = productResult.data as Product[]
  const links = linkResult.data as Link[]
  const byExternalId = new Map(products.map((product) => [text(product.metadata?.omie_external_id), product]).filter(([id]) => Boolean(id)) as Array<[string, Product]>)
  const linksByCode = new Map<string, Link>()
  const linksByProduct = new Map<string, Link>()
  for (const link of links) {
    linksByCode.set(canonical(link.code_normalized), link)
    linksByProduct.set(link.product_id, link)
  }

  const active = records.filter((record) => activeOmie(record.inativo))
  const candidates = active.map((record) => ({
    externalId: omieExternalId(record),
    code: omieCode(record),
    title: text(record.descricao) ?? text(record.nome) ?? text(record.titulo),
  }))
  const codeCounts = new Map<string, number>()
  for (const candidate of candidates) if (candidate.code) codeCounts.set(canonical(candidate.code), (codeCounts.get(canonical(candidate.code)) ?? 0) + 1)

  const create: Array<Record<string, unknown>> = []
  let unmatched = 0
  let noOp = 0
  let conflict = 0
  let missingCode = 0
  for (const candidate of candidates) {
    if (!candidate.externalId || !candidate.code || !validCode(candidate.code)) {
      missingCode += 1
      continue
    }
    if ((codeCounts.get(canonical(candidate.code)) ?? 0) > 1) {
      conflict += 1
      continue
    }
    const product = byExternalId.get(candidate.externalId)
    if (!product) {
      unmatched += 1
      continue
    }
    const existingByCode = linksByCode.get(canonical(candidate.code))
    const existingByProduct = linksByProduct.get(product.id)
    if (existingByCode && (existingByCode.product_id !== product.id || existingByCode.variant_id !== (product.variants?.[0]?.id ?? null))) {
      conflict += 1
      continue
    }
    if (existingByProduct) {
      if (canonical(existingByProduct.code_normalized) === canonical(candidate.code)) noOp += 1
      else conflict += 1
      continue
    }
    create.push({
      code_display: candidate.code,
      code_normalized: canonical(candidate.code),
      product_id: product.id,
      variant_id: product.variants?.[0]?.id ?? null,
      source: "omie-catalog-read-only",
    })
  }

  const apply = process.env[APPLY_FLAG] === "true"
  logger.info(`[omie-code-sync] mode=${apply ? "apply" : "dry-run"} omie=${records.length} active=${active.length} medusa=${products.length} create=${create.length} no_op=${noOp} unmatched=${unmatched} conflict=${conflict} missing_code=${missingCode}`)
  if (!apply) return

  const service = container.resolve(FRIGGA_OMIE_PRODUCT_LINK_MODULE) as LinkService
  for (let offset = 0; offset < create.length; offset += BATCH_SIZE) {
    await service.createFriggaOmieProductLinks(create.slice(offset, offset + BATCH_SIZE))
    logger.info(`[omie-code-sync] persisted=${Math.min(offset + BATCH_SIZE, create.length)}/${create.length}`)
  }
}
