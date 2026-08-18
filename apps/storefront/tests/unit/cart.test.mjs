import assert from "node:assert/strict"
import test from "node:test"
import {
  assertPositiveIntegerQuantity,
  getCartItemCount,
  getCartLineCommercialState,
  isCartNotFoundError,
  isCartCheckoutReady,
  retrieveCartOnce,
  sortCartItems,
} from "../../src/lib/utils/cart.ts"

test("getCartItemCount sums item quantities", () => {
  assert.equal(
    getCartItemCount([{ quantity: 2 }, { quantity: 3 }, { quantity: 0 }]),
    5
  )
})

test("getCartItemCount treats an absent cart as empty", () => {
  assert.equal(getCartItemCount(), 0)
})

test("getCartItemCount ignores malformed quantities", () => {
  assert.equal(
    getCartItemCount([
      { quantity: 2 },
      { quantity: 0 },
      { quantity: -1 },
      { quantity: 1.5 },
      { quantity: Number.NaN },
      { quantity: Number.POSITIVE_INFINITY },
    ]),
    2
  )
})

test("sortCartItems does not mutate the cart cache array", () => {
  const first = { id: "first", created_at: "2026-08-02T00:00:00.000Z" }
  const second = { id: "second", created_at: "2026-08-01T00:00:00.000Z" }
  const items = [first, second]

  assert.deepEqual(sortCartItems(items), [second, first])
  assert.deepEqual(items, [first, second])
})

test("cart line commercial metadata is fail-closed for quote and pending states", () => {
  assert.equal(
    getCartLineCommercialState({ metadata: { commercial_status: "QUOTE_ONLY" } }),
    "quote_only"
  )
  assert.equal(
    getCartLineCommercialState({ metadata: { price_pending: true } }),
    "price_pending"
  )
  assert.equal(
    getCartLineCommercialState({ metadata: {}, unit_price: 10, total: 10 }),
    "standard"
  )
})

test("cart quantities must be positive safe integers", () => {
  assert.equal(assertPositiveIntegerQuantity(1), 1)
  for (const invalid of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => assertPositiveIntegerQuantity(invalid), /positive integer/)
  }
})

test("commercially blocked and unstocked lines cannot make a mixed cart checkout-ready", () => {
  const sellable = {
    variant_id: "variant_sellable",
    quantity: 1,
    unit_price: 10,
    total: 10,
    variant: { manage_inventory: false, product: { metadata: {} } },
  }
  assert.equal(isCartCheckoutReady([sellable]), true)
  assert.equal(isCartCheckoutReady([sellable, {
    variant_id: "variant_quote",
    quantity: 1,
    unit_price: 10,
    total: 10,
    variant: { manage_inventory: false, product: { metadata: { commercial_status: "QUOTE_ONLY" } } },
  }]), false)
  assert.equal(isCartCheckoutReady([sellable, {
    variant_id: "variant_pending",
    quantity: 1,
    unit_price: 10,
    total: 10,
    variant: { manage_inventory: false, product: { metadata: { price_pending: true } } },
  }]), false)
  assert.equal(isCartCheckoutReady([{
    variant_id: "variant_out",
    quantity: 1,
    unit_price: 10,
    total: 10,
    variant: { manage_inventory: true, inventory_quantity: 0, product: { metadata: {} } },
  }]), false)
})

test("missing inventory is not treated as purchasable", () => {
  const item = {
    variant_id: "variant_unknown",
    quantity: 1,
    variant: { manage_inventory: true, product: { metadata: {} } },
  }
  assert.equal(getCartLineCommercialState(item), "out_of_stock")
  assert.equal(isCartCheckoutReady([item]), false)
})

test("reconciled inventory metadata prevents a missing cart projection from becoming out of stock", () => {
  const item = {
    variant_id: "variant_reconciled",
    quantity: 1,
    unit_price: 10,
    total: 10,
    variant: {
      manage_inventory: true,
      allow_backorder: false,
      product: {
        metadata: {
          commercial_status: "SELLABLE",
          inventory_quantity_observed: 138,
        },
      },
    },
  }

  assert.equal(getCartLineCommercialState(item), "standard")
  assert.equal(isCartCheckoutReady([item]), true)
})

test("fractional reconciled inventory remains purchasable when it covers the line quantity", () => {
  const item = {
    variant_id: "variant_fractional_reconciled",
    quantity: 1,
    unit_price: 139.818,
    total: 139.818,
    variant: {
      manage_inventory: true,
      allow_backorder: false,
      product: {
        metadata: {
          commercial_status: "SELLABLE",
          inventory_quantity_observed: 256.6,
        },
      },
    },
  }

  assert.equal(getCartLineCommercialState(item), "standard")
  assert.equal(isCartCheckoutReady([item]), true)
})

test("explicit out-of-stock metadata still blocks checkout", () => {
  const item = {
    variant_id: "variant_out_explicit",
    quantity: 1,
    unit_price: 10,
    total: 10,
    variant: {
      manage_inventory: false,
      product: { metadata: { commercial_status: "OUT_OF_STOCK" } },
    },
  }

  assert.equal(getCartLineCommercialState(item), "out_of_stock")
  assert.equal(isCartCheckoutReady([item]), false)
})

test("missing cart price blocks checkout without treating it as zero", () => {
  const item = {
    variant_id: "variant_price_unknown",
    quantity: 1,
    variant: { manage_inventory: false, product: { metadata: {} } },
  }

  assert.equal(getCartLineCommercialState(item), "price_pending")
  assert.equal(isCartCheckoutReady([item]), false)
})

test("stale cart lookups share one in-flight request", async () => {
  let calls = 0
  let rejectRequest
  const request = () => {
    calls += 1
    return new Promise((resolve, reject) => {
      rejectRequest = reject
    })
  }

  const first = retrieveCartOnce("cart_dead", request)
  const second = retrieveCartOnce("cart_dead", request)

  assert.strictEqual(first, second)
  assert.equal(calls, 1)
  rejectRequest({ status: 404 })
  await assert.rejects(first)
  assert.equal(isCartNotFoundError({ message: "Cart with id cart_dead not found" }), true)
  assert.equal(isCartNotFoundError({ status: 401 }), false)
})
