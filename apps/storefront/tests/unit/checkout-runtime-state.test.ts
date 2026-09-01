import assert from "node:assert/strict"
import test from "node:test"
import {
  checkoutRuntimeKey,
  clearCheckoutRuntimeState,
  clearCheckoutRuntimeStateKey,
  readCheckoutSelectionState,
  readPreparedCheckoutState,
  writeCheckoutSelectionState,
  writePreparedCheckoutState,
} from "../../src/lib/utils/checkout-runtime-state.ts"
import type { CheckoutPreparedSummary } from "../../src/lib/data/checkout/prepare.ts"

const prepared = (cartId: string): CheckoutPreparedSummary => ({
  cartId,
  state: "READY_FOR_PAYMENT",
  email: "guest@example.com",
  address: null,
  billingAddress: null,
  shipping: { id: "pickup", name: "Retirada na Loja 1", amount: 0, currencyCode: "brl" },
  items: [],
  subtotal: 100,
  shippingTotal: 0,
  total: 100,
})

test.afterEach(() => clearCheckoutRuntimeState())

test("runtime checkout state is isolated by cart and authenticated account", () => {
  const cartA = checkoutRuntimeKey("cart_a", "authenticated", "customer_a")
  const cartB = checkoutRuntimeKey("cart_a", "authenticated", "customer_b")
  const otherCart = checkoutRuntimeKey("cart_b", "authenticated", "customer_a")

  writePreparedCheckoutState(cartA, prepared("cart_a"))
  writeCheckoutSelectionState(cartA, { method: "pix" })

  assert.deepEqual(readPreparedCheckoutState(cartA)?.cartId, "cart_a")
  assert.deepEqual(readCheckoutSelectionState(cartA), { method: "pix" })
  assert.equal(readPreparedCheckoutState(cartB), null)
  assert.equal(readCheckoutSelectionState(cartB), null)
  assert.equal(readPreparedCheckoutState(otherCart), null)
})

test("clearing one runtime key cannot leak state to a new identity", () => {
  const previous = checkoutRuntimeKey("cart_a", "authenticated", "customer_a")
  const next = checkoutRuntimeKey("cart_a", "authenticated", "customer_b")
  writePreparedCheckoutState(previous, prepared("cart_a"))
  writeCheckoutSelectionState(previous, { method: "card" })

  clearCheckoutRuntimeStateKey(previous)

  assert.equal(readPreparedCheckoutState(previous), null)
  assert.equal(readCheckoutSelectionState(previous), null)
  assert.equal(readPreparedCheckoutState(next), null)
  assert.equal(readCheckoutSelectionState(next), null)
})

test("logout or order completion can clear every runtime checkout entry", () => {
  const guest = checkoutRuntimeKey("cart_guest", "guest")
  const account = checkoutRuntimeKey("cart_account", "authenticated", "customer_a")
  writePreparedCheckoutState(guest, prepared("cart_guest"))
  writeCheckoutSelectionState(account, { method: "pix" })

  clearCheckoutRuntimeState()

  assert.equal(readPreparedCheckoutState(guest), null)
  assert.equal(readCheckoutSelectionState(account), null)
})

test("runtime keys are absent without a cart and loading stays identity-neutral", () => {
  assert.equal(checkoutRuntimeKey(null, "guest"), null)
  assert.equal(checkoutRuntimeKey(undefined, "loading"), null)
  assert.equal(checkoutRuntimeKey("cart_a", "loading"), "cart_a:loading")
})
