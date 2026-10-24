import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { OmieCatalogReader, OmieClient, loadOmieConfig } from "../integrations/omie"

type Query = {
  graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: unknown[] }>
}

type GraphProduct = {
  id: string
  title?: string
  metadata?: Record<string, unknown> | null
  variants?: Array<{
    id: string
    sku?: string | null
  }> | null
}

const applyRequested = () => process.argv.slice(2).some((value) => value.replace(/^--/, "") === "apply")

export default async function reconcileOmieProductCodesAndUnits({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const config = loadOmieConfig()
  if (!config) throw new Error("OMIE_CONFIGURATION_MISSING")

  logger.info("[reconcile-omie-codes] Iniciando leitura do catálogo completo da Omie...")
  const reader = new OmieCatalogReader(new OmieClient({ ...config, timeoutMs: 20_000, maxAttempts: 3 }))
  const rawProducts = await reader.readAll({ pageSize: 100, maxPages: 200 })
  logger.info(`[reconcile-omie-codes] Lidos ${rawProducts.length} produtos da Omie.`)

  const omieMap = new Map<string, { code: string | null; unit: string | null; price: number | null }>()
  for (const item of rawProducts) {
    const externalId = String(item.codigo_produto || item.nCodProd || item.id_produto || "").trim()
    if (!externalId) continue
    const code = typeof item.codigo === "string" && item.codigo.trim()
      ? item.codigo.trim()
      : typeof item.cCodigo === "string" && item.cCodigo.trim()
      ? item.cCodigo.trim()
      : null
    const unit = typeof item.unidade === "string" && item.unidade.trim()
      ? item.unidade.trim().toUpperCase()
      : null
    const price = typeof item.valor_unitario === "number" && Number.isFinite(item.valor_unitario)
      ? item.valor_unitario
      : null
    omieMap.set(externalId, { code, unit, price })
  }

  logger.info("[reconcile-omie-codes] Consultando produtos no banco Medusa...")
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata", "variants.id", "variants.sku"],
    filters: { deleted_at: null },
  })
  const medusaProducts = data as GraphProduct[]
  logger.info(`[reconcile-omie-codes] ${medusaProducts.length} produtos no Medusa.`)

  const updates: Array<{
    id: string
    metadata: Record<string, unknown>
  }> = []

  let matched = 0
  let codeUpdated = 0
  let unitUpdated = 0
  let kgCount = 0

  for (const prod of medusaProducts) {
    const extId = String(prod.metadata?.omie_external_id || "").trim()
    if (!extId) continue

    const omieData = omieMap.get(extId)
    if (!omieData) continue

    matched++
    const currentCode = prod.metadata?.omie_code
    const currentUnit = prod.metadata?.unit || prod.metadata?.unidade

    let needsUpdate = false
    const newMetadata = { ...(prod.metadata ?? {}) }

    if (omieData.code && currentCode !== omieData.code) {
      newMetadata.omie_code = omieData.code
      codeUpdated++
      needsUpdate = true
    }

    if (omieData.unit && currentUnit !== omieData.unit) {
      newMetadata.unit = omieData.unit
      newMetadata.unidade = omieData.unit
      unitUpdated++
      needsUpdate = true
    }

    // O padrão de preço não é por KG e L; remove a flag legada se existir
    if (newMetadata.is_sold_by_weight) {
      delete newMetadata.is_sold_by_weight
      needsUpdate = true
    }

    if (needsUpdate) {
      updates.push({
        id: prod.id,
        metadata: newMetadata,
      })
    }
  }

  logger.info(`[reconcile-omie-codes] Estatísticas da reconciliação:`)
  logger.info(`  - Produtos correspondentes no Medusa: ${matched}`)
  logger.info(`  - Produtos com código real atualizado: ${codeUpdated}`)
  logger.info(`  - Produtos com unidade de medida atualizada: ${unitUpdated}`)
  logger.info(`  - Total de produtos a atualizar: ${updates.length}`)

  if (!applyRequested()) {
    logger.info("[reconcile-omie-codes] Modo DRY-RUN concluído. Nenhuma alteração foi gravada. Use --apply para persistir.")
    return
  }

  logger.info(`[reconcile-omie-codes] Aplicando atualizações em lotes de 100...`)
  for (let offset = 0; offset < updates.length; offset += 100) {
    const batch = updates.slice(offset, offset + 100)
    await updateProductsWorkflow(container).run({
      input: {
        products: batch,
      },
    })
    logger.info(`[reconcile-omie-codes] Progresso: ${Math.min(offset + batch.length, updates.length)}/${updates.length}`)
  }

  logger.info("[reconcile-omie-codes] Reconciliação concluída com sucesso!")
}
