import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
test("Gate 7 prepare sends no client-authoritative totals and cannot complete a cart", () => {
  const prepareSource = readFileSync(new URL("../../src/lib/data/checkout/prepare.ts", import.meta.url), "utf8")
  const checkoutPage = readFileSync(new URL("../../src/pages/checkout.tsx", import.meta.url), "utf8")
  assert.match(prepareSource, /shipping_option_id/)
  const requestBlock = prepareSource.slice(prepareSource.lastIndexOf("body:"))
  assert.doesNotMatch(requestBlock, /shipping_amount|total/)
  assert.doesNotMatch(checkoutPage, /sdk\.store\.cart\.complete/)
  assert.match(checkoutPage, /CheckoutPreparationStep/)
})

test("prepare sanitizes server totals, keeps READY_FOR_PAYMENT, and controls stale shipping errors", () => {
  const prepareSource = readFileSync(new URL("../../src/lib/data/checkout/prepare.ts", import.meta.url), "utf8")
  assert.match(prepareSource, /state: "READY_FOR_PAYMENT"/)
  assert.match(prepareSource, /currencyCode: "brl"/)
  assert.match(prepareSource, /STALE_SHIPPING_OPTION/)
  assert.match(prepareSource, /Tente novamente|tente novamente/)
})
