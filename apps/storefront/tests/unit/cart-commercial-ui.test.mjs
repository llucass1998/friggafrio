import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
const cartComponent = read("../../src/components/cart.tsx")
const cartPage = read("../../src/pages/cart.tsx")
const checkoutPage = read("../../src/pages/checkout.tsx")
const legacyCard = read("../../src/components/product-card.tsx")
const productDetail = read("../../src/pages/product.tsx")

test("cart requests persisted commercial metadata and inventory for every cart surface", () => {
  for (const source of [cartComponent, cartPage]) {
    assert.match(source, /items\.variant\.product\.metadata/)
    assert.match(source, /items\.variant\.inventory_quantity/)
    assert.match(source, /items\.variant\.manage_inventory/)
  }
})

test("cart and direct checkout navigation share the checkout-ready commercial guard", () => {
  assert.match(cartComponent, /disabled=\{!checkoutReady\}/)
  assert.match(cartPage, /disabled=\{!checkoutReady\}/)
  assert.match(checkoutPage, /!isCartCheckoutReady\(cart\.items\)/)
})

test("cart does not substitute missing product totals with zero", () => {
  assert.doesNotMatch(cartComponent, /price=\{item\.total \?\? 0\}/)
  assert.doesNotMatch(cartComponent, /price=\{cart\.item_subtotal \?\? 0\}/)
  assert.doesNotMatch(cartComponent, /price=\{cart\.total \?\? 0\}/)
  assert.match(cartComponent, /PreÃ§o a confirmar/)
})

test("cart total and freight are shown only after a server shipping method is selected", () => {
  assert.match(cartComponent, /hasSelectedShipping/)
  assert.match(cartComponent, /hasSelectedShipping && typeof cart\.shipping_total === "number"/)
  assert.match(cartComponent, /checkoutReady && hasSelectedShipping && typeof cart\.total === "number"/)
})

test("legacy card and PDP consume the canonical product commercial state", () => {
  for (const source of [legacyCard, productDetail]) {
    assert.match(source, /getProductPurchaseState\(product\)/)
    assert.match(source, /quote_only/)
    assert.match(source, /price_pending/)
  }
})
