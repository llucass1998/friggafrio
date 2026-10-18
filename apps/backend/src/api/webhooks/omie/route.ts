import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
  updateProductsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  OmieClient,
  loadOmieConfig,
  normalizeOmieProduct,
  normalizeOmieStock,
} from "../../../integrations/omie"
import { omieFingerprint, stableOmieHandle } from "../../../integrations/omie/reconciliation"

const STOCK_LOCATION_NAME = "FriggaFrio - Loja 1 / Matriz"
const DEFAULT_OMIE_STOCK_LOCATION_CODE = 1982255302

type Query = {
  graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: unknown[] }>
}

type ProductGraphRow = {
  id: string
  title?: string
  metadata?: Record<string, unknown> | null
  variants?: Array<{
    id?: string
    sku?: string | null
    inventory_items?: Array<{ inventory_item_id?: string | null }> | null
  }> | null
}

type StockLocationRow = {
  id?: string
  name?: string
}

type InventoryLevelRow = {
  id: string
  inventory_item_id: string
  location_id: string
  stocked_quantity: number
  reserved_quantity: number
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>
  const config = loadOmieConfig()
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  // 1. Validate Omie appKey if configured
  const configuredAppKey = config?.appKey || process.env.OMIE_APP_KEY?.trim()
  const incomingAppKey = String(body.appKey || body.app_key || "")
  if (configuredAppKey && incomingAppKey && incomingAppKey !== configuredAppKey) {
    logger?.warn("[omie-webhook] Rejeitado: appKey incorreto")
    return res.status(401).json({ error: "unauthorized" })
  }

  const topic = String(body.topic || body.event || body.assunto || "")
  const messageId = String(body.messageId || body.id || "")
  const eventData = (body.eventData && typeof body.eventData === "object"
    ? body.eventData
    : body) as Record<string, unknown>

  logger?.info(`[omie-webhook] Recebido topic=${topic} messageId=${messageId}`)

  const rawCodProd = eventData.nCodProd ?? eventData.id_produto ?? eventData.codigo_produto ?? eventData.id
  const rawSku = eventData.cCodigo ?? eventData.cCodInt ?? eventData.codigo ?? eventData.sku
  const externalId = rawCodProd ? String(rawCodProd).trim() : null
  const sku = rawSku ? String(rawSku).trim() : null

  if (!externalId && !sku) {
    // Ack the webhook to avoid endless retries if payload lacks identifiers
    return res.status(200).json({ received: true, skipped: true, reason: "missing_product_identifiers" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as Query

  // Find target product in Medusa
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "metadata",
      "variants.id",
      "variants.sku",
      "variants.inventory_items.inventory_item_id",
    ],
    filters: { deleted_at: null },
  })

  const matchingProduct = (products as ProductGraphRow[]).find((p) => {
    const prodExternalId = p.metadata?.omie_external_id ? String(p.metadata.omie_external_id) : null
    if (externalId && prodExternalId && prodExternalId === externalId) return true
    if (sku && p.variants?.some((v) => v.sku?.toLowerCase() === sku.toLowerCase())) return true
    return false
  })

  // Handle Event: Movimentacao de Estoque (Estoque em Tempo Real)
  if (topic.includes("Estoque") || topic.includes("MovimentacaoEstoque")) {
    if (!matchingProduct) {
      logger?.warn(`[omie-webhook-stock] Produto nao encontrado no Medusa externalId=${externalId} sku=${sku}`)
      return res.status(200).json({ received: true, updated: false, reason: "product_not_found" })
    }

    const inventoryItemId = matchingProduct.variants?.[0]?.inventory_items?.[0]?.inventory_item_id
    if (!inventoryItemId) {
      logger?.warn(`[omie-webhook-stock] Inventory item nao associado ao produto ${matchingProduct.id}`)
      return res.status(200).json({ received: true, updated: false, reason: "inventory_item_missing" })
    }

    // Resolve Stock Location
    const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id", "name"] })
    const location = (locations as StockLocationRow[]).find((l) => l.name === STOCK_LOCATION_NAME)
    if (!location?.id) {
      logger?.error("[omie-webhook-stock] Localizacao Matriz nao encontrada no Medusa")
      return res.status(500).json({ error: "stock_location_unresolved" })
    }

    // Determine target stocked quantity
    let targetQuantity: number | null = null
    const rawSaldo = eventData.nSaldoAtual ?? eventData.nSaldo ?? eventData.saldo ?? eventData.saldo_estoque
    if (rawSaldo !== undefined && rawSaldo !== null && rawSaldo !== "") {
      const parsed = Number(String(rawSaldo).replace(",", "."))
      if (Number.isFinite(parsed) && parsed >= 0) {
        targetQuantity = parsed
      }
    }

    // If stock quantity wasn't in the webhook payload, query live Omie stock for this specific product
    if (targetQuantity === null && config) {
      try {
        const client = new OmieClient({ ...config, timeoutMs: 10_000 })
        const stockResponse = await client.request<Record<string, unknown>>("ListarPosEstoque", {
          nPagina: 1,
          nRegPorPagina: 1,
          cExibeTodos: "S",
          codigo_local_estoque: DEFAULT_OMIE_STOCK_LOCATION_CODE,
          cCodigo: sku ?? undefined,
        })
        const rows = Array.isArray(stockResponse.produtos) ? (stockResponse.produtos as Record<string, unknown>[]) : []
        const matchedRow = rows[0]
        if (matchedRow) {
          const normalized = normalizeOmieStock(matchedRow)
          if (normalized.physical !== null && normalized.physical >= 0) {
            targetQuantity = normalized.physical
          }
        }
      } catch (err) {
        logger?.warn(`[omie-webhook-stock] Falha ao consultar ListarPosEstoque na Omie: ${(err as Error).message}`)
      }
    }

    if (targetQuantity === null) {
      return res.status(200).json({ received: true, updated: false, reason: "quantity_unresolved" })
    }

    // Check existing inventory levels
    const { data: levels } = await query.graph({
      entity: "inventory_level",
      fields: ["id", "inventory_item_id", "location_id", "stocked_quantity", "reserved_quantity"],
      filters: { inventory_item_id: inventoryItemId, location_id: location.id },
    })

    const existingLevel = (levels as InventoryLevelRow[])[0]
    if (existingLevel) {
      await updateInventoryLevelsWorkflow(req.scope).run({
        input: {
          updates: [{
            inventory_item_id: inventoryItemId,
            location_id: location.id,
            stocked_quantity: targetQuantity,
          }],
        },
      })
      logger?.info(`[omie-webhook-stock] Atualizado estoque produto=${matchingProduct.id} sku=${sku} novo_saldo=${targetQuantity}`)
    } else {
      await createInventoryLevelsWorkflow(req.scope).run({
        input: {
          inventory_levels: [{
            inventory_item_id: inventoryItemId,
            location_id: location.id,
            stocked_quantity: targetQuantity,
          }],
        },
      })
      logger?.info(`[omie-webhook-stock] Criado nivel de estoque produto=${matchingProduct.id} sku=${sku} saldo=${targetQuantity}`)
    }

    return res.status(200).json({
      received: true,
      updated: true,
      productId: matchingProduct.id,
      stockedQuantity: targetQuantity,
    })
  }

  // Handle Event: Alteracao de Produto (Preco, Descricao, Ativacao)
  if (topic.includes("Alterado") || topic.includes("Modificado")) {
    if (!matchingProduct) {
      return res.status(200).json({ received: true, updated: false, reason: "product_not_found_for_update" })
    }

    // If Omie config is available, query full product to get fresh price and title
    if (config) {
      try {
        const client = new OmieClient({ ...config, timeoutMs: 10_000 })
        const response = await client.request<Record<string, unknown>>("ListarProdutos", {
          pagina: 1,
          registros_por_pagina: 1,
          apenas_importado_api: "N",
          filtrar_apenas_omiepdv: "N",
          cCodigo: sku ?? undefined,
        })
        const items = Array.isArray(response.produto_servico_cadastro)
          ? (response.produto_servico_cadastro as Record<string, unknown>[])
          : []
        const item = items[0]
        if (item) {
          const normalized = normalizeOmieProduct(item)
          const newPrice = normalized.variants[0]?.price?.amount
          await updateProductsWorkflow(req.scope).run({
            input: {
              products: [{
                id: matchingProduct.id,
                title: normalized.title || matchingProduct.title,
                metadata: {
                  ...(matchingProduct.metadata ?? {}),
                  omie_fingerprint: omieFingerprint(normalized),
                  storefront_visible: true,
                },
              }],
            },
          })
          logger?.info(`[omie-webhook-product] Produto atualizado: ${matchingProduct.id} preco=${newPrice}`)
          return res.status(200).json({ received: true, updated: true, productId: matchingProduct.id })
        }
      } catch (err) {
        logger?.warn(`[omie-webhook-product] Falha ao consultar produto na Omie: ${(err as Error).message}`)
      }
    }

    return res.status(200).json({ received: true, updated: false, reason: "upstream_query_failed" })
  }

  // Handle Event: Insercao de Novo Produto no Omie
  if (topic.includes("Inserido") || topic.includes("Cadastrado") || topic.includes("Incluido")) {
    if (matchingProduct) {
      return res.status(200).json({ received: true, created: false, reason: "already_exists", productId: matchingProduct.id })
    }

    if (config && (sku || externalId)) {
      try {
        const client = new OmieClient({ ...config, timeoutMs: 10_000 })
        const response = await client.request<Record<string, unknown>>("ListarProdutos", {
          pagina: 1,
          registros_por_pagina: 1,
          apenas_importado_api: "N",
          filtrar_apenas_omiepdv: "N",
          cCodigo: sku ?? undefined,
        })
        const items = Array.isArray(response.produto_servico_cadastro)
          ? (response.produto_servico_cadastro as Record<string, unknown>[])
          : []
        const item = items[0]
        if (item) {
          const normalized = normalizeOmieProduct(item)
          const variant = normalized.variants[0]
          if (normalized.externalId && normalized.title && variant?.sku) {
            const price = variant.price.amount !== null && variant.price.amount > 0
              ? [{ amount: variant.price.amount, currency_code: "brl" }]
              : []
            await createProductsWorkflow(req.scope).run({
              input: {
                products: [{
                  title: normalized.title,
                  handle: stableOmieHandle(normalized.externalId),
                  status: ProductStatus.PUBLISHED,
                  options: [{ title: "Default", values: ["Default"] }],
                  variants: [{
                    title: variant.title ?? normalized.title,
                    sku: variant.sku,
                    manage_inventory: true,
                    allow_backorder: false,
                    options: { Default: "Default" },
                    prices: price,
                  }],
                  metadata: {
                    source: "omie",
                    omie_external_id: normalized.externalId,
                    omie_fingerprint: omieFingerprint(normalized),
                    is_quote_only: false,
                    commercial_status: price.length > 0 ? "OUT_OF_STOCK" : "PRICE_PENDING",
                    product_sales_policy: "DIRECT",
                    price_pending: price.length === 0,
                    storefront_visible: true,
                    purchase_enabled: true,
                    catalog_homologation_status: "pending",
                    inventory_quantity_observed: variant.inventory.quantity,
                  },
                }],
              },
            })
            logger?.info(`[omie-webhook-product] Novo produto criado no Medusa: ${normalized.title} (${variant.sku})`)
            return res.status(200).json({ received: true, created: true, sku: variant.sku })
          }
        }
      } catch (err) {
        logger?.warn(`[omie-webhook-product] Falha ao criar produto inserido: ${(err as Error).message}`)
      }
    }

    return res.status(200).json({ received: true, created: false })
  }

  // Handle Event: Exclusao / Desativacao
  if (topic.includes("Excluido") || topic.includes("Inativado")) {
    if (matchingProduct) {
      await updateProductsWorkflow(req.scope).run({
        input: {
          products: [{
            id: matchingProduct.id,
            status: ProductStatus.DRAFT,
            metadata: {
              ...(matchingProduct.metadata ?? {}),
              storefront_visible: false,
            },
          }],
        },
      })
      logger?.info(`[omie-webhook-product] Produto desativado: ${matchingProduct.id}`)
      return res.status(200).json({ received: true, deactivated: true, productId: matchingProduct.id })
    }
  }

  return res.status(200).json({ received: true, topic, messageId })
}
