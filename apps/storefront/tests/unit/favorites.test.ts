import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  FAVORITES_STORAGE_KEY,
  customerFavoritesStorageKey,
  mergeFavoriteIds,
  parseFavoriteIds,
  toggleFavoriteId,
} from "../../src/lib/hooks/use-favorites.ts"

test("favorites use the storefront localStorage contract", () => {
  assert.equal(FAVORITES_STORAGE_KEY, "friggafrio:favorites")
})

test("favorite ids parse safely and remove duplicates", () => {
  assert.deepEqual(
    parseFavoriteIds(JSON.stringify(["prod-1", " prod-1 ", "", 42, "prod-2"])),
    ["prod-1", "prod-2"],
  )
  assert.deepEqual(parseFavoriteIds("not-json"), [])
  assert.deepEqual(parseFavoriteIds(JSON.stringify({ id: "prod-1" })), [])
})

test("customer favorites use an isolated storage bucket and merge without duplicates", () => {
  assert.equal(customerFavoritesStorageKey("cus_123"), "friggafrio:favorites:cus_123")
  assert.deepEqual(
    mergeFavoriteIds(["prod-1", "prod-2"], [" prod-2 ", "prod-3"], [""]),
    ["prod-1", "prod-2", "prod-3"],
  )
})

test("toggleFavoriteId adds and removes a product id", () => {
  assert.deepEqual(toggleFavoriteId([], "prod-1"), ["prod-1"])
  assert.deepEqual(toggleFavoriteId(["prod-1", "prod-2"], "prod-1"), ["prod-2"])
  assert.deepEqual(toggleFavoriteId(["prod-1"], "  "), ["prod-1"])
})

test("authenticated removal accepts the idempotent 204 wishlist response", () => {
  const source = readFileSync(resolve(process.cwd(), "src/lib/hooks/use-favorites.ts"), "utf8")
  assert.match(source, /method: "DELETE"[\s\S]*headers: \{ accept: "\*\/\*" \}/)
})

test("authenticated cards share one in-flight wishlist synchronization", () => {
  const source = readFileSync(resolve(process.cwd(), "src/lib/hooks/use-favorites.ts"), "utf8")
  assert.match(source, /const wishlistSyncRequests = new Map/)
  assert.match(source, /const existing = wishlistSyncRequests\.get\(customerId\)/)
})

test("favorite button prevents nested product links from navigating", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/favorite-button.tsx"), "utf8")
  assert.match(source, /event\.preventDefault\(\)/)
  assert.match(source, /event\.stopPropagation\(\)/)
})
