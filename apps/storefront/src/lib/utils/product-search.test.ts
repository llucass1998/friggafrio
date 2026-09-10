import assert from "node:assert/strict"
import test from "node:test"
import type { HttpTypes } from "@medusajs/types"
import { normalizeProductSearch, scoreProductRelevance, sortProductsByRelevance } from "@/lib/utils/product-search"

const product = (input: Record<string, unknown>) => ({
  id: String(input.id || "p"),
  title: String(input.title || ""),
  handle: String(input.handle || "produto"),
  variants: [{
    id: "v1",
    sku: input.sku,
    calculated_price: { calculated_amount: input.price ?? 100, currency_code: "BRL" },
    manage_inventory: true,
    inventory_quantity: input.stock ?? 5,
  }],
  metadata: {},
}) as unknown as HttpTypes.StoreProduct

test("normalizes accents, case and whitespace without damaging technical codes", () => {
  assert.equal(normalizeProductSearch("  Gás   R22  "), "gas r22")
  assert.equal(normalizeProductSearch("r410A"), "r410a")
})

test("prioritizes exact SKU and purchasable products", () => {
  const exact = product({ id: "exact", title: "Compressor", sku: "R22-001", stock: 0 })
  const available = product({ id: "available", title: "Gás R22", sku: "GAS-22", stock: 8 })
  assert.ok(scoreProductRelevance(exact, "R22-001") > scoreProductRelevance(available, "R22"))
  assert.deepEqual(sortProductsByRelevance([exact, available], "R22" ).map((item) => item.id), ["available", "exact"])
})
