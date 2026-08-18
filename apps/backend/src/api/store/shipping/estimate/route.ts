import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  COMMERCIAL_SHIPPING_RATES,
  createCommercialShippingContext,
  createShippingDistanceProviderFromEnv,
  type CommercialShippingAddress,
} from "../../../../utils/commercial-shipping-policy"
import type { CommercialLine } from "../../../../utils/cart-commercial-eligibility"

type EstimateBody = {
  cart_id?: unknown
  address?: unknown
  postal_code?: unknown
  city?: unknown
  province?: unknown
  address_1?: unknown
  country_code?: unknown
}

type EstimateCart = {
  id: string
  completed_at?: string | Date | null
  customer_id?: string | null
  shipping_address?: Record<string, unknown> | null
  items?: CommercialLine[]
}

const text = (value: unknown): string => typeof value === "string" ? value.trim() : ""

const normalizeAddress = (value: unknown): CommercialShippingAddress | undefined => {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const countryCode = text(input.country_code).toLowerCase()
  const postalDigits = text(input.postal_code).replace(/\D/g, "")
  const address: CommercialShippingAddress = {
    country_code: countryCode,
    province: text(input.province) || undefined,
    city: text(input.city) || undefined,
    postal_code: postalDigits.length === 8 ? `${postalDigits.slice(0, 5)}-${postalDigits.slice(5)}` : undefined,
    address_1: text(input.address_1) || undefined,
  }
  if (countryCode !== "br" || !address.city || !address.address_1 || !address.postal_code) return undefined
  return address
}

const addressFromBody = (body: EstimateBody, baseAddress?: Record<string, unknown> | null): CommercialShippingAddress | undefined => {
  const supplied = body.address && typeof body.address === "object"
    ? body.address as Record<string, unknown>
    : body as Record<string, unknown>
  return normalizeAddress({ ...(baseAddress ?? {}), ...supplied })
}

const unauthorizedCart = (req: MedusaRequest, cart: EstimateCart): boolean => {
  const actorId = (req as MedusaRequest & { auth_context?: { actor_id?: string } }).auth_context?.actor_id
  if (cart.customer_id && actorId !== cart.customer_id) return true
  return !cart.customer_id && Boolean(actorId)
}

const unavailable = (res: MedusaResponse, reason: string, status = 200) => res.status(status).json({
  status: "unavailable",
  reason,
  options: [],
  currency_code: "brl",
})

/**
 * Returns only server-derived delivery options. Client-provided prices,
 * distance, subtotal and eligibility are intentionally ignored.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body && typeof req.body === "object" ? req.body : {}) as EstimateBody
  const cartId = text(body.cart_id)
  let cart: EstimateCart | undefined

  if (cartId) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const result = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "completed_at",
        "customer_id",
        "shipping_address.*",
        "items.id",
        "items.quantity",
        "items.unit_price",
        "items.metadata",
        "items.variant.metadata",
        "items.variant.product.metadata",
        "items.variant.inventory_quantity",
        "items.variant.manage_inventory",
        "items.variant.allow_backorder",
      ],
      filters: { id: cartId },
    })
    cart = result.data[0] as EstimateCart | undefined
    if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
    if (cart.completed_at) return unavailable(res, "CART_COMPLETED", 409)
    if (unauthorizedCart(req, cart)) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Cart does not belong to the current session")
  }

  const address = addressFromBody(body, cart?.shipping_address)
  if (!address) return unavailable(res, "ADDRESS_NOT_RESOLVABLE", 422)

  const context = await createCommercialShippingContext({
    address,
    lines: cart?.items ?? [],
    distanceProvider: createShippingDistanceProviderFromEnv(),
  })
  const options = COMMERCIAL_SHIPPING_RATES
    .filter((rate) => context[rate.key] === "true")
    .map((rate) => ({
      id: rate.key,
      name: rate.type === "express" ? "Entrega expressa" : "Entrega padrão grátis",
      amount: rate.amount,
      currency_code: "brl",
      delivery_estimate: rate.estimated_delivery,
    }))

  if (options.length === 0) {
    return unavailable(
      res,
      context.commercial_shipping_distance_status === "unavailable"
        ? "DELIVERY_PROVIDER_UNAVAILABLE"
        : "DELIVERY_UNAVAILABLE",
    )
  }

  return res.status(200).json({
    status: "ready",
    options,
    currency_code: "brl",
    address: {
      city: address.city,
      province: address.province ?? null,
      postal_code: address.postal_code,
      country_code: address.country_code,
    },
  })
}
