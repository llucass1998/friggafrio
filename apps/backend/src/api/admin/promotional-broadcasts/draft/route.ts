import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { PROMOTIONAL_BROADCAST_DRAFT_MODULE } from "../../../../modules/promotional-broadcast-draft"
import type PromotionalBroadcastDraftService from "../../../../modules/promotional-broadcast-draft/service"
import { getResendConfigStatus, resendRequest } from "../../../../lib/email/resend"
import { renderPromotional3Products } from "../../../../lib/email/promotional-3-products"
import type { PromotionalProduct } from "../../../../lib/email/promotional-3-products"

const inputSchema = z.object({
  promotion_id: z.string().trim().min(1).max(100),
  product_ids: z.array(z.string().trim().min(1).max(100)).length(3),
}).strict()

type DraftService = PromotionalBroadcastDraftService & {
  listPromotionalBroadcastDrafts: (filters: Record<string, unknown>) => Promise<Array<{ id: string; promotion_id: string; broadcast_id?: string | null }>>
  createPromotionalBroadcastDrafts: (input: Record<string, unknown>) => Promise<{ id: string }>
  updatePromotionalBroadcastDrafts: (input: Record<string, unknown>) => Promise<unknown>
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const parsed = inputSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: "Selecione exatamente três produtos." })
  if (new Set(parsed.data.product_ids).size !== 3) return res.status(400).json({ message: "Selecione exatamente três produtos." })
  const config = getResendConfigStatus()
  const audienceId = process.env.RESEND_AUDIENCE_ID?.trim()
  const segmentId = process.env.RESEND_SEGMENT_ID?.trim()
  if (config.missing.length || (!audienceId && !segmentId)) return res.status(503).json({ message: "Resend promotional configuration is unavailable.", missing: [...config.missing, ...(!audienceId && !segmentId ? ["RESEND_AUDIENCE_ID_OR_RESEND_SEGMENT_ID"] : [])] })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "metadata", "thumbnail", "variants.id", "variants.title", "variants.metadata", "variants.prices.*", "variants.inventory_quantity", "variants.manage_inventory", "variants.allow_backorder"],
    filters: { id: parsed.data.product_ids, status: "published", deleted_at: null },
  }) as { data: Array<Record<string, unknown>> }
  if (data.length !== 3) return res.status(422).json({ message: "Produtos elegíveis não encontrados." })

  let products: PromotionalProduct[]
  try {
    products = data.map((item) => {
    const variant = (Array.isArray(item.variants) ? item.variants : [])[0] as Record<string, unknown> | undefined
    const metadata = { ...(item.metadata as Record<string, unknown> | undefined), ...((variant?.metadata as Record<string, unknown> | undefined) || {}) }
    const normalPrice = Number(metadata.normal_price)
    const promotionalPrice = Number(metadata.promotional_price)
    const imageUrl = String(item.thumbnail || "")
    const handle = String(item.handle || "")
    const validUntil = typeof metadata.valid_until === "string" ? Date.parse(metadata.valid_until) : Number.NaN
    if (!metadata.promotion_id || metadata.promotion_id !== parsed.data.promotion_id || !metadata.region || !metadata.currency || !metadata.channel || metadata.eligible !== true || metadata.stock !== true || !Number.isFinite(validUntil) || validUntil <= Date.now() || !Number.isFinite(normalPrice) || !Number.isFinite(promotionalPrice)) throw new Error("Product is not eligible for this promotion")
      return { name: String(item.title || ""), variant: String(variant?.title || ""), imageUrl, productUrl: `${config.storefrontUrl.replace(/\/$/, "")}/br/products/${encodeURIComponent(handle)}`, normalPrice, promotionalPrice, discountPercent: ((normalPrice - promotionalPrice) / normalPrice) * 100 }
    })
  } catch {
    return res.status(422).json({ message: "Promotion data is invalid or incomplete." })
  }
  let html: string
  try { html = renderPromotional3Products(products) } catch { return res.status(422).json({ message: "Promotion data is invalid or incomplete." }) }
  const idempotencyKey = `promotion-draft-${parsed.data.promotion_id}-${[...parsed.data.product_ids].sort().join("-")}`
  const drafts = req.scope.resolve(PROMOTIONAL_BROADCAST_DRAFT_MODULE) as DraftService
  const existing = await drafts.listPromotionalBroadcastDrafts({ idempotency_key: idempotencyKey })
  const existingDraft = existing[0]
  if (existingDraft?.broadcast_id) {
    return res.status(200).json({ status: "draft", broadcast_id: existingDraft.broadcast_id, promotion_id: parsed.data.promotion_id, idempotent: true })
  }
  const result = await resendRequest("/broadcasts", {
    name: `FriggaFrio - ${parsed.data.promotion_id}`,
    ...(segmentId ? { segment_id: segmentId } : { audience_id: audienceId }),
    ...(process.env.RESEND_PROMOTIONS_TOPIC_ID?.trim() ? { topic_id: process.env.RESEND_PROMOTIONS_TOPIC_ID.trim() } : {}),
    from: config.from,
    subject: "Ofertas FriggaFrio",
    preview_text: "Condições especiais por tempo limitado.",
    html,
  }, idempotencyKey)
  if (!result.ok || !result.id) return res.status(502).json({ message: "Resend did not create the promotional draft." })
  try {
    const draft = existingDraft
      ? existingDraft
      : await drafts.createPromotionalBroadcastDrafts({
          promotion_id: parsed.data.promotion_id,
          product_ids: JSON.stringify([...parsed.data.product_ids].sort()),
          idempotency_key: idempotencyKey,
          status: "draft",
        })
    await drafts.updatePromotionalBroadcastDrafts({ id: draft.id, broadcast_id: result.id, status: "draft" })
  } catch {
    // A concurrent request may have persisted the same idempotency key.
    const raced = await drafts.listPromotionalBroadcastDrafts({ idempotency_key: idempotencyKey })
    if (!raced[0]?.broadcast_id) return res.status(503).json({ message: "Promotional draft association is temporarily unavailable." })
    return res.status(200).json({ status: "draft", broadcast_id: raced[0].broadcast_id, promotion_id: parsed.data.promotion_id, idempotent: true })
  }
  return res.status(201).json({ status: "draft", broadcast_id: result.id, promotion_id: parsed.data.promotion_id })
}
