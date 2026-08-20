import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { checkoutReadinessToken, stableCheckoutHash, checkoutSnapshotFromCart } from "../../../../../utils/checkout-preparation"
import { POST } from "./route"

const response = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

const makeCart = () => ({
  id: "cart_legacy_1",
  customer_id: "customer_owner",
  email: "guest@example.com",
  currency_code: "brl",
  shipping_address: {
    first_name: "Guest", last_name: "Buyer", address_1: "Rua A, 10",
    city: "Sao Paulo", postal_code: "01310-100", country_code: "br", province: "br-sp",
  },
  items: [{ id: "li_1", quantity: 1, unit_price: 100, variant: { id: "variant_1" } }],
  shipping_methods: [{ shipping_option_id: "so_1", amount: 0 }],
  item_subtotal: 100,
  tax_total: 0,
  discount_total: 0,
  total: 100,
})

describe("legacy checkout-ready boundary", () => {
  it("does not reserve inventory and requires a signed prepare marker", async () => {
    const cart = makeCart()
    const query = { graph: jest.fn().mockResolvedValue({ data: [{ ...cart, metadata: {} }] }) }
    const res = response()
    await POST({ params: { id: cart.id }, auth_context: { actor_id: cart.customer_id }, scope: { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : undefined } } as never, res as never)
    expect(res.statusCode).toBe(409)
    expect(res.body).toMatchObject({ code: "checkout_preparation_required" })
  })

  it("acknowledges an existing signed marker without creating a reservation", async () => {
    const cart = makeCart()
    const snapshotHash = stableCheckoutHash(checkoutSnapshotFromCart(cart)!)
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    const marker = {
      state: "READY_FOR_PAYMENT",
      snapshot_hash: snapshotHash,
      token_hash: checkoutReadinessToken(cart.id, snapshotHash, expiresAt),
      expires_at: expiresAt,
    }
    const query = { graph: jest.fn().mockResolvedValue({ data: [{ ...cart, metadata: { frigga_checkout_preparation: marker } }] }) }
    const res = response()
    await POST({ params: { id: cart.id }, auth_context: { actor_id: cart.customer_id }, scope: { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : undefined } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ checkout_ready: true, reservation_count: 0, deprecated: true })
  })

  it("denies guests and hides carts owned by other customers", async () => {
    const cart = makeCart()
    const query = { graph: jest.fn().mockResolvedValue({ data: [{ ...cart, completed_at: new Date().toISOString(), metadata: {} }] }) }
    const scope = { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : undefined }

    await expect(POST({ params: { id: cart.id }, scope } as never, response() as never))
      .rejects.toMatchObject({ type: "unauthorized" })
    expect(query.graph).not.toHaveBeenCalled()
    await expect(POST({ params: { id: cart.id }, auth_context: { actor_id: "customer_other" }, scope } as never, response() as never))
      .rejects.toMatchObject({ type: "not_found", message: "Cart not found" })
    expect(query.graph).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: { id: cart.id, customer_id: "customer_other" },
    }))
  })

  it("requires a current BR/SP address even with a signed marker", async () => {
    const cart = { ...makeCart(), shipping_address: { ...makeCart().shipping_address, country_code: "us", province: "rj" } }
    const snapshotHash = stableCheckoutHash(checkoutSnapshotFromCart(makeCart())!)
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    const marker = {
      state: "READY_FOR_PAYMENT",
      snapshot_hash: snapshotHash,
      token_hash: checkoutReadinessToken(cart.id, snapshotHash, expiresAt),
      expires_at: expiresAt,
    }
    const query = { graph: jest.fn().mockResolvedValue({ data: [{ ...cart, metadata: { frigga_checkout_preparation: marker } }] }) }
    const res = response()
    await POST({ params: { id: cart.id }, auth_context: { actor_id: cart.customer_id }, scope: { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : undefined } } as never, res as never)
    expect(res.statusCode).toBe(409)
    expect(res.body).toMatchObject({ code: "checkout_preparation_required" })
  })
})
