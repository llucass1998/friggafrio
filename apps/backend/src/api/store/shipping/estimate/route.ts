import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { SHIPPING_POLICY, createShippingPolicyQuote, createShippingDistanceProviderFromEnv, createUnavailableShippingQuoteOptions, type CommercialShippingAddress } from "../../../../utils/commercial-shipping-policy"
import type { CommercialLine } from "../../../../utils/cart-commercial-eligibility"

type EstimateBody = { cart_id?: unknown; address?: unknown; postal_code?: unknown; city?: unknown; province?: unknown; address_1?: unknown; country_code?: unknown }
type EstimateCart = { id: string; completed_at?: string | Date | null; customer_id?: string | null; shipping_address?: Record<string, unknown> | null; items?: CommercialLine[] }
const text = (value: unknown): string => typeof value === "string" ? value.trim() : ""
const normalizeAddress = (value: unknown): CommercialShippingAddress | undefined => {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const countryCode = text(input.country_code).toLowerCase()
  const postalDigits = text(input.postal_code).replace(/\D/g, "")
  const address: CommercialShippingAddress = { country_code: countryCode, province: text(input.province) || undefined, city: text(input.city) || undefined, postal_code: postalDigits.length === 8 ? `${postalDigits.slice(0, 5)}-${postalDigits.slice(5)}` : undefined, address_1: text(input.address_1) || undefined }
  if (countryCode !== "br" || !address.city || !address.postal_code) return undefined
  return address
}
const addressFromBody = (body: EstimateBody, baseAddress?: Record<string, unknown> | null): CommercialShippingAddress | undefined => normalizeAddress({ ...(baseAddress ?? {}), ...(body.address && typeof body.address === "object" ? body.address : body) })
const unauthorizedCart = (req: MedusaRequest, cart: EstimateCart): boolean => {
  const actorId = (req as MedusaRequest & { auth_context?: { actor_id?: string } }).auth_context?.actor_id
  if (cart.customer_id && actorId !== cart.customer_id) return true
  return !cart.customer_id && Boolean(actorId)
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body && typeof req.body === "object" ? req.body : {}) as EstimateBody
  const cartId = text(body.cart_id)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as { graph: (input: Record<string, unknown>) => Promise<{ data: unknown[] }> }
  let cart: EstimateCart | undefined
  if (cartId) {
    const result = await query.graph({ entity: "cart", fields: ["id", "completed_at", "customer_id", "shipping_address.*", "items.quantity", "items.unit_price", "items.metadata", "items.variant.metadata", "items.variant.product.metadata"], filters: { id: cartId } })
    cart = result.data[0] as EstimateCart | undefined
    if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
    if (cart.completed_at) return res.status(409).json({ status: "unavailable", reason: "CART_COMPLETED", options: [], currency_code: "brl" })
    if (unauthorizedCart(req, cart)) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Cart does not belong to the current session")
  }
  const address = addressFromBody(body, cart?.shipping_address)
  const lines: CommercialLine[] = cart?.items ?? []
  if (!address && !cartId) return res.status(422).json({ status: "unavailable", reason: "ADDRESS_NOT_RESOLVABLE", options: createUnavailableShippingQuoteOptions().map((option) => ({ id: option.id, name: option.label, amount: option.amountCentavos / 100, amount_cents: option.amountCentavos, currency_code: option.currencyCode, delivery_estimate: option.estimatedDelivery, estimated_date: option.estimatedDate, modality: option.modality, vehicle: option.vehicle, distance_km: option.distanceKm, region: "OUT_OF_COVERAGE", policy_version: option.policyVersion, available: option.available, reason: option.reason })), currency_code: "brl" })
  const quote = address
    ? await createShippingPolicyQuote({ address, lines, distanceProvider: createShippingDistanceProviderFromEnv() })
    : {
        region: "OUT_OF_COVERAGE" as const,
        subtotalCentavos: 0,
        distanceStatus: "unavailable" as const,
        options: createUnavailableShippingQuoteOptions(),
      }
  const options = quote.options.map((option) => ({ id: option.id, name: option.label, amount: option.amountCentavos / 100, amount_cents: option.amountCentavos, currency_code: option.currencyCode, delivery_estimate: option.estimatedDelivery, estimated_date: option.estimatedDate, modality: option.modality, vehicle: option.vehicle, distance_km: option.distanceKm, region: quote.region, policy_version: option.policyVersion, available: option.available, reason: option.reason }))
  if (cartId) {
    const shippingOptions = await query.graph({ entity: "shipping_option", fields: ["id", "data"], pagination: { skip: 0, take: 100 } })
    const optionIdByRate = new Map((shippingOptions.data as Array<{ id?: string; data?: Record<string, unknown> }>).flatMap((item) => typeof item.id === "string" && typeof item.data?.commercial_shipping_option === "string" ? [[item.data.commercial_shipping_option, item.id] as const] : []))
    for (const option of options) (option as { shipping_option_id?: string | null }).shipping_option_id = optionIdByRate.get(option.id) ?? null
  }
  return res.status(200).json({ status: "ready", options, currency_code: "brl", region: quote.region, subtotal_centavos: quote.subtotalCentavos, policy_version: SHIPPING_POLICY.version, address: address ? { city: address.city, province: address.province ?? null, postal_code: address.postal_code, country_code: address.country_code } : null })
}
