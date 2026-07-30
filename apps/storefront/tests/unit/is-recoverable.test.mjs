import assert from "node:assert/strict"
import test from "node:test"
import { isRecoverableStaleCartError } from "../../src/lib/utils/is-recoverable-cart-error.ts"

test("should not recover general 500 error", () => {
  assert.equal(isRecoverableStaleCartError({ status: 500 }), false)
  assert.equal(isRecoverableStaleCartError({ status: 504 }), false)
})

test("should not recover invalid_data", () => {
  assert.equal(isRecoverableStaleCartError({ type: "invalid_data" }), false)
  assert.equal(isRecoverableStaleCartError({ message: "invalid request" }), false)
})

test("should not recover stock error", () => {
  assert.equal(isRecoverableStaleCartError({ message: "not enough stock" }), false)
  assert.equal(isRecoverableStaleCartError({ type: "not_allowed", message: "inventory issue" }), false)
})

test("should recover 404 or not_found", () => {
  assert.equal(isRecoverableStaleCartError({ status: 404 }), true)
  assert.equal(isRecoverableStaleCartError({ type: "not_found" }), true)
  assert.equal(isRecoverableStaleCartError({ message: "Cart not found" }), true)
})

test("should recover completed cart", () => {
  assert.equal(isRecoverableStaleCartError({ type: "not_allowed", message: "Cart is completed" }), true)
})

test("should not recover calculated_amount error", () => {
  assert.equal(isRecoverableStaleCartError({ message: "Cannot read properties of undefined (reading 'calculated_amount')" }), false)
})

test("should not recover missing pricing context", () => {
  assert.equal(isRecoverableStaleCartError({ message: "Missing required pricing context" }), false)
})

test("should not recover missing sales channel", () => {
  assert.equal(isRecoverableStaleCartError({ message: "Cannot read properties of undefined (reading 'sales channel')" }), false)
})
