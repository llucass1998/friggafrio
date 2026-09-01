import assert from "node:assert/strict"
import test from "node:test"
import { formatCNPJ, formatCPF, formatPhone } from "../../src/lib/utils/formatters.ts"
import {
  isValidBrazilPhone,
  isValidBrazilPostalCode,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidPersonName,
  normalizeDigits,
  normalizePersonName,
} from "../../src/lib/validation/checkout.ts"
import { buildCheckoutAddressPayload, hasCompleteCheckoutAddress } from "../../src/lib/utils/checkout-address-payload.ts"
import {
  CHECKOUT_DRAFT_STORAGE_KEY,
  CHECKOUT_DRAFT_VERSION,
  clearCheckoutDraftStorage,
  isCheckoutDraftSafeForSession,
  readCheckoutDraftStorage,
  sanitizeCheckoutDraft,
  writeCheckoutDraftStorage,
} from "../../src/lib/utils/checkout-draft.ts"

test("validates CPF and CNPJ check digits and rejects repeated values", () => {
  assert.equal(isValidCpf("529.982.247-25"), true)
  assert.equal(isValidCpf("52998224724"), false)
  assert.equal(isValidCpf("11111111111"), false)
  assert.equal(isValidCnpj("04.252.011/0001-10"), true)
  assert.equal(isValidCnpj("04252011000111"), false)
  assert.equal(isValidCnpj("11111111111111"), false)
})

test("normalizes and validates checkout field formats", () => {
  assert.equal(normalizeDigits("0a5.144-085", 8), "05144085")
  assert.equal(isValidBrazilPostalCode("05144-085"), true)
  assert.equal(isValidBrazilPostalCode("05144-08"), false)
  assert.equal(isValidBrazilPhone("(11) 99999-1234"), true)
  assert.equal(isValidBrazilPhone("11 9"), false)
  assert.equal(isValidEmail(" customer@example.com "), true)
  assert.equal(isValidEmail("customer example.com"), false)
})

test("names accept Unicode punctuation but reject digits", () => {
  assert.equal(normalizePersonName("  João   da-Silva  "), "João da-Silva")
  assert.equal(isValidPersonName("João da Silva"), true)
  assert.equal(isValidPersonName("Empresa 3"), false)
})

test("existing masks cap numeric fields", () => {
  assert.equal(formatCPF("529982247251"), "529.982.247-25")
  assert.equal(formatCNPJ("042520110001101"), "04.252.011/0001-10")
  assert.equal(formatPhone("119999912345"), "(11) 99999-1234")
})

test("pickup payload omits both address properties instead of sending null", () => {
  const payload = buildCheckoutAddressPayload({ email: "guest@example.com", pickupOnly: true })
  assert.equal(Object.hasOwn(payload, "shipping_address"), false)
  assert.equal(Object.hasOwn(payload, "billing_address"), false)
})

test("delivery payload includes only validated address objects and no null fields", () => {
  const address = {
    first_name: "Joao",
    last_name: "Silva",
    address_1: "Rua A",
    city: "Sao Paulo",
    postal_code: "01001-000",
    country_code: "br",
    province: "SP",
    address_2: null,
  }
  assert.equal(hasCompleteCheckoutAddress(address), true)
  const payload = buildCheckoutAddressPayload({ email: "guest@example.com", pickupOnly: false, shippingAddress: address, billingAddress: address })
  assert.deepEqual(payload.shipping_address, {
    first_name: "Joao",
    last_name: "Silva",
    address_1: "Rua A",
    city: "Sao Paulo",
    postal_code: "01001-000",
    country_code: "br",
    province: "SP",
  })
  assert.equal(JSON.stringify(payload).includes(":null"), false)
})

test("incomplete delivery draft does not create an empty or null address", () => {
  const payload = buildCheckoutAddressPayload({
    email: "guest@example.com",
    pickupOnly: false,
    shippingAddress: { first_name: "Joao", address_1: null, city: null, postal_code: null, country_code: "br" },
    billingAddress: { first_name: "Joao", address_1: null, city: null, postal_code: null, country_code: "br" },
  })
  assert.equal(Object.hasOwn(payload, "shipping_address"), false)
  assert.equal(Object.hasOwn(payload, "billing_address"), false)
})

test("checkout draft sanitizes null fields and rejects legacy or invalid storage", () => {
  const draft = sanitizeCheckoutDraft({
    version: CHECKOUT_DRAFT_VERSION,
    cartId: "cart_a",
    addressConfirmed: true,
    authState: "guest",
    customerId: null,
    customerInfo: { firstName: null, lastName: "Silva", document: null, phone: null, email: "guest@example.com" },
  })
  assert.equal(draft?.customerInfo.firstName, "")
  assert.equal(draft?.customerInfo.document, "")
  assert.equal(draft?.customerInfo.phone, "")
  assert.equal(sanitizeCheckoutDraft({ ...draft, version: 0 }), null)
  assert.equal(sanitizeCheckoutDraft("not-json-object"), null)
  assert.equal(sanitizeCheckoutDraft({ version: CHECKOUT_DRAFT_VERSION, cartId: "cart_a", addressConfirmed: true, customerInfo: null }), null)
})

test("checkout drafts stay isolated by cart and authenticated customer", () => {
  const guestDraft = sanitizeCheckoutDraft({
    version: CHECKOUT_DRAFT_VERSION,
    cartId: "cart_a",
    addressConfirmed: true,
    authState: "guest",
    customerId: null,
    customerInfo: { firstName: "Conta A", lastName: "Cliente", email: "a@example.com" },
  })
  const accountDraft = sanitizeCheckoutDraft({
    version: CHECKOUT_DRAFT_VERSION,
    cartId: "cart_a",
    addressConfirmed: true,
    authState: "authenticated",
    customerId: "customer_a",
    customerInfo: { firstName: "Conta A", lastName: "Cliente", email: "a@example.com" },
  })
  assert.equal(isCheckoutDraftSafeForSession(guestDraft, { cartId: "cart_b", authState: "guest" }), false)
  assert.equal(isCheckoutDraftSafeForSession(accountDraft, { cartId: "cart_a", authState: "authenticated", customerId: "customer_b" }), false)
  assert.equal(isCheckoutDraftSafeForSession(accountDraft, { cartId: "cart_a", authState: "guest" }), false)
  assert.equal(isCheckoutDraftSafeForSession(accountDraft, { cartId: "cart_a", authState: "loading" }), true)
  assert.equal(sanitizeCheckoutDraft({
    version: CHECKOUT_DRAFT_VERSION,
    cartId: "cart_a",
    addressConfirmed: true,
    authState: "authenticated",
    customerId: null,
    customerInfo: { firstName: "Conta A" },
  }), null)
})

test("checkout draft contains no payment secrets or server-authoritative totals", () => {
  const draft = sanitizeCheckoutDraft({
    version: CHECKOUT_DRAFT_VERSION,
    cartId: "cart_a",
    addressConfirmed: true,
    authState: "guest",
    customerId: null,
    customerInfo: { firstName: "Conta A", phone: "11999999999", document: "529.982.247-25" },
    total: 1,
    pan: "4111111111111111",
    cvv: "123",
    token: "secret-token",
  })
  assert.ok(draft)
  const serialized = JSON.stringify(draft)
  assert.doesNotMatch(serialized, /total|pan|cvv|token|secret/i)
})

test("checkout draft storage fails closed for invalid JSON and unavailable storage", () => {
  const values = new Map<string, string>([[CHECKOUT_DRAFT_STORAGE_KEY, "{invalid"]])
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
  const previousWindow = (globalThis as { window?: unknown }).window
  const draft = sanitizeCheckoutDraft({
    version: CHECKOUT_DRAFT_VERSION,
    cartId: "cart_a",
    addressConfirmed: false,
    authState: "guest",
    customerId: null,
    customerInfo: { firstName: "Conta A" },
  })
  assert.ok(draft)
  ;(globalThis as { window?: unknown }).window = { sessionStorage: storage }
  try {
    assert.equal(readCheckoutDraftStorage(), null)
    assert.equal(values.has(CHECKOUT_DRAFT_STORAGE_KEY), false)
    writeCheckoutDraftStorage(draft)
    assert.deepEqual(readCheckoutDraftStorage(), draft)
    clearCheckoutDraftStorage()
    assert.equal(readCheckoutDraftStorage(), null)
  } finally {
    ;(globalThis as { window?: unknown }).window = previousWindow
  }

  ;(globalThis as { window?: unknown }).window = {
    sessionStorage: {
      getItem: () => { throw new Error("blocked") },
      setItem: () => { throw new Error("blocked") },
      removeItem: () => { throw new Error("blocked") },
    },
  }
  try {
    assert.equal(readCheckoutDraftStorage(), null)
    writeCheckoutDraftStorage(draft!)
    clearCheckoutDraftStorage()
  } finally {
    ;(globalThis as { window?: unknown }).window = previousWindow
  }
})
