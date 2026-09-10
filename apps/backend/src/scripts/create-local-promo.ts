import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createCampaignsWorkflow, createPromotionsWorkflow } from "@medusajs/medusa/core-flows"

export default async function run({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as { graph(input: any): Promise<{ data: any[] }> }
  const name = "TESTE VISUAL HOME - 10% - LOCAL"
  const prior = await query.graph({ entity: "promotion", fields: ["id"], filters: { code: name }, pagination: { take: 1 } })
  if (prior.data.length) throw new Error("PROMOTION_ALREADY_EXISTS")
  const productId = "prod_01KZWB54AZ2ZP28RPT7R67D3V1"
  const now = new Date(), ends = new Date(now.getTime() + 86400000)
  const campaign = await createCampaignsWorkflow(container).run({ input: { campaignsData: [{ name, campaign_identifier: "frigga-local-visual-home-10", starts_at: now, ends_at: ends }] } })
  await createPromotionsWorkflow(container).run({ input: { promotionsData: [{ code: name, type: "standard", status: "active", is_automatic: true, campaign_id: campaign.result[0].id, application_method: { type: "percentage", target_type: "items", allocation: "across", value: 10, currency_code: "brl", target_rules: [{ attribute: "items.product_id", operator: "in", values: [productId] }] } }] } })
}
