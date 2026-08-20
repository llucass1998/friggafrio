import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { storeLocations } from "../../src/config/store-locations"

test("Nossa Loja exposes exactly one approved active location", () => {
  const activeLocations = storeLocations.filter((location) => location.active)

  assert.equal(activeLocations.length, 1)
  assert.equal(activeLocations[0]?.id, "loja-1")
  assert.equal(activeLocations.some((location) => location.id === "loja-2"), false)
})

test("Nossa Loja uses one consolidated location component without selection UX", () => {
  const pageSource = readFileSync(new URL("../../src/pages/public-stores.tsx", import.meta.url), "utf8")
  const cardSource = readFileSync(new URL("../../src/components/store-locations/StoreLocationCard.tsx", import.meta.url), "utf8")

  assert.match(pageSource, /<StoreLocationCard location=\{activeLocation\} \/>/)
  assert.doesNotMatch(pageSource, /selectedLocationId|map-panel|activeLocations\.map/)
  assert.doesNotMatch(cardSource, /Unidade selecionada|isSelected|onSelect|aria-pressed/)
  assert.doesNotMatch(cardSource, /Place\+ID/)
  assert.match(cardSource, /place_id:/)
  assert.match(cardSource, /GoogleStoreMap/)
  assert.match(cardSource, /StoreStreetView/)
})

test("Street View only renders from verified coordinates", () => {
  const streetViewSource = readFileSync(
    new URL("../../src/components/store-locations/StoreStreetView.tsx", import.meta.url),
    "utf8"
  )

  assert.match(streetViewSource, /Number\.isFinite\(location\.latitude\)/)
  assert.match(streetViewSource, /Number\.isFinite\(location\.longitude\)/)
  assert.match(streetViewSource, /location=\$\{location\.latitude\},\$\{location\.longitude\}/)
  assert.doesNotMatch(streetViewSource, /place_id=/)
})
