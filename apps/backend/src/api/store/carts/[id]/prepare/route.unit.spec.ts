import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  listShippingOptionsForCartWithPricingWorkflow,
  refreshCartItemsWorkflow,
} from "@medusajs/medusa/core-flows"
import { reserveCartInventory } from "../../../../../utils/cart-inventory-reservation"
import { POST } from "./route"

jest.mock("@medusajs/medusa/core-flows", () => ({
  listShippingOptionsForCartWithPricingWorkflow: jest.fn(),
  refreshCartItemsWorkflow: jest.fn(),
}))

jest.mock("../../../../../utils/cart-inventory-reservation", () => {
  const actual = jest.requireActual("../../../../../utils/cart-inventory-reservation")
  return { ...actual, reserveCartInventory: jest.fn() }
})

const workflow = listShippingOptionsForCartWithPricingWorkflow as unknown as jest.Mock
const refresh = refreshCartItemsWorkflow as unknown as jest.Mock
const reserve = reserveCartInventory as unknown as jest.Mock

const makeResponse = () => {
  const response: {
    statusCode?: number
    body?: Record<string, unknown>
    status: jest.Mock
    json: jest.Mock
  } = {
    status: jest.fn((code: number) => {
      response.statusCode = code
      return response
    }),
    json: jest.fn((body: Record<string, unknown>) => {
      response.body = body
      return response
    }),
  }
  return response
}

const makeCart = (overrides: Record<string, unknown> = {}) => ({
  id: "cart_prepare_1",
  completed_at: null,
  customer_id: "customer_owner",
  email: "guest@example.com",
  currency_code: "brl",
  sales_channel_id: "sc_br",
  metadata: {},
  shipping_address: {
    first_name: "Guest",
    last_name: "Buyer",
    address_1: "Rua A, 10",
    city: "Sao Paulo",
    postal_code: "01310-100",
    province: "br-sp",
    country_code: "br",
  },
  billing_address: {
    first_name: "Guest",
    last_name: "Buyer",
    address_1: "Rua A, 10",
    city: "Sao Paulo",
    postal_code: "01310-100",
    province: "br-sp",
    country_code: "br",
  },
  item_subtotal: 100,
  subtotal: 100,
  shipping_total: 0,
  discount_total: 0,
  tax_total: 0,
  total: 100,
  items: [{
    id: "li_1",
    title: "Controlled item",
    quantity: 1,
    unit_price: 100,
    metadata: {},
    variant: {
      id: "variant_1",
      manage_inventory: false,
      allow_backorder: false,
      metadata: {},
      product: { id: "product_1", metadata: {} },
    },
  }],
  shipping_methods: [{
    id: "sm_1",
    name: "Free shipping",
    amount: 0,
    shipping_option_id: "so_1",
  }],
  ...overrides,
})

const makeScope = (cart: Record<string, unknown>) => {
  let currentCart = cart
  const graph = jest.fn().mockImplementation(async () => ({ data: [currentCart] }))
  const updateCarts = jest.fn().mockImplementation(async (_cartId: string, payload: { metadata?: Record<string, unknown> }) => {
    Object.assign(currentCart, payload)
    return currentCart
  })
  const listReservationItems = jest.fn().mockResolvedValue([])
  return {
    scope: {
      resolve: (key: unknown) => {
        if (key === ContainerRegistrationKeys.QUERY) return { graph }
        if (key === Modules.CART) return { updateCarts }
        if (key === Modules.INVENTORY) return { listReservationItems }
        throw new Error(`unexpected dependency: ${String(key)}`)
      },
    },
    graph,
    updateCarts,
    listReservationItems,
  }
}

const request = (
  scope: ReturnType<typeof makeScope>["scope"],
  body: Record<string, unknown> = {},
  actorId = "customer_owner",
) => ({
  params: { id: "cart_prepare_1" },
  body,
  auth_context: { actor_id: actorId },
  scope,
})

describe("cart prepare boundary", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    workflow.mockReturnValue({ run: jest.fn().mockResolvedValue({
      result: [{ id: "so_1", name: "Free shipping", amount: 0, currency_code: "brl", data: {} }],
    }) })
    refresh.mockReturnValue({ run: jest.fn().mockResolvedValue({ result: undefined }) })
    reserve.mockResolvedValue([{ id: "reservation_1", line_item_id: "li_1", quantity: 1 }])
  })

  it("returns READY_FOR_PAYMENT without completing the cart", async () => {
    const { scope, updateCarts } = makeScope(makeCart())
    const response = makeResponse()

    await POST(request(scope) as never, response as never)

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({ cart_id: "cart_prepare_1", checkout_state: "READY_FOR_PAYMENT", total: 100 })
    expect((response.body?.readiness as { token: string }).token).toHaveLength(64)
    expect(updateCarts).toHaveBeenCalledWith("cart_prepare_1", expect.objectContaining({ metadata: expect.any(Object) }))
  })

  it("fails closed for invalid contact/address and client shipping tamper", async () => {
    const invalidCart = makeCart({
      email: "bad-email",
      shipping_address: { country_code: "us", postal_code: "00000" },
    })
    const { scope } = makeScope(invalidCart)
    const response = makeResponse()

    await POST(request(scope, { shipping_amount: 999 }) as never, response as never)

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({ checkout_state: "BLOCKED", validation: { valid: false } })
    expect((response.body?.validation as { errors: Array<{ code: string }> }).errors.map((error) => error.code))
      .toEqual(expect.arrayContaining(["INVALID_EMAIL", "INVALID_COUNTRY", "INVALID_POSTAL_CODE"]))
    expect(reserve).not.toHaveBeenCalled()
  })

  it("returns a structured 400 for an invalid direct checkout document payload", async () => {
    const { scope } = makeScope(makeCart())
    const response = makeResponse()

    await POST(request(scope, {
      customer: { person_type: "individual", document: "00000000000" },
    }) as never, response as never)

    expect(response.statusCode).toBe(400)
    expect((response.body?.validation as { errors: Array<{ code: string; field: string }> }).errors)
      .toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_CPF", field: "customer.document" })]))
  })

  it("rejects stale shipping amount even when the option id is current", async () => {
    const { scope } = makeScope(makeCart())
    const response = makeResponse()

    await POST(request(scope, { shipping_amount: 10 }) as never, response as never)

    expect(response.statusCode).toBe(400)
    expect((response.body?.validation as { errors: Array<{ code: string }> }).errors.map((error) => error.code))
      .toContain("SHIPPING_AMOUNT_TAMPERED")
    expect(reserve).not.toHaveBeenCalled()
  })

  it("blocks quote-only and price-pending lines in a mixed cart", async () => {
    const cart = makeCart({
      items: [
        ...(makeCart().items as unknown[]),
        {
          id: "li_quote",
          quantity: 1,
          unit_price: 100,
          metadata: { commercial_status: "QUOTE_ONLY" },
          variant: { id: "variant_quote", manage_inventory: false, product: { id: "product_quote", metadata: {} } },
        },
        {
          id: "li_pending",
          quantity: 1,
          unit_price: 0,
          metadata: {},
          variant: { id: "variant_pending", manage_inventory: false, product: { id: "product_pending", metadata: {} } },
        },
      ],
      item_subtotal: 200,
      total: 200,
    })
    const { scope } = makeScope(cart)
    const response = makeResponse()

    await POST(request(scope) as never, response as never)

    expect(response.statusCode).toBe(400)
    expect((response.body?.validation as { errors: Array<{ code: string }> }).errors.map((error) => error.code))
      .toEqual(expect.arrayContaining(["QUOTE_ONLY", "PRICE_PENDING"]))
    expect(reserve).not.toHaveBeenCalled()
  })

  it("reuses the marker and reservations when preparation is repeated", async () => {
    const { scope } = makeScope(makeCart())
    const first = makeResponse()
    const second = makeResponse()

    await POST(request(scope) as never, first as never)
    await POST(request(scope) as never, second as never)

    expect(first.statusCode).toBe(200)
    expect(second.statusCode).toBe(200)
    expect((second.body?.readiness as { token: string }).token)
      .toBe((first.body?.readiness as { token: string }).token)
    expect((first.body?.readiness as { idempotent: boolean }).idempotent).toBe(false)
    expect((second.body?.readiness as { idempotent: boolean }).idempotent).toBe(true)
    expect(reserve).toHaveBeenCalledTimes(1)
  })

  it("reuses valid persisted inventory reservations without mutating them", async () => {
    const cart = makeCart({
      items: [{
        id: "li_1",
        title: "Controlled item",
        quantity: 1,
        unit_price: 100,
        metadata: {},
        variant: {
          id: "variant_1",
          manage_inventory: true,
          allow_backorder: false,
          metadata: {},
          product: { id: "product_1", metadata: {} },
          inventory_items: [{
            inventory_item_id: "inv_1",
            required_quantity: 1,
            inventory: {
              location_levels: [{
                location_id: "loc_1",
                stocked_quantity: 10,
                reserved_quantity: 1,
                stock_locations: [{ id: "loc_1", sales_channels: [{ id: "sc_br" }] }],
              }],
            },
          }],
        },
      }],
    })
    const { scope, listReservationItems, updateCarts } = makeScope(cart)
    const persistedReservation = {
      id: "reservation_server_owned",
      line_item_id: "li_1",
      inventory_item_id: "inv_1",
      location_id: "loc_1",
      quantity: 1,
      allow_backorder: false,
    }
    listReservationItems.mockResolvedValue([persistedReservation])
    reserve.mockResolvedValue([persistedReservation])
    const first = makeResponse()
    const second = makeResponse()

    await POST(request(scope) as never, first as never)
    await POST(request(scope) as never, second as never)

    expect(first.statusCode).toBe(200)
    expect(second.statusCode).toBe(200)
    expect((second.body?.readiness as { token: string }).token)
      .toBe((first.body?.readiness as { token: string }).token)
    expect((second.body?.readiness as { reservation_count: number }).reservation_count).toBe(1)
    expect(reserve).toHaveBeenCalledTimes(1)
    expect(listReservationItems).toHaveBeenCalledTimes(1)
    expect(updateCarts).toHaveBeenCalledTimes(1)
  })

  it("revalidates reservations when the persisted cart snapshot changes", async () => {
    const cart = makeCart()
    const { scope, updateCarts } = makeScope(cart)
    const first = makeResponse()
    const second = makeResponse()

    await POST(request(scope) as never, first as never)

    const item = (cart.items as Array<{ quantity: number }>)[0]
    item.quantity = 2
    cart.item_subtotal = 200
    cart.subtotal = 200
    cart.total = 200

    await POST(request(scope) as never, second as never)

    expect(first.statusCode).toBe(200)
    expect(second.statusCode).toBe(200)
    expect((second.body?.readiness as { token: string }).token)
      .not.toBe((first.body?.readiness as { token: string }).token)
    expect((second.body?.readiness as { idempotent: boolean }).idempotent).toBe(false)
    expect(reserve).toHaveBeenCalledTimes(2)
    expect(updateCarts).toHaveBeenCalledTimes(2)
  })

  it("rejects stale persisted totals after a subtotal mutation", async () => {
    const { scope } = makeScope(makeCart({ item_subtotal: 99, total: 99 }))
    const response = makeResponse()

    await POST(request(scope) as never, response as never)

    expect(response.statusCode).toBe(400)
    expect((response.body?.validation as { errors: Array<{ code: string }> }).errors.map((error) => error.code))
      .toEqual(expect.arrayContaining(["STALE_SUBTOTAL", "STALE_CART_TOTAL"]))
    expect(reserve).not.toHaveBeenCalled()
  })

  it("refreshes authoritative Medusa prices before issuing readiness", async () => {
    const cart = makeCart({
      items: [{
        ...(makeCart().items as unknown[])[0] as Record<string, unknown>,
        unit_price: 90,
      }],
      item_subtotal: 90,
      total: 90,
    })
    const refreshRun = jest.fn().mockImplementation(async () => {
      const item = (cart.items as Array<{ unit_price: number }>)[0]
      item.unit_price = 100
      cart.item_subtotal = 100
      cart.total = 100
      return { result: undefined }
    })
    refresh.mockReturnValue({ run: refreshRun })
    const { scope } = makeScope(cart)
    const response = makeResponse()

    await POST(request(scope) as never, response as never)

    expect(response.statusCode).toBe(200)
    expect(refreshRun).toHaveBeenCalledWith({ input: {
      cart_id: "cart_prepare_1",
      force_refresh: true,
      force_tax_calculation: true,
    } })
  })

  it("fails closed when the authoritative reservation workflow loses stock", async () => {
    reserve.mockRejectedValueOnce(new Error("insufficient inventory"))
    const { scope } = makeScope(makeCart())
    const response = makeResponse()

    await POST(request(scope) as never, response as never)

    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({ checkout_state: "BLOCKED" })
    expect((response.body?.validation as { errors: Array<{ code: string }> }).errors[0]?.code)
      .toBe("INVENTORY_UNAVAILABLE")
  })

  it("denies guest checkout preparation before cart lookup", async () => {
    const { scope, graph } = makeScope(makeCart())

    await expect(POST({ params: { id: "cart_prepare_1" }, body: {}, scope } as never, makeResponse() as never))
      .rejects.toMatchObject({ type: "unauthorized" })
    expect(graph).not.toHaveBeenCalled()
  })

  it("returns the same non-enumerating result for cross-customer and guest carts", async () => {
    const owned = makeScope(makeCart({
      customer_id: "customer_owner",
      completed_at: new Date().toISOString(),
    }))
    await expect(POST({
      params: { id: "cart_prepare_1" },
      body: {},
      auth_context: { actor_id: "customer_other" },
      scope: owned.scope,
    } as never, makeResponse() as never)).rejects.toMatchObject({ type: "not_found", message: "Cart not found" })

    const guest = makeScope(makeCart({ customer_id: null }))
    await expect(POST({
      params: { id: "cart_prepare_1" },
      body: {},
      auth_context: { actor_id: "customer_actor" },
      scope: guest.scope,
    } as never, makeResponse() as never)).rejects.toMatchObject({ type: "not_found", message: "Cart not found" })
  })

  it("ignores a tampered customer_id and uses only the authenticated customer", async () => {
    const { scope, graph } = makeScope(makeCart({ customer_id: "customer_owner" }))

    await expect(POST(request(scope, { customer_id: "customer_owner" }, "customer_other") as never, makeResponse() as never))
      .rejects.toMatchObject({ type: "not_found", message: "Cart not found" })
    expect(graph).toHaveBeenCalledWith(expect.objectContaining({
      filters: { id: "cart_prepare_1", customer_id: "customer_other" },
    }))
  })

  it("allows a customer-owned BR/SP cart and rejects US/RJ addresses", async () => {
    const allowed = makeScope(makeCart({ shipping_address: { ...makeCart().shipping_address, country_code: "BR", province: "SP" } }))
    const allowedResponse = makeResponse()
    await POST(request(allowed.scope) as never, allowedResponse as never)
    expect(allowedResponse.statusCode).toBe(200)

    const rejected = makeScope(makeCart({ shipping_address: { ...makeCart().shipping_address, country_code: "US", province: "RJ" } }))
    const rejectedResponse = makeResponse()
    await POST(request(rejected.scope) as never, rejectedResponse as never)
    expect(rejectedResponse.statusCode).toBe(400)
    expect((rejectedResponse.body?.validation as { errors: Array<{ code: string }> }).errors.map((error) => error.code))
      .toEqual(expect.arrayContaining(["INVALID_COUNTRY", "INVALID_PROVINCE"]))
  })

  it("prepares pickup without requiring a delivery address", async () => {
    workflow.mockReturnValue({ run: jest.fn().mockResolvedValue({
      result: [{ id: "FRIGGAFRIO_PICKUP_STORE_1", name: "Retirada na Loja", amount: 0, currency_code: "brl", data: { commercial_shipping_option: "FRIGGAFRIO_PICKUP_STORE_1" } }],
    }) })
    const pickupCart = makeCart({
      shipping_address: null,
      billing_address: makeCart().billing_address,
      shipping_methods: [{ id: "sm_pickup", name: "Retirada na Loja", amount: 0, shipping_option_id: "FRIGGAFRIO_PICKUP_STORE_1" }],
    })
    const { scope } = makeScope(pickupCart)
    const response = makeResponse()

    await POST(request(scope) as never, response as never)

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({ checkout_state: "READY_FOR_PAYMENT", address: null, shipping: 0 })
  })

  it("prepares pickup without inventing a customer billing address", async () => {
    workflow.mockReturnValue({ run: jest.fn().mockResolvedValue({
      result: [{ id: "FRIGGAFRIO_PICKUP_STORE_1", name: "Retirada na Loja", amount: 0, currency_code: "brl", data: { commercial_shipping_option: "FRIGGAFRIO_PICKUP_STORE_1" } }],
    }) })
    const pickupCart = makeCart({
      shipping_address: null,
      billing_address: null,
      shipping_methods: [{ id: "sm_pickup", name: "Retirada na Loja", amount: 0, shipping_option_id: "FRIGGAFRIO_PICKUP_STORE_1" }],
    })
    const { scope } = makeScope(pickupCart)
    const response = makeResponse()

    await POST(request(scope) as never, response as never)

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({ checkout_state: "READY_FOR_PAYMENT", address: null, billing_address: null })
  })
})
