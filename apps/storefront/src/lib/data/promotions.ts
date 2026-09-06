import { sdk } from "@/lib/medusa"

export type PromotionCampaign = {
  id: string
  title: string
  startsAt: string
  endsAt: string
  status: "upcoming" | "active" | "ended"
  productIds: string[]
  discountLabel?: string
  source?: "promotion" | "price_list"
}

export type PromotionsResponse = {
  serverNow: string
  campaigns: PromotionCampaign[]
  offers?: PromotionCampaign[]
  revalidateAfterMs?: number
  unavailable?: boolean
}

export const getPromotionCampaigns = async (): Promise<PromotionsResponse> =>
  sdk.client.fetch<PromotionsResponse>("/store/promotions", { method: "GET" })
