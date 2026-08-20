import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const source = readFileSync(
  new URL("../../src/components/account-shell.tsx", import.meta.url),
  "utf8",
)
const accountRouteSource = readFileSync(
  new URL("../../src/routes/$countryCode/account/index.tsx", import.meta.url),
  "utf8",
)
const ordersRouteSource = readFileSync(
  new URL("../../src/routes/$countryCode/account/orders.tsx", import.meta.url),
  "utf8",
)

test("account shell keeps canonical account links and exposes the saved-products route", () => {
  assert.match(source, /href: "\/\$countryCode\/account\//)
  assert.match(source, /href: "\/\$countryCode\/account\/orders"/)
  assert.match(source, /tab: "profile"/)
  assert.match(source, /tab: "company"/)
  assert.match(source, /href: "\/\$countryCode\/account\/addresses"/)
  assert.match(source, /addressesNavItem/)
  assert.match(source, /\.\.\.\(isAdmin \? \[companyNavItem\] : \[\]\)/)
  assert.match(source, /href: "\/\$countryCode\/favorites"/)
  assert.doesNotMatch(source, /payment_methods/i)
})

test("account shell has explicit desktop sidebar and compact mobile navigation semantics", () => {
  assert.match(source, /data-account-nav-desktop/)
  assert.match(source, /className="hidden w-56 shrink-0 md:block"/)
  assert.match(source, /data-account-nav-mobile/)
  assert.match(source, /className="mb-5 overflow-x-auto md:hidden"/)
  assert.match(source, /aria-label="Account navigation"/)
  assert.match(source, /aria-current=\{active \? "page" : undefined\}/)
})

test("account overview and orders preserve their existing pages inside the shell", () => {
  assert.match(accountRouteSource, /<AccountShell>\s*<SettingsPage \/>\s*<\/AccountShell>/)
  assert.match(ordersRouteSource, /<AccountShell>\s*<OrdersPage \/>\s*<\/AccountShell>/)
  assert.match(accountRouteSource, /normalizeReturnTo/)
  assert.match(ordersRouteSource, /normalizeReturnTo/)
})
