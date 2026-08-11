import assert from "node:assert/strict"
import test from "node:test"
import { storeLocations } from "../../src/config/store-locations"

test("Nossa Loja exposes exactly one approved active location", () => {
  const activeLocations = storeLocations.filter((location) => location.active)

  assert.equal(activeLocations.length, 1)
  assert.equal(activeLocations[0]?.id, "loja-1")
  assert.equal(activeLocations.some((location) => location.id === "loja-2"), false)
})
