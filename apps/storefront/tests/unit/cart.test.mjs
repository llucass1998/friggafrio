import assert from "node:assert/strict"
import test from "node:test"
import { getCartItemCount } from "../../src/lib/utils/cart.ts"

test("getCartItemCount sums item quantities", () => {
  assert.equal(
    getCartItemCount([{ quantity: 2 }, { quantity: 3 }, { quantity: 0 }]),
    5
  )
})

test("getCartItemCount treats an absent cart as empty", () => {
  assert.equal(getCartItemCount(), 0)
})
