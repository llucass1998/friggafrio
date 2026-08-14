import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  listShippingOptionsForCartWithPricingWorkflow,
  refreshCartItemsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  areCartInventoryReservationsValid,
  reserveCartInventory,
  type CartInventoryLine,
  type ExistingCartInventoryReservation,
} from "../../../../../utils/cart-inventory-reservation"
import {
  validateCartCommercialEligibility,
  type CommercialLine,
} from "../../../../../utils/cart-commercial-eligibility"
import {
  CHECKOUT_PREPARATION_METADATA_KEY,
  CHECKOUT_PREPARATION_TTL_MS,
  checkoutPreparationExpiresAt,
  checkoutReadinessToken,
  isCheckoutPreparationMarker,
  normalizeBrazilAddress,
  stableCheckoutHash,
  checkoutSnapshotFromCart,
  validateCheckoutContact,
  type CheckoutAddress,
  type CheckoutPreparationMarker,
  type CheckoutValidationError,
} from "../../../../../utils/checkout-preparation"

type CheckoutItem = CartInventoryLine & CommercialLine & {
  title?: string | null
  variant?: CartInventoryLine["variant"] & {
    id?: string | null
    product?: { id?: string | null; metadata?: Record<string, unknown> | null } | null
  }
}

type PreparationCart = {
  id: string
  completed_at?: string | Date | null
  customer_id?: string | null
  email?: string | null
  currency_code?: string | null
  sales_channel_id?: string | null
  metadata?: Record<string, unknown> | null
  shipping_address?: Record<string, unknown> | null
  billing_address?: Record<string, unknown> | null
  item_subtotal?: number | null
  subtotal?: number | null
  shipping_total?: number | null
  discount_total?: number | null
  tax_total?: number | null
  total?: number | null
  items?: CheckoutItem[]
  shipping_methods?: Array<{
    id?: string
    name?: string | null
    amount?: number | null
    shipping_option_id?: string | null
  }>
}

type ShippingOption = {
  id?: string
  name?: string | null
  amount?: number | null
  currency_code?: string | null
  data?: Record<string, unknown> | null
}

type PreparationBody = {
  shipping_option_id?: unknown
  shipping_amount?: unknown
  total?: unknown
}

const CART_FIELDS = [
  "id",
  "completed_at",
  "customer_id",
  "email",
  "currency_code",
  "sales_channel_id",
  "metadata",
  "shipping_address.*",
  "billing_address.*",
  "item_subtotal",
  "subtotal",
  "shipping_total",
  "discount_total",
  "tax_total",
  "total",
  "items.id",
  "items.title",
  "items.quantity",
  "items.unit_price",
  "items.metadata",
  "items.variant.id",
  "items.variant.manage_inventory",
  "items.variant.allow_backorder",
  "items.variant.inventory_items.inventory_item_id",
  "items.variant.inventory_items.required_quantity",
  "items.variant.inventory_items.inventory.location_levels.location_id",
  "items.variant.inventory_items.inventory.location_levels.stocked_quantity",
  "items.variant.inventory_items.inventory.location_levels.reserved_quantity",
  "items.variant.inventory_items.inventory.location_levels.stock_locations.id",
  "items.variant.inventory_items.inventory.location_levels.stock_locations.sales_channels.id",
  "items.variant.product.id",
  "items.variant.product.metadata",
  "items.variant.metadata",
  "shipping_methods.id",
  "shipping_methods.name",
  "shipping_methods.amount",
  "shipping_methods.shipping_option_id",
]

const asFiniteNumber = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

const safeError = (code: string, message: string, field?: string): CheckoutValidationError => ({ code, message, field })

const blockedResponse = (
  res: MedusaResponse,
  cartId: string,
  errors: CheckoutValidationError[],
) => res.status(400).json({
  cart_id: cartId,
  checkout_state: "BLOCKED",
  validation: { valid: false, errors },
})

const toAddressSummary = (address?: CheckoutAddress) => address ? {
  first_name: address.first_name,
  last_name: address.last_name,
  city: address.city,
  province: address.province,
  postal_code: address.postal_code,
  country_code: address.country_code,
} : null

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = String(req.params.id || "")
  if (!cartId) return blockedResponse(res, cartId, [safeError("INVALID_CART", "Cart id is required.")])

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const initialResult = await query.graph({ entity: "cart", fields: ["id", "completed_at", "customer_id"], filters: { id: cartId } })
  const initialCart = initialResult.data[0] as Pick<PreparationCart, "id" | "completed_at" | "customer_id"> | undefined
  if (!initialCart) return blockedResponse(res, cartId, [safeError("CART_NOT_FOUND", "Cart not found.")])
  if (initialCart.completed_at) return blockedResponse(res, cartId, [safeError("CART_COMPLETED", "Completed carts cannot be prepared again.")])

  const actorId = (req as MedusaRequest & { auth_context?: { actor_id?: string } }).auth_context?.actor_id
  if (initialCart.customer_id && actorId !== initialCart.customer_id) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Cart does not belong to the authenticated customer")
  }
  // A logged-in actor cannot turn an unassigned guest cart into an arbitrary
  // bearer reservation. Guest checkout remains available without auth.
  if (!initialCart.customer_id && actorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Guest cart requires its original browser session")
  }

  // Medusa's refresh workflow is the authoritative pricing/tax/promotion
  // recalculation boundary. Never trust the unit_price projection from an
  // earlier cart read when deciding payment readiness.
  if (typeof refreshCartItemsWorkflow === "function") {
    await refreshCartItemsWorkflow(req.scope).run({
      input: { cart_id: cartId, force_refresh: true, force_tax_calculation: true },
    })
  }

  const cartResult = await query.graph({ entity: "cart", fields: CART_FIELDS, filters: { id: cartId } })
  const cart = cartResult.data[0] as PreparationCart | undefined
  if (!cart) return blockedResponse(res, cartId, [safeError("CART_NOT_FOUND", "Cart not found.")])
  if (cart.completed_at) return blockedResponse(res, cartId, [safeError("CART_COMPLETED", "Completed carts cannot be prepared again.")])

  const errors: CheckoutValidationError[] = [
    ...validateCheckoutContact(cart),
  ]
  const addressResult = normalizeBrazilAddress(cart.shipping_address)
  errors.push(...addressResult.errors)
  if (cart.currency_code?.toLowerCase() !== "brl") {
    errors.push(safeError("INVALID_CURRENCY", "Checkout must use BRL currency.", "currency_code"))
  }

  const items = cart.items ?? []
  const linesForCommercial = items as unknown as CommercialLine[]
  const linesForInventory = items as unknown as CartInventoryLine[]
  // Inventory quantities are authoritative in the reservation workflow below;
  // do not reject a valid location-backed line because the cart projection
  // omitted its convenience inventory_quantity field.
  const commercial = validateCartCommercialEligibility(linesForCommercial, { deferInventoryValidation: true })
  if (!commercial.checkoutReady) {
    errors.push(...commercial.blockingLines.map((line) => safeError(
      line.reason,
      "Cart contains an item that cannot proceed to checkout.",
      line.lineId,
    )))
  }
  for (const item of items) {
    if (!item.variant?.id || !item.variant.product?.id) {
      errors.push(safeError("MISSING_PRODUCT_VARIANT", "Cart item is missing a valid product variant.", item.id))
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      errors.push(safeError("INVALID_QUANTITY", "Cart item quantity is invalid.", item.id))
    }
    if (asFiniteNumber(item.unit_price) === null || (item.unit_price ?? 0) <= 0) {
      errors.push(safeError("PRICE_PENDING", "Cart item price is not currently purchasable.", item.id))
    }
  }

  const shippingMethod = cart.shipping_methods?.[0]
  const body = (req.body && typeof req.body === "object" ? req.body : {}) as PreparationBody
  if (!shippingMethod?.shipping_option_id) {
    errors.push(safeError("SHIPPING_METHOD_REQUIRED", "Select a valid shipping method before preparing checkout.", "shipping_methods"))
  }

  let selectedShipping: ShippingOption | undefined
  if (shippingMethod?.shipping_option_id && addressResult.address) {
    try {
      const shippingResult = await listShippingOptionsForCartWithPricingWorkflow(req.scope).run({
        input: { cart_id: cartId },
      })
      const availableShipping = (shippingResult.result as ShippingOption[]) ?? []
      selectedShipping = availableShipping.find((option) => option.id === shippingMethod.shipping_option_id)
      if (!selectedShipping) {
        errors.push(safeError("STALE_SHIPPING_OPTION", "The selected shipping option is no longer valid."))
      } else {
        const expectedAmount = asFiniteNumber(selectedShipping.amount)
        const persistedAmount = asFiniteNumber(shippingMethod.amount)
        if (expectedAmount === null || expectedAmount < 0) {
          errors.push(safeError("INVALID_SHIPPING_AMOUNT", "Shipping price is invalid."))
        }
        if (selectedShipping.currency_code && selectedShipping.currency_code.toLowerCase() !== "brl") {
          errors.push(safeError("INVALID_SHIPPING_CURRENCY", "Shipping currency must be BRL."))
        }
        if (expectedAmount === null || persistedAmount === null || persistedAmount < 0 || Math.abs(expectedAmount - persistedAmount) > 0.0001) {
          errors.push(safeError("STALE_SHIPPING_AMOUNT", "Shipping price changed; refresh the shipping method."))
        }
        if (body.shipping_option_id && body.shipping_option_id !== selectedShipping.id) {
          errors.push(safeError("SHIPPING_OPTION_TAMPERED", "Submitted shipping option does not match the cart."))
        }
        if (body.shipping_amount !== undefined && asFiniteNumber(body.shipping_amount) !== expectedAmount) {
          errors.push(safeError("SHIPPING_AMOUNT_TAMPERED", "Submitted shipping amount is not authoritative."))
        }
      }
    } catch {
      errors.push(safeError("SHIPPING_UNAVAILABLE", "Shipping options could not be revalidated."))
    }
  }

  const subtotal = items.reduce((sum, item) => sum + ((item.quantity ?? 0) * (item.unit_price ?? 0)), 0)
  const shipping = asFiniteNumber(selectedShipping?.amount)
  const tax = asFiniteNumber(cart.tax_total) ?? 0
  const discount = asFiniteNumber(cart.discount_total) ?? 0
  if (tax < 0) errors.push(safeError("INVALID_TAX", "Cart tax is invalid."))
  if (discount < 0) errors.push(safeError("INVALID_DISCOUNT", "Cart discount is invalid."))
  const total = shipping === null ? null : subtotal + shipping + tax - discount
  const persistedSubtotal = asFiniteNumber(cart.item_subtotal)
  const persistedShipping = asFiniteNumber(cart.shipping_total)
  const persistedTotal = asFiniteNumber(cart.total)
  if (persistedSubtotal !== null && persistedSubtotal < 0) errors.push(safeError("INVALID_SUBTOTAL", "Cart subtotal is invalid."))
  if (persistedShipping !== null && persistedShipping < 0) errors.push(safeError("INVALID_SHIPPING_TOTAL", "Cart shipping total is invalid."))
  if (persistedTotal !== null && persistedTotal < 0) errors.push(safeError("INVALID_TOTAL", "Cart total is invalid."))
  if (total !== null && total < 0) errors.push(safeError("INVALID_TOTAL", "Cart total is invalid."))
  if (persistedSubtotal === null || Math.abs(persistedSubtotal - subtotal) > 0.0001) {
    errors.push(safeError("STALE_SUBTOTAL", "Cart subtotal changed; refresh the cart."))
  }
  if (shipping !== null && (persistedShipping === null || Math.abs(persistedShipping - shipping) > 0.0001)) {
    errors.push(safeError("STALE_SHIPPING_TOTAL", "Cart shipping total changed; refresh the cart."))
  }
  if (total !== null && (persistedTotal === null || Math.abs(persistedTotal - total) > 0.0001)) {
    errors.push(safeError("STALE_CART_TOTAL", "Cart total changed; refresh the cart."))
  }
  if (body.total !== undefined && (total === null || asFiniteNumber(body.total) !== total)) {
    errors.push(safeError("TOTAL_TAMPERED", "Submitted total is not authoritative."))
  }

  if (errors.length || !addressResult.address || !selectedShipping || shipping === null || total === null) {
    return blockedResponse(res, cartId, errors.length ? errors : [safeError("CHECKOUT_NOT_READY", "Cart is not ready for payment.")])
  }

  const snapshot = checkoutSnapshotFromCart({
    ...cart,
    shipping_methods: [{ shipping_option_id: selectedShipping.id, amount: shipping }],
    item_subtotal: subtotal,
    total,
  })
  if (!snapshot) return blockedResponse(res, cartId, [safeError("CHECKOUT_NOT_READY", "Cart is not ready for payment.")])
  const snapshotHash = stableCheckoutHash(snapshot)
  const storedMarker = cart.metadata?.[CHECKOUT_PREPARATION_METADATA_KEY]
  const storedExpiry = isCheckoutPreparationMarker(storedMarker) ? Date.parse(storedMarker.expires_at) : Number.NaN
  const candidateExpiry = isCheckoutPreparationMarker(storedMarker)
    && Number.isFinite(storedExpiry)
    && storedExpiry > Date.now()
    && storedExpiry <= Date.now() + CHECKOUT_PREPARATION_TTL_MS
    ? storedMarker.expires_at
    : checkoutPreparationExpiresAt()
  const expectedToken = checkoutReadinessToken(cartId, snapshotHash, candidateExpiry)
  // This value deliberately describes the marker loaded before this request's
  // reservation work, rather than the marker written below.
  const markerWasReady = isCheckoutPreparationMarker(storedMarker)
    && storedMarker.snapshot_hash === snapshotHash
    && storedMarker.token_hash === expectedToken
    && Number.isFinite(Date.parse(storedMarker.expires_at))
    && Date.parse(storedMarker.expires_at) > Date.now()

  let reservations: unknown[] = []
  let reusedReservations = false
  if (markerWasReady) {
    const lineItemIds = linesForInventory.map((line) => line.id)
    let existingReservations: ExistingCartInventoryReservation[] = []
    try {
      if (lineItemIds.length) {
        const inventoryModule = req.scope.resolve(Modules.INVENTORY) as import("@medusajs/types").IInventoryService
        existingReservations = await inventoryModule.listReservationItems(
          { line_item_id: lineItemIds },
          // Avoid the inventory module's default page size for multi-line carts.
          { take: Math.max(100, lineItemIds.length * 10) },
        )
      }
    } catch {
      // A missing/unreadable reservation must be reconciled authoritatively.
      existingReservations = []
    }
    if (areCartInventoryReservationsValid(linesForInventory, existingReservations, cart.sales_channel_id)) {
      reservations = existingReservations
      reusedReservations = true
    }
  }

  if (!reusedReservations) {
    try {
      reservations = await reserveCartInventory(req.scope, linesForInventory, cart.sales_channel_id)
    } catch (error) {
      if (error instanceof MedusaError && error.code === MedusaError.Codes.INSUFFICIENT_INVENTORY) {
        return blockedResponse(res, cartId, [safeError("INSUFFICIENT_INVENTORY", "Cart inventory is no longer available.")])
      }
      return blockedResponse(res, cartId, [safeError("INVENTORY_UNAVAILABLE", "Cart inventory could not be reserved.")])
    }
  }

  const token = expectedToken
  const expiresAt = reusedReservations && isCheckoutPreparationMarker(storedMarker)
    ? storedMarker.expires_at
    : candidateExpiry
  const marker: CheckoutPreparationMarker = {
    state: "READY_FOR_PAYMENT",
    snapshot_hash: snapshotHash,
    token_hash: token,
    expires_at: expiresAt,
  }
  if (!reusedReservations) {
    const cartModule = req.scope.resolve(Modules.CART) as import("@medusajs/types").ICartModuleService
    const metadata = { ...(cart.metadata ?? {}), [CHECKOUT_PREPARATION_METADATA_KEY]: marker }
    await cartModule.updateCarts(cartId, { metadata })
  }

  /*
   * Reservation work above is the only inventory side effect. A current marker
   * with matching persisted reservations reuses both the marker and rows.
   */

  return res.status(200).json({
    cart_id: cartId,
    checkout_state: "READY_FOR_PAYMENT",
    customer: { customer_id: cart.customer_id ?? null, email: String(cart.email).trim().toLowerCase() },
    address: toAddressSummary(addressResult.address),
    selected_shipping: {
      id: selectedShipping.id,
      name: selectedShipping.name ?? shippingMethod?.name ?? "Shipping",
      amount: shipping,
      currency_code: "brl",
    },
    items: items.map((item) => ({
      id: item.id,
      title: item.title ?? null,
      variant_id: item.variant?.id ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: (item.quantity ?? 0) * (item.unit_price ?? 0),
    })),
    subtotal,
    shipping,
    total,
    currency: "brl",
    validation: { valid: true, errors: [] },
    readiness: {
      token,
      expires_at: expiresAt,
      idempotent: markerWasReady,
      reservation_count: reservations.length,
    },
  })
}
