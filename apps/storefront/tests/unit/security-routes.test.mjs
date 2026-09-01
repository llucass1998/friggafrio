import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { normalizeReturnTo } from "../../src/lib/auth/return-to.ts"
import { storefrontContentSecurityPolicyReportOnly } from "../../src/lib/security/content-security-policy.ts"

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8")

test("invalid returnTo values fail closed to the active country", () => {
  assert.equal(normalizeReturnTo("https://attacker.example/account", "br"), "/br")
  assert.equal(normalizeReturnTo("/us/account/orders", "br"), "/br")
})

test("account routes guard unauthenticated access and preserve returnTo", () => {
  const account = source("../../src/routes/$countryCode/account/index.tsx")
  const orders = source("../../src/routes/$countryCode/account/orders.tsx")
  const shell = source("../../src/components/account-shell.tsx")
  assert.match(account, /beforeLoad: async \(\) => undefined/)
  assert.match(orders, /beforeLoad: async \(\) => undefined/)
  assert.match(shell, /to: "\/\$countryCode\/account\/login"/)
  assert.match(shell, /search: \{ returnTo: normalizeReturnTo\(currentPath, countryCode\) \}/)
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

test("storefront CSP starts report-only with explicit payment and local development origins", () => {
  const productionPolicy = storefrontContentSecurityPolicyReportOnly(false)
  const developmentPolicy = storefrontContentSecurityPolicyReportOnly(true)

  assert.match(productionPolicy, /https:\/\/sdk\.mercadopago\.com/)
  assert.match(productionPolicy, /https:\/\/api\.mercadopago\.com/)
  assert.match(productionPolicy, /https:\/\/vlibras\.gov\.br/)
  assert.doesNotMatch(productionPolicy, /\*/)
  assert.doesNotMatch(productionPolicy, /unsafe-inline|unsafe-eval/)
  assert.match(developmentPolicy, /http:\/\/127\.0\.0\.1:9000/)
  assert.match(developmentPolicy, /ws:\/\/127\.0\.0\.1:5173/)
})
