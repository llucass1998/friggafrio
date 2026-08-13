import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow, updateProductsWorkflow, type UpdateProductsWorkflowInputProducts } from "@medusajs/medusa/core-flows"
import { OmieCatalogReader, OmieClient, loadOmieConfig, normalizeOmieProduct } from "../integrations/omie"
import { buildOmieReconciliation, isInactiveOmieRecord, omieFingerprint, stableOmieHandle, type MedusaOmieProjection } from "../integrations/omie/reconciliation"

type GraphProduct = { id: string; status: string; metadata?: Record<string, unknown> | null; variants?: Array<{ sku?: string | null }> }
type ProductUpdate = UpdateProductsWorkflowInputProducts["products"][number]

const applyRequested = () => process.argv.slice(2).some((value) => value.replace(/^--/, "") === "apply")

export default async function omieGate5Sync({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const config = loadOmieConfig()
  if (!config) throw new Error("OMIE_CONFIGURATION_MISSING")

  const raw = await new OmieCatalogReader(new OmieClient({ ...config, timeoutMs: 15_000 })).readAll({ pageSize: 100, maxPages: 200 })
  const normalized = raw.map(normalizeOmieProduct)
  const inactive = new Set(raw.flatMap((record, index) => isInactiveOmieRecord(record) ? [index] : []))
  const { data } = await query.graph({ entity: "product", fields: ["id", "status", "metadata", "variants.sku"] })
  const existing = (data as GraphProduct[]).map((product): MedusaOmieProjection => ({
    id: product.id,
    externalId: typeof product.metadata?.omie_external_id === "string" ? product.metadata.omie_external_id : null,
    fingerprint: typeof product.metadata?.omie_fingerprint === "string" ? product.metadata.omie_fingerprint : null,
    sku: product.variants?.[0]?.sku ?? null,
    status: product.status,
    storefrontVisible: typeof product.metadata?.storefront_visible === "boolean" ? product.metadata.storefront_visible : null,
    purchaseEnabled: typeof product.metadata?.purchase_enabled === "boolean" ? product.metadata.purchase_enabled : null,
    commercialStatus: typeof product.metadata?.commercial_status === "string" ? product.metadata.commercial_status : null,
  }))
  const plan = buildOmieReconciliation(normalized, existing, inactive)
  const counts = { create: 0, update: 0, noOp: 0, conflict: 0, skip: 0 }
  for (const item of plan) counts[item.action === "no-op" ? "noOp" : item.action]++
  logger.info(`[omie-gate5] mode=${applyRequested() ? "apply" : "dry-run"} products=${raw.length} create=${counts.create} update=${counts.update} no_op=${counts.noOp} conflict=${counts.conflict} skip=${counts.skip}`)
  if (!applyRequested()) return
  if (counts.conflict > 0) throw new Error("OMIE_RECONCILIATION_CONFLICT")

  const creates = plan.filter((item) => item.action === "create").map((item) => item.product)
  for (let offset = 0; offset < creates.length; offset += 50) {
    const products = creates.slice(offset, offset + 50).map((product) => {
      const variant = product.variants[0]
      if (!product.externalId || !product.title || !variant?.sku) throw new Error("OMIE_INVALID_CREATE")
      const price = variant.price.amount !== null && variant.price.amount > 0
        ? [{ amount: variant.price.amount, currency_code: "brl" }]
        : []
      return {
        title: product.title,
        handle: stableOmieHandle(product.externalId),
        status: ProductStatus.PUBLISHED,
        options: [{ title: "Default", values: ["Default"] }],
        variants: [{
          title: variant.title ?? product.title,
          sku: variant.sku,
          manage_inventory: true,
          allow_backorder: false,
          options: { Default: "Default" },
          prices: price,
        }],
        metadata: {
          source: "omie",
          omie_external_id: product.externalId,
          omie_fingerprint: omieFingerprint(product),
          commercial_status: "QUOTE_ONLY",
          product_sales_policy: "QUOTE_ONLY",
          price_pending: price.length === 0,
          storefront_visible: true,
          purchase_enabled: false,
          catalog_homologation_status: "pending",
          inventory_quantity_observed: variant.inventory.quantity,
        },
      }
    })
    await createProductsWorkflow(container).run({ input: { products } })
    logger.info(`[omie-gate5] persisted=${Math.min(offset + products.length, creates.length)}/${creates.length}`)
  }

  const byExternalId = new Map(existing.filter((row) => row.externalId).map((row) => [row.externalId as string, row]))
  const updates: ProductUpdate[] = plan.filter((item) => item.action === "update").map((item) => {
    const current = item.product.externalId ? byExternalId.get(item.product.externalId) : undefined
    const graphProduct = current ? (data as GraphProduct[]).find((product) => product.id === current.id) : undefined
    if (!current || !graphProduct) throw new Error("OMIE_UPDATE_MAPPING_MISSING")
    return {
      id: current.id,
      status: ProductStatus.PUBLISHED,
      metadata: {
        ...(graphProduct.metadata ?? {}),
        commercial_status: "QUOTE_ONLY",
        product_sales_policy: "QUOTE_ONLY",
        storefront_visible: true,
        purchase_enabled: false,
      },
    }
  })
  for (let offset = 0; offset < updates.length; offset += 50) {
    const batch = updates.slice(offset, offset + 50)
    await updateProductsWorkflow(container).run({ input: { products: batch } })
    logger.info(`[omie-gate5] reconciled=${Math.min(offset + batch.length, updates.length)}/${updates.length}`)
  }
}
