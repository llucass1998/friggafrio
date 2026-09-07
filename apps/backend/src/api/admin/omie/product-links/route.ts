import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type PrivateLink = {
  id: string
  code_display: string
  code_normalized: string
  product_id: string
  variant_id?: string | null
  source?: string | null
}

type QueryService = {
  graph: (input: Record<string, unknown>) => Promise<{ data: PrivateLink[] }>
}

const MAX_PRODUCT_IDS = 100
const MAX_SEARCH_RESULTS = 100

const normalize = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const term = value.trim()

  if (!term || term.length > 100 || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/.test(term)) {
    return null
  }

  return term.toLocaleUpperCase("pt-BR")
}

const parseProductIds = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : []
  return [...new Set(values.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, MAX_PRODUCT_IDS)
}

/**
 * Supplies the private code only to authenticated Admin views. This route is
 * deliberately outside /store so the code cannot become a public product field.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  // Private codes change independently from product catalog caching. Never let
  // an Admin table reuse a stale 304 response after a link is created or edited.
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("Pragma", "no-cache")

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as QueryService
  const term = normalize(req.query?.q)
  const productIds = parseProductIds(req.query?.product_ids)

  if (req.query?.q !== undefined && !term) {
    res.status(400).json({ code: "FRIGGA_OMIE_CODE_SEARCH_INVALID" })
    return
  }

  const { data } = await query.graph({
    entity: "frigga_omie_product_link",
    fields: ["id", "code_display", "code_normalized", "product_id", "variant_id", "source"],
    filters: { deleted_at: null },
    pagination: { skip: 0, take: 5_000 },
  })

  const matching = data.filter((link) => {
    if (term) return link.code_normalized.includes(term)
    if (productIds.length > 0) return productIds.includes(link.product_id)
    return true
  }).slice(0, term ? MAX_SEARCH_RESULTS : 5_000)

  res.status(200).json({
    links: matching,
    product_ids: term ? [...new Set(matching.map((link) => link.product_id))] : undefined,
  })
}
