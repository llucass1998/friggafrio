import assert from "node:assert/strict"
import test from "node:test"
import { transferGuestCartToCustomer } from "../../src/lib/auth/cart-session.ts"

test("transfers an anonymous cart once after customer login", async () => {
  const result = await transferGuestCartToCustomer("cart_1", "cus_1", {
    retrieve: async () => ({ id: "cart_1", customer_id: null }),
    transfer: async () => ({ id: "cart_1", customer_id: "cus_1" }),
  })
  assert.deepEqual(result, { id: "cart_1", customer_id: "cus_1" })
})

test("does not transfer a cart already owned by the logged-in customer", async () => {
  let transfers = 0
  const result = await transferGuestCartToCustomer("cart_1", "cus_1", {
    retrieve: async () => ({ id: "cart_1", customer_id: "cus_1" }),
    transfer: async () => {
      transfers += 1
      return { id: "cart_1", customer_id: "cus_1" }
    },
  })
  assert.equal(transfers, 0)
  assert.deepEqual(result, { id: "cart_1", customer_id: "cus_1" })
})

test("rejects a cart owned by another customer", async () => {
  await assert.rejects(
    transferGuestCartToCustomer("cart_1", "cus_1", {
      retrieve: async () => ({ id: "cart_1", customer_id: "cus_2" }),
      transfer: async () => ({ id: "cart_1", customer_id: "cus_1" }),
    }),
    /outra conta/,
  )
})

test("fails closed when the backend transfer returns a different owner", async () => {
  await assert.rejects(
    transferGuestCartToCustomer("cart_1", "cus_1", {
      retrieve: async () => ({ id: "cart_1", customer_id: null }),
      transfer: async () => ({ id: "cart_1", customer_id: "cus_2" }),
    }),
    /associar o carrinho/,
  )
})
