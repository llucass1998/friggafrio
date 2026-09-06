import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { FRIGGA_OMIE_PRODUCT_LINK_MODULE } from "../../../../../../modules/frigga-omie-product-link"

const CODE = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/
const normalize = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return CODE.test(trimmed) ? trimmed.toLocaleUpperCase("pt-BR") : null
}
type Link = { id: string; code_display: string; code_normalized: string; product_id: string; variant_id?: string | null; source?: string }

const service = (req: MedusaRequest) => req.scope.resolve(FRIGGA_OMIE_PRODUCT_LINK_MODULE) as {
  createFriggaOmieProductLinks: (input: Record<string, unknown>) => Promise<Link | Link[]>
  updateFriggaOmieProductLinks: (input: Record<string, unknown>) => Promise<Link | Link[]>
  deleteFriggaOmieProductLinks: (id: string) => Promise<void>
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as { graph: (input: Record<string, unknown>) => Promise<{ data: Link[] }> }
  const { data } = await query.graph({ entity: "frigga_omie_product_link", fields: ["id", "code_display", "code_normalized", "product_id", "variant_id", "source"], filters: { product_id: req.params.productId, deleted_at: null } })
  res.status(200).json({ links: data })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body ?? {}) as { code?: unknown; variant_id?: unknown; source?: unknown }
  const normalized = normalize(body.code)
  if (!normalized) return void res.status(400).json({ code: "FRIGGA_OMIE_CODE_INVALID", message: "Informe um codigo valido." })
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as { graph: (input: Record<string, unknown>) => Promise<{ data: Link[] }> }
  const { data: conflicts } = await query.graph({ entity: "frigga_omie_product_link", fields: ["id", "product_id", "variant_id"], filters: { code_normalized: normalized, deleted_at: null } })
  if (conflicts.length) return void res.status(409).json({ code: "FRIGGA_OMIE_CODE_DUPLICATE", message: "Este codigo ja esta associado a outro produto." })
  try {
    const created = await service(req).createFriggaOmieProductLinks({ code_display: String(body.code).trim(), code_normalized: normalized, product_id: req.params.productId, variant_id: typeof body.variant_id === "string" ? body.variant_id : null, source: typeof body.source === "string" ? body.source : "manual" })
    res.status(201).json({ link: Array.isArray(created) ? created[0] : created })
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) return void res.status(409).json({ code: "FRIGGA_OMIE_CODE_DUPLICATE", message: "Este codigo ja esta associado a outro produto." })
    res.status(500).json({ code: "FRIGGA_OMIE_CODE_SAVE_FAILED", message: "Nao foi possivel salvar o codigo." })
  }
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body ?? {}) as { link_id?: unknown; code?: unknown; variant_id?: unknown }
  const normalized = normalize(body.code)
  if (typeof body.link_id !== "string" || !normalized) return void res.status(400).json({ code: "FRIGGA_OMIE_CODE_INVALID" })
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as { graph: (input: Record<string, unknown>) => Promise<{ data: Link[] }> }
  const { data: owned } = await query.graph({ entity: "frigga_omie_product_link", fields: ["id", "product_id"], filters: { id: body.link_id, product_id: req.params.productId, deleted_at: null } })
  if (!owned.length) return void res.status(404).json({ code: "FRIGGA_OMIE_LINK_NOT_FOUND" })
  const { data: conflicts } = await query.graph({ entity: "frigga_omie_product_link", fields: ["id"], filters: { code_normalized: normalized, deleted_at: null } })
  if (conflicts.some((item) => item.id !== body.link_id)) return void res.status(409).json({ code: "FRIGGA_OMIE_CODE_DUPLICATE" })
  try {
    const updated = await service(req).updateFriggaOmieProductLinks({ id: body.link_id, code_display: String(body.code).trim(), code_normalized: normalized, variant_id: typeof body.variant_id === "string" ? body.variant_id : null })
    res.status(200).json({ link: Array.isArray(updated) ? updated[0] : updated })
  } catch { res.status(500).json({ code: "FRIGGA_OMIE_CODE_SAVE_FAILED", message: "Nao foi possivel salvar o codigo." }) }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const linkId = typeof req.query?.link_id === "string" ? req.query.link_id : null
  if (!linkId) return void res.status(400).json({ code: "FRIGGA_OMIE_LINK_REQUIRED" })
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as { graph: (input: Record<string, unknown>) => Promise<{ data: Link[] }> }
  const { data: owned } = await query.graph({ entity: "frigga_omie_product_link", fields: ["id", "product_id"], filters: { id: linkId, product_id: req.params.productId, deleted_at: null } })
  if (!owned.length) return void res.status(404).json({ code: "FRIGGA_OMIE_LINK_NOT_FOUND" })
  await service(req).deleteFriggaOmieProductLinks(linkId)
  res.status(204).send()
}
