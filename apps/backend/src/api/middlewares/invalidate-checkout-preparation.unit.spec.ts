import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  invalidateCartCheckoutPreparation,
  requireCheckoutPreparation,
} from "./invalidate-checkout-preparation"
import {
  checkoutSnapshotFromCart,
  checkoutReadinessToken,
  stableCheckoutHash,
} from "../../utils/checkout-preparation"

const response = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => {
      result.statusCode = code
      return result
    }),
    json: jest.fn((body: unknown) => {
      result.body = body
      return result
    }),
  }
  return result
}

describe("checkout preparation middleware", () => {
  it("rejects completion without an unexpired server marker", async () => {
    const query = { graph: jest.fn().mockResolvedValue({ data: [{ id: "cart_1", customer_id: "customer_1", metadata: {} }] }) }
    const scope = { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : undefined }
    const res = response()
    const next = jest.fn()

    await requireCheckoutPreparation({ params: { id: "cart_1" }, auth_context: { actor_id: "customer_1" }, scope } as never, res as never, next)

    expect(res.statusCode).toBe(409)
    expect(next).not.toHaveBeenCalled()
  })

  it("allows completion with a valid marker and clears it before cart mutation", async () => {
    const cart = {
      id: "cart_1",
      customer_id: "customer_1",
      email: "guest@example.com",
      currency_code: "brl",
      shipping_address: {
        first_name: "Guest",
        last_name: "Buyer",
        address_1: "Rua A, 10",
        city: "Sao Paulo",
        postal_code: "01310-100",
        country_code: "br",
        province: "SP",
      },
      items: [{ id: "li_1", quantity: 1, unit_price: 100, variant: { id: "variant_1", manage_inventory: false } }],
      shipping_methods: [{ shipping_option_id: "so_1", amount: 0 }],
      item_subtotal: 100,
      tax_total: 0,
      discount_total: 0,
      total: 100,
    }
    const snapshot = checkoutSnapshotFromCart(cart)!
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    const marker = {
      state: "READY_FOR_PAYMENT",
      snapshot_hash: stableCheckoutHash(snapshot),
      token_hash: checkoutReadinessToken("cart_1", stableCheckoutHash(snapshot), expiresAt),
      expires_at: expiresAt,
    }
    const query = { graph: jest.fn().mockResolvedValue({ data: [{ ...cart, metadata: { frigga_checkout_preparation: marker } }] }) }
    const updateCarts = jest.fn().mockResolvedValue(undefined)
    const listReservationItems = jest.fn().mockResolvedValue([])
    const scope = { resolve: (key: unknown) => {
      if (key === ContainerRegistrationKeys.QUERY) return query
      if (key === Modules.CART) return { updateCarts }
      if (key === Modules.INVENTORY) return { listReservationItems }
      return undefined
    } }
    const res = response()
    const next = jest.fn()

    await requireCheckoutPreparation({ params: { id: "cart_1" }, auth_context: { actor_id: "customer_1" }, scope } as never, res as never, next)
    await invalidateCartCheckoutPreparation({ params: { id: "cart_1" }, scope } as never, res as never, next)

    expect(next).toHaveBeenCalledTimes(2)
    expect(updateCarts).toHaveBeenCalledWith("cart_1", { metadata: {} })
  })
})
