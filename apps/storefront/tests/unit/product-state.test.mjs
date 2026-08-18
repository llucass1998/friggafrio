import assert from "node:assert/strict"
import test from "node:test"
import { getProductPurchaseState } from "../../src/lib/utils/product-state.ts"
import {
  PUBLIC_PRODUCT_CARD_FIELDS,
  PUBLIC_PRODUCT_DETAIL_FIELDS,
} from "../../src/lib/data/product-fields.ts"

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

test("public Card and PDP selections avoid internal metadata and request explicit inventory", () => {
  for (const fields of [PUBLIC_PRODUCT_CARD_FIELDS, PUBLIC_PRODUCT_DETAIL_FIELDS]) {
    assert.doesNotMatch(fields, /\+metadata/)
    assert.match(fields, /\+variants\.inventory_quantity/)
    assert.match(fields, /\+variants\.manage_inventory/)
    assert.match(fields, /\+variants\.allow_backorder/)
    assert.match(fields, /variants\.calculated_price/)
  }
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
  assert.equal(state.status, "quote_only")
})

test("Store API commercial_status QUOTE_ONLY overrides price and inventory", () => {
  const state = getProductPurchaseState(
    makeProduct(makeVariant({ inventory_quantity: 0 }), { commercial_status: "QUOTE_ONLY" })
  )
  assert.equal(state.status, "quote_only")
})

test("Store API QUOTE_ONLY remains visible when direct purchase is disabled", () => {
  const state = getProductPurchaseState(
    makeProduct(makeVariant(), { commercial_status: "QUOTE_ONLY", purchase_enabled: false })
  )
  assert.equal(state.status, "quote_only")
})

test("Store API price_pending metadata blocks direct purchase", () => {
  const state = getProductPurchaseState(makeProduct(makeVariant(), { price_pending: true }))
  assert.equal(state.status, "price_pending")
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
