import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { invalidatePublicCatalog } from "../../lib/catalog-cache"
import type { MedusaContainer, CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import { createProductsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { OmieClient, OmieCatalogReader, loadOmieConfig, normalizeOmieProduct } from "../../integrations/omie"
import { omieFingerprint, stableOmieHandle, isInactiveOmieRecord } from "../../integrations/omie/reconciliation"

export interface SyncCatalogInput { sku?: string; externalId?: string; pageSize?: number; maxPages?: number; deleted?: boolean }
export interface CatalogResult { synced: number; skipped?: boolean; reason?: string }

export async function syncCatalog(input: SyncCatalogInput, container: MedusaContainer): Promise<CatalogResult> {
  const config = loadOmieConfig()
  if (!config) return { synced: 0, skipped: true, reason: "missing_credentials" }
  const client = new OmieClient(config)
  const reader = new OmieCatalogReader(client)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let synced = 0
  let page = 1
  let more = true
  while (more) {
    if (page > (input.maxPages ?? 100)) throw new Error("OMIE_CATALOG_PAGINATION_INCOMPLETE")
    const result = input.sku || input.externalId
      ? { products: [await client.request<Record<string, unknown>>("ConsultarProduto", input.externalId
        ? { codigo_produto: Number(input.externalId) } : { codigo: input.sku })], hasMore: false }
      : await reader.readPage(page, input.pageSize ?? 50)
    const pageProducts = result.products.map((raw) => {
      const product = normalizeOmieProduct(raw)
      if (!product.externalId || !product.title || product.variants.some((variant) => !variant.sku)) throw new Error("OMIE_PRODUCT_IDENTITY_REQUIRED")
      return { raw, product: product as typeof product & { title: string; externalId: string } }
    })
    // O SKU é indexado no Medusa; uma única consulta por página evita N consultas por produto.
    const pageSkus = [...new Set(pageProducts.flatMap(({ product }) => product.variants.map((variant) => variant.sku as string)))]
    const { data: rawMatches } = await query.graph({ entity: "product_variant", filters: { sku: pageSkus }, fields: ["id", "sku", "product.id", "product.metadata", "product.variants.id", "product.variants.sku"] })
    interface ExistingVariantRef { id?: string | null; sku?: string | null }
    interface ExistingProductRef { id?: string | null; metadata?: Record<string, unknown> | null; variants?: ExistingVariantRef[] | null }
    interface VariantMatch { id?: string | null; sku?: string | null; product?: ExistingProductRef | null }
    const matches = rawMatches as VariantMatch[]
    const productIdsBySku = new Map<string, Set<string>>()
    const existingByProductId = new Map<string, ExistingProductRef>()
    for (const variant of matches) {
      const productId = variant.product?.id
      if (!productId || !variant.sku || !variant.product) continue
      existingByProductId.set(productId, variant.product)
      const owners = productIdsBySku.get(variant.sku) ?? new Set<string>()
      owners.add(productId)
      productIdsBySku.set(variant.sku, owners)
    }
    const updates: Array<{ id: string; title: string; status?: typeof ProductStatus.DRAFT; metadata: Record<string, unknown> }> = []
    const creates: CreateProductWorkflowInputDTO[] = []
    for (const { raw, product } of pageProducts) {
      const skus = product.variants.map((variant) => variant.sku as string)
      const ids = [...new Set(skus.flatMap((sku) => [...(productIdsBySku.get(sku) ?? [])]))]
      if (ids.length > 1) throw new Error("OMIE_PRODUCT_MAPPING_AMBIGUOUS")
      const existing = ids.length === 1 ? existingByProductId.get(ids[0]!) : undefined
      if (existing?.metadata?.omie_external_id && String(existing.metadata.omie_external_id) !== product.externalId) throw new Error("OMIE_PRODUCT_MAPPING_CONFLICT")
      const inactive = input.deleted || isInactiveOmieRecord(raw)
      const metadata = { ...(existing?.metadata ?? {}), source: "omie", omie_external_id: product.externalId,
        omie_code: product.code, unit: product.unit, unidade: product.unit, ...product.technicalAttributes,
        omie_fingerprint: omieFingerprint(product),
        // Novos produtos permanecem fechados até homologação comercial/fiscal.
        storefront_visible: inactive ? false : existing?.metadata?.storefront_visible === true,
        purchase_enabled: inactive ? false : existing?.metadata?.purchase_enabled === true,
      }
      const variants = product.variants.map((variant) => ({
        ...(existing?.variants?.find((current) => current.sku === variant.sku)?.id
          ? { id: existing.variants.find((current) => current.sku === variant.sku)!.id } : {}),
        title: variant.title ?? product.title!, sku: variant.sku!, barcode: variant.ean,
        weight: variant.grossWeight === null || variant.grossWeight === undefined ? undefined : Math.round(variant.grossWeight * 1000),
        height: variant.height, width: variant.width, length: variant.length,
        manage_inventory: true, allow_backorder: false,
        metadata: { omie_external_id: variant.externalId, unit: variant.unit, ncm: variant.ncm, cest: variant.cest, net_weight: variant.netWeight },
        options: { Variante: variant.sku! },
        prices: variant.price.amount !== null && variant.price.amount > 0 ? [{ amount: variant.price.amount, currency_code: "brl" }] : [],
      }))
      if (existing?.id) {
        // Opções existentes precisam ser reconciliadas explicitamente antes de mudar variantes.
        updates.push({ id: existing.id, title: product.title,
          ...(inactive ? { status: ProductStatus.DRAFT } : {}), metadata })
      } else if (!inactive) {
        creates.push({ title: product.title, handle: stableOmieHandle(product.externalId), status: ProductStatus.DRAFT,
          options: [{ title: "Variante", values: skus }], variants, metadata })
      }
      synced++
    }
    if (updates.length) await updateProductsWorkflow(container).run({ input: { products: updates } })
    if (creates.length) await createProductsWorkflow(container).run({ input: { products: creates } })
    if (updates.length || creates.length) await invalidatePublicCatalog()
    more = result.hasMore
    page++
  }
  return { synced }
}
export const syncOmieCatalogStep = createStep("sync-omie-catalog",
  async (input: SyncCatalogInput, { container }): Promise<StepResponse<CatalogResult>> => new StepResponse(await syncCatalog(input, container)))
export const syncOmieCatalogWorkflow = createWorkflow("sync-omie-catalog", (input: SyncCatalogInput) => new WorkflowResponse(syncOmieCatalogStep(input)))
