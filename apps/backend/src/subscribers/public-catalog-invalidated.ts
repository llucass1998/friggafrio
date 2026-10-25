import type { SubscriberConfig } from "@medusajs/framework"
import { ProductEvents, PricingEvents, InventoryEvents, RegionWorkflowEvents, SalesChannelWorkflowEvents } from "@medusajs/framework/utils"
import { invalidatePublicCatalog } from "../lib/catalog-cache"

export default async function publicCatalogInvalidated(): Promise<void> {
  await invalidatePublicCatalog()
}

// Constantes exportadas pela versão instalada; nunca invalidar no ACK do Omie.
export const config: SubscriberConfig = {
  event: [...Object.values(ProductEvents), ...Object.values(PricingEvents), ...Object.values(InventoryEvents), ...Object.values(RegionWorkflowEvents), ...Object.values(SalesChannelWorkflowEvents)],
}
