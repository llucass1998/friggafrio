import assert from "node:assert/strict"
import test from "node:test"
import {
  FAVORITES_STORAGE_KEY,
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

test("toggleFavoriteId adds and removes a product id", () => {
  assert.deepEqual(toggleFavoriteId([], "prod-1"), ["prod-1"])
  assert.deepEqual(toggleFavoriteId(["prod-1", "prod-2"], "prod-1"), ["prod-2"])
  assert.deepEqual(toggleFavoriteId(["prod-1"], "  "), ["prod-1"])
})
