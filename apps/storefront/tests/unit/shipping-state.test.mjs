import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import {
  getShippingOptionDeliveryCopy,
  getShippingOptionsViewState,
  hasShippingOption,
  isShippingOptionSelectable,
} from "../../src/lib/utils/shipping-state.ts"

const flatOption = { id: "ship_flat", price_type: "flat" }
const calculatedOption = { id: "ship_calculated", price_type: "calculated" }

test("shipping view state distinguishes loading, provider errors, empty, and ready", () => {
  assert.equal(getShippingOptionsViewState({ isLoading: true, isError: false }), "loading")
  assert.equal(getShippingOptionsViewState({ isLoading: false, isError: true }), "error")
  assert.equal(getShippingOptionsViewState({ isLoading: false, isError: false, options: [] }), "empty")
  assert.equal(getShippingOptionsViewState({ isLoading: false, isError: false, options: [flatOption] }), "ready")
})

test("calculated shipping cannot be selected before provider pricing succeeds", () => {
  assert.equal(isShippingOptionSelectable({ ...flatOption, amount: 1000 }), true)
  assert.equal(isShippingOptionSelectable(calculatedOption, "pending"), false)
  assert.equal(isShippingOptionSelectable(calculatedOption, "error"), false)
  assert.equal(isShippingOptionSelectable({ ...calculatedOption, amount: undefined }, "ready", 1000), true)
})

test("shipping options fail closed for missing amounts while explicit free shipping remains valid", () => {
  assert.equal(isShippingOptionSelectable(flatOption), false)
  assert.equal(isShippingOptionSelectable({ ...flatOption, amount: null }), false)
  assert.equal(isShippingOptionSelectable({ ...flatOption, amount: 0 }), true)
  assert.equal(isShippingOptionSelectable({ ...flatOption, amount: Number.NaN }), false)
})

test("official server-provided copy and amount remain the storefront source of truth", () => {
  const option = {
    id: "express-0-10",
    price_type: "flat",
    amount: 80,
    data: { description: "Entrega expressa em até 6 horas em dia útil." },
  }

  assert.equal(isShippingOptionSelectable(option), true)
  assert.equal(option.amount, 80)
  assert.equal(option.data.description, "Entrega expressa em até 6 horas em dia útil.")
})

test("delivery copy projects each official server field without inventing fallback text", () => {
  assert.equal(
    getShippingOptionDeliveryCopy({ data: { description: "Entrega hoje" } }),
    "Entrega hoje",
  )
  assert.equal(
    getShippingOptionDeliveryCopy({ data: { estimated_delivery: "Entrega em 2 dias" } }),
    "Entrega em 2 dias",
  )
  assert.equal(
    getShippingOptionDeliveryCopy({ type: { description: "Entrega agendada" } }),
    "Entrega agendada",
  )
  assert.equal(
    getShippingOptionDeliveryCopy({
      data: { description: "", estimated_delivery: "Entrega em 2 dias" },
      type: { description: "Outro prazo" },
    }),
    "Entrega em 2 dias",
  )
  assert.equal(
    getShippingOptionDeliveryCopy({ data: { description: "Entrega hoje", estimated_delivery: "Outro prazo" }, type: { description: "Outro prazo" } }),
    "Entrega hoje",
  )
  assert.equal(getShippingOptionDeliveryCopy({ data: null, type: null }), undefined)
})

test("official shipping boundaries keep destinations above 100km unavailable", () => {
  const source = readFileSync(new URL("../../../backend/src/utils/commercial-shipping-policy.ts", import.meta.url), "utf8")
  assert.match(source, /distanceKm > 100/)
  assert.match(source, /maxDistanceKm: 100/)
})

test("shipping selection is scoped to options returned for the cart", () => {
  assert.equal(hasShippingOption([flatOption], "ship_flat"), true)
  assert.equal(hasShippingOption([flatOption], "ship_other"), false)
  assert.equal(hasShippingOption(undefined, "ship_flat"), false)
})

test("checkout keeps the three delivery modalities visible in fixed order", () => {
  const source = readFileSync(new URL("../../src/components/checkout-delivery-step.tsx", import.meta.url), "utf8")
  assert.match(source, /pickup:\s*0/)
  assert.match(source, /car:\s*1/)
  assert.match(source, /motoboy:\s*2/)
  assert.match(source, /disabled=\{!option\.available \|\| \(option\.modality !== "car" && !option\.shipping_option_id\)\}/)
  assert.match(source, /visibleShippingPlaceholders/)
  assert.doesNotMatch(source, /estimateShipping/)
  assert.doesNotMatch(source, /setOptions\(\[\]\)/)
})

test("shipping cards render the backend reason instead of hiding unavailable modalities", () => {
  const source = readFileSync(new URL("../../src/components/shipping-option-card.tsx", import.meta.url), "utf8")
  assert.match(source, /!option\.available && option\.reason/)
  assert.match(source, /Indisponível/)
})
