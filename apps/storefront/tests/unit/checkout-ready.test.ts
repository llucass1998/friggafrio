import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import {
  assertCheckoutReady,
  CheckoutReadyError,
} from "../../src/lib/data/checkout/checkout-ready.ts"

test("checkout completion invokes the server checkout-ready boundary", async () => {
  const calls: Array<{ input: string; init: { method: string; body: unknown } }> = []

  await assertCheckoutReady("cart/with spaces", async (input, init) => {
    calls.push({ input, init })
    return { checkout_ready: true }
  })

  assert.deepEqual(calls, [{
    input: "/store/carts/cart%2Fwith%20spaces/checkout-ready",
    init: { method: "POST", body: {} },
  }])
})

test("a controlled checkout-ready failure blocks completion", async () => {
  let completionCalled = false

  await assert.rejects(
    () => assertCheckoutReady("cart_blocked", async () => ({
      checkout_ready: false,
      code: "cart_commercial_hold",
      message: "Commercial hold",
    })),
    (error: unknown) => {
      assert.ok(error instanceof CheckoutReadyError)
      assert.equal(error.code, "cart_commercial_hold")
      assert.equal(error.message, "Commercial hold")
      return true
    },
  )

  const completeSource = readFileSync(
    new URL("../../src/lib/data/checkout/complete.ts", import.meta.url),
    "utf8",
  )
  const readinessIndex = completeSource.indexOf("await assertCartCheckoutReady(cartId)")
  const completeIndex = completeSource.indexOf("sdk.store.cart.complete(cartId, {})")
  assert.ok(readinessIndex >= 0)
  assert.ok(completeIndex > readinessIndex)
  assert.equal(completionCalled, false)
})

test("non-200 readiness responses become a controlled checkout error", async () => {
  await assert.rejects(
    () => assertCheckoutReady("cart_error", async () => {
      throw Object.assign(new Error("inventory unavailable"), { status: 409 })
    }),
    (error: unknown) => {
      assert.ok(error instanceof CheckoutReadyError)
      assert.equal(error.status, 409)
      assert.equal(error.message, "Checkout readiness failed: inventory unavailable")
      return true
    },
  )
})
