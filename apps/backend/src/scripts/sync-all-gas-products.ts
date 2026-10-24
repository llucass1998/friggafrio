import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { OmieClient, loadOmieConfig } from "../integrations/omie"
import { stableOmieHandle, omieFingerprint } from "../integrations/omie/reconciliation"
import { normalizeOmieProduct } from "../integrations/omie/mapper"

type Query = {
  graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: unknown[] }>
}

type GraphProduct = {
  id: string
  title?: string
  status?: string
  metadata?: Record<string, unknown> | null
  variants?: Array<{
    id: string
    sku?: string | null
    metadata?: Record<string, unknown> | null
  }> | null
}

const GAS_CODES = [
  "DPGS0020", "DPGS1010", "DPGS1027", "DPGS1233", "DPGS1234", "DPGS1240", "DPGS1340", "DPGS1342",
  "DPGS1343", "DPGS1344", "DPGS1345", "DPGS1346", "DPGS1347", "DPGS1348", "DPGS1410", "DPGS1411",
  "DPGS1412", "DPGS1413", "DPGS1414", "DPGS1415", "DPGS2200", "DPGS2201", "DPGS2202", "DPGS2204",
  "DPGS2205", "DPGS2207", "DPGS2268", "DPGS2300", "DPGS2903", "DPGS2905", "DPGS2907", "DPGS3000",
  "DPGS3200", "DPGS3201", "DPGS3202", "DPGS3203", "DPGS3204", "DPGS3206", "DPGS3209", "DPGS4010",
  "DPGS4012", "DPGS4013", "DPGS4020", "DPGS4022", "DPGS4024", "DPGS4040", "DPGS4041", "DPGS4042",
  "DPGS4044", "DPGS4045", "DPGS4046", "DPGS4047", "DPGS4070", "DPGS4071", "DPGS4072", "DPGS4074",
  "DPGS4076", "DPGS4082", "DPGS4100", "DPGS4101", "DPGS4102", "DPGS4103", "DPGS4104", "DPGS4105",
  "DPGS4106", "DPGS4108", "DPGS4109", "DPGS4110", "DPGS4135", "DPGS4202", "DPGS4220", "DPGS4371",
  "DPGS4400", "DPGS4490", "DPGS4491", "DPGS4499", "DPGS4530", "DPGS5070", "DPGS5071", "DPGS5072",
  "DPGS5073", "DPGS5080", "DPGS5900", "DPGS6005", "DPGS6007", "DPGS6009", "DPGS8080", "DPGS9545", "DPGS9900"
]

const applyRequested = () =>
  process.env.OMIE_GAS_SYNC_APPLY === "true" ||
  process.argv.slice(2).some((value) => value.replace(/^--/, "") === "apply")
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function syncAllGasProducts({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const config = loadOmieConfig()
  if (!config) throw new Error("OMIE_CONFIGURATION_MISSING")

  logger.info(`[sync-gas] Iniciando sincronização dos ${GAS_CODES.length} códigos de gás do pivot(5)...`)
  const client = new OmieClient({ ...config, timeoutMs: 20_000, maxAttempts: 3 })

  // 1. Consulta todos os 89 produtos na Omie com throttle
  const omieProducts: Array<{ code: string; raw: Record<string, unknown> }> = []
  for (let i = 0; i < GAS_CODES.length; i++) {
    const code = GAS_CODES[i]!
    try {
      const resp = await client.request<Record<string, unknown>>("ConsultarProduto", { codigo: code })
      if (resp && (resp.codigo_produto || resp.nCodProd)) {
        omieProducts.push({ code, raw: resp })
      } else {
        const resp2 = await client.request<Record<string, unknown>>("ConsultarProduto", { cCodigo: code })
        if (resp2 && (resp2.codigo_produto || resp2.nCodProd)) {
          omieProducts.push({ code, raw: resp2 })
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn(`[sync-gas] Falha ao consultar Omie para ${code}: ${msg}`)
    }
    await sleep(260)
  }
  logger.info(`[sync-gas] ${omieProducts.length}/${GAS_CODES.length} produtos obtidos da Omie com sucesso.`)

  // 2. Consulta produtos existentes no banco Medusa
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "status", "metadata", "variants.id", "variants.sku", "variants.metadata"],
    filters: { deleted_at: null },
  })
  const medusaProducts = data as GraphProduct[]

  const productByExtId = new Map<string, GraphProduct>()
  const productBySku = new Map<string, GraphProduct>()
  const productByOmieCode = new Map<string, GraphProduct>()

  for (const prod of medusaProducts) {
    const extId = String(prod.metadata?.omie_external_id || "").trim()
    const omieCode = String(prod.metadata?.omie_code || "").trim()
    if (extId) productByExtId.set(extId, prod)
    if (omieCode) productByOmieCode.set(omieCode, prod)
    for (const v of prod.variants ?? []) {
      if (v.sku) productBySku.set(v.sku.trim(), prod)
    }
  }

  const updates: Array<{
    id: string
    title?: string
    metadata?: Record<string, unknown>
    variants?: Array<{ id: string; sku?: string }>
  }> = []

  const creates: Array<unknown> = []

  let matchedExisting = 0
  let willCreate = 0
  let skuFixedCount = 0

  for (const { code, raw } of omieProducts) {
    const normalized = normalizeOmieProduct(raw)
    const extId = String(raw.codigo_produto || raw.nCodProd || "").trim()
    const omieDesc = String(raw.descricao || normalized.title || "").trim()
    const omieUnit = String(raw.unidade || "").trim().toUpperCase() || "UN"
    const inativo = String(raw.inativo || "").trim().toUpperCase() === "S"

    const existing = productByExtId.get(extId) || productByOmieCode.get(code) || productBySku.get(code)

    if (existing) {
      matchedExisting++
      const currentMeta = (existing.metadata ?? {}) as Record<string, unknown>
      const newMeta = { ...currentMeta }
      let needsUpdate = false

      // Garante omie_code
      if (newMeta.omie_code !== code) {
        newMeta.omie_code = code
        needsUpdate = true
      }
      // Garante omie_external_id
      if (newMeta.omie_external_id !== extId) {
        newMeta.omie_external_id = extId
        needsUpdate = true
      }
      // Garante unidade
      if (newMeta.unit !== omieUnit || newMeta.unidade !== omieUnit) {
        newMeta.unit = omieUnit
        newMeta.unidade = omieUnit
        needsUpdate = true
      }
      // Remove is_sold_by_weight (o padrão de preço não é por KG e L)
      if (newMeta.is_sold_by_weight !== undefined) {
        delete newMeta.is_sold_by_weight
        needsUpdate = true
      }
      // Garante fingerprint atualizado
      newMeta.omie_fingerprint = omieFingerprint(normalized)

      // Verifica SKU da variante
      const variant = existing.variants?.[0]
      const variantNeedsSkuUpdate = variant && variant.sku !== code

      if (variantNeedsSkuUpdate) {
        skuFixedCount++
        needsUpdate = true
      }

      if (needsUpdate) {
        updates.push({
          id: existing.id,
          metadata: newMeta,
          ...(variantNeedsSkuUpdate && variant ? { variants: [{ id: variant.id, sku: code }] } : {}),
        })
      }
    } else {
      // Produto inativo no Omie que ainda não estava no Medusa
      willCreate++
      const priceVal = typeof raw.valor_unitario === "number" && Number.isFinite(raw.valor_unitario)
        ? raw.valor_unitario
        : 0

      creates.push({
        title: omieDesc,
        handle: stableOmieHandle(extId),
        status: ProductStatus.DRAFT,
        options: [{ title: "Opção", values: ["Padrão"] }],
        variants: [{
          title: "Padrão",
          sku: code,
          manage_inventory: false,
          allow_backorder: false,
          options: { "Opção": "Padrão" },
          prices: priceVal > 0 ? [{ amount: priceVal, currency_code: "brl" }] : [],
          metadata: { omie_external_id: extId, unit: omieUnit },
        }],
        metadata: {
          source: "omie",
          omie_external_id: extId,
          omie_code: code,
          unit: omieUnit,
          unidade: omieUnit,
          omie_fingerprint: omieFingerprint(normalized),
          storefront_visible: false,
          purchase_enabled: false,
          is_quote_only: true,
          commercial_status: "QUOTE_ONLY",
        },
      })
    }
  }

  logger.info(`[sync-gas] Estatísticas:`)
  logger.info(`  - Produtos existentes no Medusa: ${matchedExisting}`)
  logger.info(`  - Produtos a serem atualizados: ${updates.length}`)
  logger.info(`  - SKUs que serão alinhados ao código DPGS: ${skuFixedCount}`)
  logger.info(`  - Novos produtos de gás a cadastrar (DRAFT): ${willCreate}`)

  if (!applyRequested()) {
    logger.info(`[sync-gas] Modo DRY-RUN concluído. Nenhuma alteração persistida. Execute com --apply para gravar.`)
    return
  }

  // Aplica atualizações
  if (updates.length > 0) {
    logger.info(`[sync-gas] Gravando atualizações no Medusa...`)
    await updateProductsWorkflow(container).run({
      input: {
        products: updates,
      },
    })
    logger.info(`[sync-gas] ${updates.length} produtos atualizados com sucesso!`)
  }

  // Aplica criações
  if (creates.length > 0) {
    logger.info(`[sync-gas] Cadastrando ${creates.length} produtos de gás inativos (como DRAFT)...`)
    await createProductsWorkflow(container).run({
      input: {
        products: creates as never,
      },
    })
    logger.info(`[sync-gas] ${creates.length} produtos cadastrados com sucesso!`)
  }

  logger.info(`[sync-gas] Sincronização de todos os gases concluída com êxito!`)
}
