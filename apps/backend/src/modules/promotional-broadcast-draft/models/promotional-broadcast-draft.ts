import { model } from "@medusajs/framework/utils"

export enum PromotionalBroadcastDraftStatus {
  DRAFT = "draft",
}

export const PromotionalBroadcastDraft = model
  .define("promotional_broadcast_draft", {
    id: model.id().primaryKey(),
    promotion_id: model.text(),
    product_ids: model.text(),
    idempotency_key: model.text(),
    broadcast_id: model.text().nullable(),
    status: model.enum(Object.values(PromotionalBroadcastDraftStatus)).default(PromotionalBroadcastDraftStatus.DRAFT),
  })
  .indexes([
    { name: "IDX_promotional_broadcast_draft_promotion", on: ["promotion_id"] },
    { name: "IDX_promotional_broadcast_draft_idempotency", on: ["idempotency_key"] },
  ])

export default PromotionalBroadcastDraft
