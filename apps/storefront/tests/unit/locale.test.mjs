import assert from "node:assert/strict"
import test from "node:test"
import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_LOCALE,
} from "../../src/config/commerce.ts"
import { formatCurrencyAmount } from "../../src/lib/utils/currency.ts"
import {
  formatMoneyAmountForStructuredData,
  formatPrice,
} from "../../src/lib/utils/price.ts"
import {
  buildPathWithCountryCode,
  getDefaultCountryCode,
  isStoreCountryCode,
  resolveStoreRegion,
  StoreRegionResolutionError,
} from "../../src/lib/utils/region.ts"

const normalizeSpaces = (value) => value.replace(/\s/g, " ")

test("commerce defaults match the Brazil storefront contract", () => {
  assert.equal(DEFAULT_COUNTRY_CODE, "br")
  assert.equal(DEFAULT_CURRENCY_CODE, "BRL")
  assert.equal(DEFAULT_LOCALE, "pt-BR")
  assert.equal(isStoreCountryCode("BR"), true)
  assert.equal(isStoreCountryCode("us"), false)
})

test("currency formatting treats Medusa amounts as major BRL units", () => {
  const cases = [
    [0, "R$ 0,00"],
    [1, "R$ 1,00"],
    [10, "R$ 10,00"],
    [99.9, "R$ 99,90"],
    [1000, "R$ 1.000,00"],
    [0.01, "R$ 0,01"],
    [1.23, "R$ 1,23"],
  ]

  for (const [amount, expected] of cases) {
    assert.equal(
      normalizeSpaces(formatCurrencyAmount({ amount })),
      expected,
      `amount ${amount}`
    )
  }
})

test("price helpers share BRL and pt-BR defaults", () => {
  assert.equal(normalizeSpaces(formatPrice({ amount: 99.9 })), "R$ 99,90")
  assert.equal(
    normalizeSpaces(formatCurrencyAmount({ amount: 10, currencyCode: "" })),
    "R$ 10,00"
  )
})

test("structured product prices keep Medusa V2 major units", () => {
  assert.equal(formatMoneyAmountForStructuredData(99.9), "99.90")
  assert.equal(formatMoneyAmountForStructuredData(0.01), "0.01")
  assert.throws(() => formatMoneyAmountForStructuredData(Number.NaN))
})

test("Brazil region resolution never falls back to the first region", () => {
  const usRegion = {
    id: "reg_us",
    name: "United States",
    currency_code: "usd",
    countries: [{ iso_2: "us" }],
  }
  const brRegion = {
    id: "reg_br",
    name: "Brasil",
    currency_code: "brl",
    countries: [{ iso_2: "br" }],
  }

  assert.equal(resolveStoreRegion([usRegion, brRegion]).id, "reg_br")
  assert.equal(getDefaultCountryCode([usRegion, brRegion]), "br")
})

test("country-scoped paths replace foreign prefixes instead of nesting them", () => {
  assert.equal(buildPathWithCountryCode("/us/store", "br"), "/br/store")
  assert.equal(buildPathWithCountryCode("/br/account/orders", "br"), "/br/account/orders")
  assert.equal(buildPathWithCountryCode("/", "br"), "/br")
})

test("invalid or misconfigured Brazil regions fail diagnostically", () => {
  assert.throws(
    () => resolveStoreRegion([], "br"),
    (error) =>
      error instanceof StoreRegionResolutionError &&
      error.message.includes("Brazil storefront region is missing")
  )
  assert.throws(
    () =>
      resolveStoreRegion(
        [
          { id: "reg_br_1", currency_code: "brl", countries: [{ iso_2: "br" }] },
          { id: "reg_br_2", currency_code: "brl", countries: [{ iso_2: "br" }] },
        ],
        "br"
      ),
    (error) =>
      error instanceof StoreRegionResolutionError &&
      error.message.includes("Multiple storefront regions")
  )
  assert.throws(
    () =>
      resolveStoreRegion(
        [{ id: "reg_br", currency_code: "usd", countries: [{ iso_2: "br" }] }],
        "br"
      ),
    (error) =>
      error instanceof StoreRegionResolutionError &&
      error.message.includes("must use currency \"BRL\"")
  )
  assert.throws(
    () =>
      resolveStoreRegion(
        [{ id: "reg_us", currency_code: "usd", countries: [{ iso_2: "us" }] }],
        "us"
      ),
    (error) =>
      error instanceof StoreRegionResolutionError &&
      error.message.includes("Unsupported storefront country code")
  )
})
