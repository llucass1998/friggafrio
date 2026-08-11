import assert from "node:assert/strict"
import test from "node:test"
import { getProductPurchaseState } from "../../src/lib/utils/product-state.ts"

const makeVariant = (overrides = {}) => ({
  id: "variant-tech-fixture",
  calculated_price: { calculated_amount: 10, currency_code: "brl" },
  manage_inventory: true,
  inventory_quantity: 2,
  allow_backorder: false,
  ...overrides,
})

const makeProduct = (variant = makeVariant(), metadata = {}) => ({
  id: "product-tech-fixture",
  title: "Technical fixture only",
  variants: [variant],
  metadata,
})

test("positive explicit inventory is purchasable", () => {
  const state = getProductPurchaseState(makeProduct())
  assert.equal(state.status, "purchasable")
})

test("missing inventory metadata is not treated as available", () => {
  const state = getProductPurchaseState(
    makeProduct({
      calculated_price: { calculated_amount: 10, currency_code: "brl" },
    })
  )
  assert.equal(state.status, "out_of_stock")
})

test("zero inventory is out of stock", () => {
  const state = getProductPurchaseState(makeProduct(makeVariant({ inventory_quantity: 0 })))
  assert.equal(state.status, "out_of_stock")
})

test("quote-only metadata blocks direct purchase", () => {
  const state = getProductPurchaseState(makeProduct(makeVariant(), { is_quote_only: true }))
  assert.equal(state.status, "unavailable")
})

test("explicit backorder permission is purchasable", () => {
  const state = getProductPurchaseState(
    makeProduct(makeVariant({ inventory_quantity: 0, allow_backorder: true }))
  )
  assert.equal(state.status, "purchasable")
})

test("missing or zero price remains pending", () => {
  for (const amount of [null, 0]) {
    const state = getProductPurchaseState(
      makeProduct(makeVariant({ calculated_price: { calculated_amount: amount, currency_code: "brl" } }))
    )
    assert.equal(state.status, "price_pending")
  }
})
