import { Module } from "@medusajs/framework/utils"
import PromotionalBroadcastDraftService from "./service"

export const PROMOTIONAL_BROADCAST_DRAFT_MODULE = "promotionalBroadcastDraft"

export default Module(PROMOTIONAL_BROADCAST_DRAFT_MODULE, {
  service: PromotionalBroadcastDraftService,
})
