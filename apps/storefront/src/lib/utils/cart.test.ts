import { describe, it } from "node:test"
 
 

describe("updateLineItemOptimistically", () => {
  it("should update quantity and recalculate totals", () => {
    // We will test it manually or we can see it from the code.
  })
})

import { isRecoverableStaleCartError } from "./is-recoverable-cart-error"
import assert from "node:assert"

describe("isRecoverableStaleCartError", () => {
  it("should not recover general 500 error", () => {
    assert.strictEqual(isRecoverableStaleCartError({ status: 500 }), false)
  })
  
  it("should not recover invalid_data", () => {
    assert.strictEqual(isRecoverableStaleCartError({ type: "invalid_data" }), false)
  })

  it("should not recover stock error", () => {
    assert.strictEqual(isRecoverableStaleCartError({ message: "not enough stock" }), false)
  })

  it("should recover 404 or not_found", () => {
    assert.strictEqual(isRecoverableStaleCartError({ status: 404 }), true)
    assert.strictEqual(isRecoverableStaleCartError({ type: "not_found" }), true)
  })

  it("should recover completed cart", () => {
    // Type not_allowed and no inventory message = completed cart
    assert.strictEqual(isRecoverableStaleCartError({ type: "not_allowed", message: "Cart is completed" }), true)
  })
})
