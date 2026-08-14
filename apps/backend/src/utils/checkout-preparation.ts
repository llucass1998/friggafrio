import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"

export const CHECKOUT_PREPARATION_METADATA_KEY = "frigga_checkout_preparation"
export const CHECKOUT_PREPARATION_TTL_MS = 15 * 60 * 1000

const checkoutPreparationSecret = (): string => {
  const configured = process.env.CHECKOUT_PREPARATION_SECRET
    || process.env.COOKIE_SECRET
    || process.env.JWT_SECRET
  // Unit tests do not load .env.test. Production must configure one of the
  // shared Medusa secrets so all backend processes can verify markers.
  if (!configured && process.env.JEST_WORKER_ID) return "test-only-checkout-preparation-secret"
  if (!configured) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Checkout preparation secret is not configured")
  return configured
}

export type CheckoutPreparationMarker = {
  state: "READY_FOR_PAYMENT"
  snapshot_hash: string
  token_hash: string
  expires_at: string
}

export type CheckoutAddress = {
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  postal_code: string
  province?: string
  country_code: "br"
  phone?: string
}

export type CheckoutValidationError = {
  code: string
  message: string
  field?: string
}

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : ""

export const normalizeBrazilAddress = (
  value: unknown,
): { address?: CheckoutAddress; errors: CheckoutValidationError[] } => {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const country = text(input.country_code).toLowerCase()
  const errors: CheckoutValidationError[] = []

  if (country !== "br") {
    errors.push({ code: "INVALID_COUNTRY", field: "shipping_address.country_code", message: "Delivery address must be in Brazil." })
  }

  const firstName = text(input.first_name)
  const lastName = text(input.last_name)
  const address1 = text(input.address_1)
  const city = text(input.city)
  const postalDigits = text(input.postal_code).replace(/\D/g, "")
  for (const [field, fieldValue] of [
    ["shipping_address.first_name", firstName],
    ["shipping_address.last_name", lastName],
    ["shipping_address.address_1", address1],
    ["shipping_address.city", city],
  ] as const) {
    if (!fieldValue) errors.push({ code: "MISSING_ADDRESS_FIELD", field, message: "Delivery address is incomplete." })
  }
  if (postalDigits.length !== 8) {
    errors.push({ code: "INVALID_POSTAL_CODE", field: "shipping_address.postal_code", message: "Delivery postal code is invalid." })
  }

  if (errors.length) return { errors }
  return {
    errors,
    address: {
      first_name: firstName,
      last_name: lastName,
      company: text(input.company) || undefined,
      address_1: address1,
      address_2: text(input.address_2) || undefined,
      city,
      postal_code: `${postalDigits.slice(0, 5)}-${postalDigits.slice(5)}`,
      province: text(input.province) || undefined,
      country_code: "br",
      phone: text(input.phone) || undefined,
    },
  }
}

export const validateCheckoutContact = (cart: {
  email?: unknown
  shipping_address?: unknown
}): CheckoutValidationError[] => {
  const errors: CheckoutValidationError[] = []
  const email = text(cart.email).toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ code: "INVALID_EMAIL", field: "email", message: "A valid checkout email is required." })
  }
  const address = cart.shipping_address && typeof cart.shipping_address === "object"
    ? cart.shipping_address as Record<string, unknown>
    : {}
  if (!text(address.first_name) || !text(address.last_name)) {
    errors.push({ code: "MISSING_CONTACT_NAME", field: "shipping_address", message: "A contact name is required for checkout." })
  }
  return errors
}

export const stableCheckoutHash = (value: unknown): string => {
  const serialized = JSON.stringify(value, (_key, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item
    return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
  })
  return createHash("sha256").update(serialized).digest("hex")
}

export const checkoutReadinessToken = (
  cartId: string,
  snapshotHash: string,
  expiresAt = "",
): string => createHmac("sha256", checkoutPreparationSecret())
  .update(`frigga:ready-for-payment:v2:${cartId}:${snapshotHash}:${expiresAt}`)
  .digest("hex")

export const checkoutPreparationExpiresAt = (now = Date.now()): string =>
  new Date(now + CHECKOUT_PREPARATION_TTL_MS).toISOString()

export const isCheckoutPreparationMarker = (value: unknown): value is CheckoutPreparationMarker => {
  if (!value || typeof value !== "object") return false
  const marker = value as Record<string, unknown>
  return marker.state === "READY_FOR_PAYMENT"
    && typeof marker.snapshot_hash === "string"
    && typeof marker.token_hash === "string"
    && typeof marker.expires_at === "string"
}

/** Validates the signature and finite, bounded lifetime of a persisted marker. */
export const isAuthenticCheckoutPreparationMarker = (
  cartId: string,
  value: unknown,
  now = Date.now(),
): value is CheckoutPreparationMarker => {
  if (!isCheckoutPreparationMarker(value)) return false
  const expiresAt = Date.parse(value.expires_at)
  if (!Number.isFinite(expiresAt) || expiresAt <= now || expiresAt > now + CHECKOUT_PREPARATION_TTL_MS) return false
  const expected = checkoutReadinessToken(cartId, value.snapshot_hash, value.expires_at)
  const supplied = value.token_hash
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false
  return timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(expected, "hex"))
}

/**
 * Produces the cart state digest used by both prepare and complete guards.
 * Keep this limited to commercial fields so a metadata-only mutation cannot
 * accidentally make a marker stale while relevant cart changes are covered.
 */
export const checkoutSnapshotFromCart = (cart: {
  id: string
  sales_channel_id?: unknown
  email?: unknown
  currency_code?: unknown
  shipping_address?: unknown
  items?: Array<{
    id: string
    quantity: number
    unit_price?: unknown
    metadata?: unknown
    variant?: {
      id?: string | null
      manage_inventory?: unknown
      allow_backorder?: unknown
      metadata?: unknown
      product?: { metadata?: unknown } | null
      inventory_items?: Array<{
        inventory_item_id?: unknown
        required_quantity?: unknown
        inventory?: { location_levels?: Array<{ location_id?: unknown }> | null } | null
      }> | null
    } | null
  }>
  shipping_methods?: Array<{ shipping_option_id?: string | null; amount?: unknown }>
  item_subtotal?: unknown
  tax_total?: unknown
  discount_total?: unknown
  total?: unknown
}) => {
  const addressResult = normalizeBrazilAddress(cart.shipping_address)
  if (!addressResult.address) return null
  const method = cart.shipping_methods?.[0]
  const amount = typeof method?.amount === "number" ? method.amount : Number(method?.amount)
  const subtotal = typeof cart.item_subtotal === "number" ? cart.item_subtotal : Number(cart.item_subtotal)
  const tax = typeof cart.tax_total === "number" ? cart.tax_total : Number(cart.tax_total ?? 0)
  const discount = typeof cart.discount_total === "number" ? cart.discount_total : Number(cart.discount_total ?? 0)
  const total = typeof cart.total === "number" ? cart.total : Number(cart.total)
  if (!method?.shipping_option_id || !Number.isFinite(amount) || !Number.isFinite(subtotal) || !Number.isFinite(tax) || !Number.isFinite(discount) || !Number.isFinite(total)) return null
  return {
    cart_id: cart.id,
    sales_channel_id: String(cart.sales_channel_id ?? ""),
    currency_code: String(cart.currency_code ?? "").toLowerCase(),
    email: String(cart.email ?? "").trim().toLowerCase(),
    address: addressResult.address,
    items: (cart.items ?? []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      metadata: item.metadata ?? null,
      variant_id: item.variant?.id,
      variant_manage_inventory: item.variant?.manage_inventory ?? null,
      variant_allow_backorder: item.variant?.allow_backorder ?? null,
      variant_metadata: item.variant?.metadata ?? null,
      product_metadata: item.variant?.product?.metadata ?? null,
      inventory: (item.variant?.inventory_items ?? []).map((inventoryItem) => ({
        inventory_item_id: inventoryItem.inventory_item_id ?? null,
        required_quantity: inventoryItem.required_quantity ?? null,
        location_ids: (inventoryItem.inventory?.location_levels ?? [])
          .map((level) => level.location_id ?? null)
          .filter(Boolean),
      })),
    })),
    shipping_option_id: method.shipping_option_id,
    shipping_amount: amount,
    subtotal,
    tax,
    discount,
    total,
  }
}

/** Clear the server-owned readiness marker before a cart mutation is applied. */
export const invalidateCheckoutPreparation = async (
  container: MedusaContainer,
  cartId: string,
): Promise<void> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const result = await query.graph({
    entity: "cart",
    fields: ["id", "metadata"],
    filters: { id: cartId },
  })
  const cart = result.data[0] as { metadata?: Record<string, unknown> | null } | undefined
  if (!cart) return
  const metadata = { ...(cart.metadata ?? {}) }
  delete metadata[CHECKOUT_PREPARATION_METADATA_KEY]
  const cartModule = container.resolve(Modules.CART) as import("@medusajs/types").ICartModuleService
  await cartModule.updateCarts(cartId, { metadata })
}
