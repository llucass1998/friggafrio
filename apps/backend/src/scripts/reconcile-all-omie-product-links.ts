import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { FRIGGA_OMIE_PRODUCT_LINK_MODULE } from "../modules/frigga-omie-product-link"

type Query = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
    pagination?: { skip?: number; take?: number }
  }) => Promise<{ data: unknown[] }>
}

type GraphProduct = {
  id: string
  title?: string
  status?: string
  metadata?: Record<string, unknown> | null
  variants?: Array<{
    id: string
    sku?: string | null
  }> | null
}

type GraphLink = {
  id: string
  code_display: string
  code_normalized: string
  product_id: string
  variant_id?: string | null
  deleted_at?: string | null
}

const applyRequested = () =>
  process.env.OMIE_LINK_SYNC_APPLY === "true" ||
  process.argv.slice(2).some((value) => value.replace(/^--/, "") === "apply")

export default async function reconcileAllOmieProductLinks({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query

  logger.info("[reconcile-links] Carregando produtos e links existentes...")

  const [{ data: rawProducts }, { data: rawLinks }] = await Promise.all([
    query.graph({
      entity: "product",
      fields: ["id", "title", "status", "metadata", "variants.id", "variants.sku"],
      filters: { deleted_at: null },
      pagination: { skip: 0, take: 10_000 },
    }),
    query.graph({
      entity: "frigga_omie_product_link",
      fields: ["id", "code_display", "code_normalized", "product_id", "variant_id", "deleted_at"],
      filters: { deleted_at: null },
      pagination: { skip: 0, take: 10_000 },
    }),
  ])

  const products = (rawProducts || []) as GraphProduct[]
  const links = (rawLinks || []) as GraphLink[]

  logger.info(`[reconcile-links] Produtos no Medusa: ${products.length} | Links ativos existentes: ${links.length}`)

  const linkByNormalizedCode = new Map<string, GraphLink>()
  const linkByProductId = new Map<string, GraphLink>()

  for (const l of links) {
    if (l.code_normalized) linkByNormalizedCode.set(l.code_normalized.trim().toUpperCase(), l)
    if (l.product_id) linkByProductId.set(l.product_id, l)
  }

  const toCreate: Array<{
    code_display: string
    code_normalized: string
    product_id: string
    variant_id: string | null
    source: string
  }> = []

  let alreadyLinked = 0
  let gasLinkedCount = 0

  for (const prod of products) {
    const variant = prod.variants?.[0]
    const omieCode = (
      typeof prod.metadata?.omie_code === "string" && prod.metadata.omie_code.trim()
        ? prod.metadata.omie_code.trim()
        : variant?.sku?.trim() || null
    )

    if (!omieCode) continue

    const normalizedCode = omieCode.toUpperCase()
    const isGas = normalizedCode.startsWith("DPGS")
    const existing = linkByNormalizedCode.get(normalizedCode) || linkByProductId.get(prod.id)

    if (existing) {
      alreadyLinked++
      if (isGas) gasLinkedCount++
    } else {
      toCreate.push({
        code_display: omieCode,
        code_normalized: normalizedCode,
        product_id: prod.id,
        variant_id: variant?.id || null,
        source: isGas ? "omie-gas-canonical" : "omie-catalog",
      })
      if (isGas) gasLinkedCount++
    }
  }

  logger.info(`[reconcile-links] Estatísticas da reconciliação:`)
  logger.info(`  - Produtos já vinculados: ${alreadyLinked}`)
  logger.info(`  - Novos vínculos a serem criados: ${toCreate.length}`)
  logger.info(`  - Total de gases DPGS mapeados: ${gasLinkedCount}`)

  if (!applyRequested()) {
    logger.info("[reconcile-links] Modo DRY-RUN concluído. Nenhuma alteração persistida. Use OMIE_LINK_SYNC_APPLY=true para aplicar.")
    return
  }

  if (toCreate.length === 0) {
    logger.info("[reconcile-links] Todos os produtos já estão vinculados. Nada a fazer.")
    return
  }

  logger.info(`[reconcile-links] Gravando ${toCreate.length} novos vínculos no banco...`)
  const linkService = container.resolve(FRIGGA_OMIE_PRODUCT_LINK_MODULE) as {
    createFriggaOmieProductLinks: (input: unknown) => Promise<unknown>
  }

  // Grava em lotes de 100
  const BATCH = 100
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const batch = toCreate.slice(i, i + BATCH)
    await linkService.createFriggaOmieProductLinks(batch)
    logger.info(`[reconcile-links] Progresso: ${Math.min(i + batch.length, toCreate.length)}/${toCreate.length}`)
  }

  logger.info("[reconcile-links] Reconciliação de vínculos Omie concluída com sucesso!")
}
