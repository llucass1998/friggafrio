import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type Query = { graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown>; pagination?: { skip: number; take: number } }) => Promise<{ data: unknown[] }> }

type PromotionRow = {
  id?: string
  status?: string
  metadata?: Record<string, unknown> | null
  campaign?: { id?: string; name?: string; starts_at?: string | Date | null; ends_at?: string | Date | null } | null
  application_method?: {
    type?: string
    value?: number | null
    currency_code?: string | null
    target_rules?: Array<{ attribute?: string; values?: Array<{ value?: string | null }> | null }> | null
  } | null
  rules?: Array<{ attribute?: string; values?: Array<{ value?: string | null }> | null }> | null
}

type PriceListRow = {
  id?: string
  title?: string
  type?: string
  status?: string
  starts_at?: string | Date | null
  ends_at?: string | Date | null
  prices?: Array<{ price_set_id?: string | null; amount?: number | null; currency_code?: string | null }>
}

type CatalogOffer = {
  id: string
  title: string
  startsAt: string
  endsAt: string
  status: "active"
  productIds: string[]
  source: "price_list"
}

const QUERY_PAGE_SIZE = 100

const queryAll = async <T>(
  query: Query,
  input: Omit<Parameters<Query["graph"]>[0], "pagination">,
): Promise<T[]> => {
  const rows: T[] = []

  for (let skip = 0; ; skip += QUERY_PAGE_SIZE) {
    const { data } = await query.graph({
      ...input,
      pagination: { skip, take: QUERY_PAGE_SIZE },
    })
    rows.push(...(data as T[]))
    if (data.length < QUERY_PAGE_SIZE) return rows
  }
}

const discountLabelFor = (applicationMethod: PromotionRow["application_method"]): string | undefined => {
  const type = String(applicationMethod?.type ?? "").toLowerCase()
  const value = Number(applicationMethod?.value)
  return type === "percentage" && Number.isFinite(value) && value > 0 ? `${value}% OFF` : undefined
}

const asIso = (value: unknown): string | null => {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const serverNow = new Date().toISOString()
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as Query
    const data = await queryAll<PromotionRow>(query, {
      entity: "promotion",
      fields: [
        "id",
        "status",
        "metadata",
        "campaign.id",
        "campaign.name",
        "campaign.starts_at",
        "campaign.ends_at",
        "application_method.type",
        "application_method.value",
        "application_method.currency_code",
        "application_method.target_rules.attribute",
        "application_method.target_rules.values.value",
        "rules.attribute",
        "rules.values.value",
      ],
      filters: { deleted_at: null },
    })

    const campaigns = data.flatMap((promotion) => {
      const campaign = promotion.campaign
      const startsAt = asIso(campaign?.starts_at)
      const endsAt = asIso(campaign?.ends_at)
      if (!promotion.id || !campaign?.name || !startsAt || !endsAt) return []
      const now = Date.parse(serverNow)
      const start = Date.parse(startsAt)
      const end = Date.parse(endsAt)
      const status = String(promotion.status ?? "").toLowerCase()
      const state = status === "disabled" || status === "inactive" || now >= end
        ? "ended"
        : now < start ? "upcoming" : "active"
      const metadataProductIds = Array.isArray(promotion.metadata?.product_ids)
        ? promotion.metadata?.product_ids.filter((id): id is string => typeof id === "string")
        : []
      const ruleProductIds = [
        ...(promotion.rules ?? []),
        ...(promotion.application_method?.target_rules ?? [])
      ]
        .filter((rule) => ["product_id", "product_ids", "items.product_id", "items.product_ids"].includes(String(rule.attribute ?? "").toLowerCase()))
        .flatMap((rule) => (rule.values ?? []).map((value) => value.value).filter((id): id is string => Boolean(id)))
      return [{
        id: promotion.id,
        title: campaign.name,
        startsAt,
        endsAt,
        status: state,
        productIds: [...new Set([...metadataProductIds, ...ruleProductIds])],
        discountLabel: discountLabelFor(promotion.application_method),
        source: "promotion" as const,
      }]
    })

    // Sale price lists are catalog offers: eligibility and amounts still come
    // from Medusa's pricing engine and are resolved by the Store API later.
    const priceLists = await queryAll<PriceListRow>(query, {
      entity: "price_list",
      fields: ["id", "title", "type", "status", "starts_at", "ends_at", "prices.price_set_id", "prices.amount", "prices.currency_code"],
      filters: { deleted_at: null, type: "sale" },
    })
    const saleLists = priceLists.flatMap((list) => {
      const startsAt = asIso(list.starts_at)
      const endsAt = asIso(list.ends_at)
      if (!list.id || !startsAt || !endsAt || String(list.status).toLowerCase() !== "active") return []
      const now = Date.parse(serverNow), start = Date.parse(startsAt), end = Date.parse(endsAt)
      if (now < start || now >= end) return []
      const priceSetIds = (list.prices ?? []).map((price) => price.price_set_id).filter((id): id is string => Boolean(id))
      return priceSetIds.length ? [{ list, startsAt, endsAt, priceSetIds }] : []
    })
    const offers: CatalogOffer[] = []
    if (saleLists.length) {
      const links = await queryAll<{ variant_id?: string; price_set_id?: string }>(query, {
        entity: "product_variant_price_set",
        fields: ["variant_id", "price_set_id"],
        filters: { price_set_id: saleLists.flatMap((item) => item.priceSetIds) },
      })
      const variantIds = links.map((link) => link.variant_id).filter((id): id is string => Boolean(id))
      const variants = variantIds.length
        ? await queryAll<{ id?: string; product_id?: string }>(query, {
          entity: "product_variant",
          fields: ["id", "product_id"],
          filters: { id: variantIds },
        })
        : []
      const productByVariantId = new Map(variants.map((variant) => [variant.id, variant.product_id]))
      for (const item of saleLists) {
        const ids = links
          .filter((link) => item.priceSetIds.includes(String(link.price_set_id)))
          .map((link) => link.variant_id)
          .map((variantId) => productByVariantId.get(variantId))
          .filter((id): id is string => Boolean(id))
        if (ids.length) {
          offers.push({
            id: item.list.id!,
            title: item.list.title || "Oferta",
            startsAt: item.startsAt,
            endsAt: item.endsAt,
            status: "active",
            productIds: [...new Set(ids)],
            source: "price_list",
          })
        }
      }
    }

    // Price-list membership is only a candidate. The Store API resolves the
    // actual region, currency, quantity, publication, and final sale price.
    res.setHeader?.("Cache-Control", "no-store, max-age=0")
    res.json({ serverNow, campaigns, offers, revalidateAfterMs: 30_000 })
  } catch {
    // A missing/temporarily unavailable promotion projection must not break
    // the Storefront. Pricing remains authoritative in Medusa checkout.
    res.setHeader?.("Cache-Control", "no-store, max-age=0")
    res.json({ serverNow, campaigns: [], offers: [], unavailable: true, revalidateAfterMs: 30_000 })
  }
}
