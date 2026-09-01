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

test("checkout preparation does not expose a billing-address form or summary", () => {
  const preparationSource = readFileSync(new URL("../../src/components/checkout-preparation-step.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(preparationSource, /Endere[cç]o de cobran[cç]a/i)
})

test("pickup never uses the store address as customer shipping or billing", () => {
  const hookSource = readFileSync(new URL("../../src/lib/hooks/use-checkout.ts", import.meta.url), "utf8")
  const payloadSource = readFileSync(new URL("../../src/lib/utils/checkout-address-payload.ts", import.meta.url), "utf8")
  assert.match(hookSource, /buildCheckoutAddressPayload/)
  assert.match(payloadSource, /if \(pickupOnly\) return payload/)
  assert.doesNotMatch(payloadSource, /shipping_address:\s*null|billing_address:\s*null/)
  assert.match(payloadSource, /pickup_location: "FRIGGAFRIO_STORE_1"/)
  assert.doesNotMatch(hookSource, /address_1: "Alameda Glete, 663"/)
})

test("legacy address helper shares the null-safe payload builder", () => {
  const source = readFileSync(new URL("../../src/lib/data/checkout/addresses.ts", import.meta.url), "utf8")
  assert.match(source, /buildCheckoutAddressPayload/)
  assert.doesNotMatch(source, /shipping_address:\s*shippingAddress,\s*billing_address:\s*billingAddress/)
})

test("CEP lookup exposes a customer-safe not-found or manual-entry message", () => {
  const source = readFileSync(new URL("../../src/components/address-form.tsx", import.meta.url), "utf8")
  assert.match(source, /N\u00e3o encontramos esse CEP/)
  assert.match(source, /Voc\u00ea pode preencher manualmente/)
  assert.match(source, /aria-live=\"polite\"/)
})
