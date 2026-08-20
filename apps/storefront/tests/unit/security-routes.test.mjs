import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { normalizeReturnTo } from "../../src/lib/auth/return-to.ts"

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8")

test("invalid returnTo values fail closed to the active country", () => {
  assert.equal(normalizeReturnTo("https://attacker.example/account", "br"), "/br")
  assert.equal(normalizeReturnTo("/us/account/orders", "br"), "/br")
})

test("account routes guard unauthenticated access and preserve returnTo", () => {
  const account = source("../../src/routes/$countryCode/account/index.tsx")
  const orders = source("../../src/routes/$countryCode/account/orders.tsx")
  assert.match(account, /beforeLoad: async \(\{ params, search \}\)/)
  assert.match(orders, /beforeLoad: async \(\{ params, search \}\)/)
  assert.match(account, /search: \{ returnTo \}/)
  assert.match(orders, /search: \{ returnTo \}/)
  assert.match(account, /normalizeReturnTo/)
  assert.match(orders, /normalizeReturnTo/)
})

test("customer queries stay disabled until authentication is established", () => {
  const orders = source("../../src/lib/hooks/use-orders.ts")
  const quotes = source("../../src/lib/hooks/use-quotes.ts")
  assert.match(orders, /enabled: isAuthenticated && !isLoading/)
  assert.match(quotes, /enabled: isAuthenticated && !isLoading/)
})

test("setup links use the canonical account tab route", () => {
  const setup = source("../../../backend/src/api/store/company/setup-status/route.ts")
  const checkout = source("../../src/pages/checkout.tsx")
  assert.doesNotMatch(setup, /\/settings\?tab=/)
  assert.doesNotMatch(checkout, /\/settings\?tab=/)
  assert.match(setup, /\/account\?tab=addresses/)
  assert.match(checkout, /\/account\/addresses/)
})
