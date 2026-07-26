import { test } from "node:test"
import assert from "node:assert"
import { storeLocations } from "../../src/config/store-locations.ts"
import { showcaseSlides } from "../../src/components/home/product-showcase-carousel/carousel-data.ts"

test("Existe apenas um objeto publico de loja", () => {
  assert.strictEqual(storeLocations.length, 1, "There should be exactly one store")
})

test("Loja 2 nao existe na configuracao", () => {
  const hasLoja2 = storeLocations.some(l => l.id === "loja-2" || l.shortName === "Loja 2")
  assert.strictEqual(hasLoja2, false, "Loja 2 should not exist")
})

test("Loja 1 nao aparece como texto", () => {
  const store = storeLocations[0]
  assert.strictEqual(store.shortName, "Loja")
  assert.strictEqual(store.name, "FriggaFrio")
})

test("Slide inicial e deterministico (não usa random)", () => {
  assert.strictEqual(showcaseSlides.length > 0, true)
  assert.strictEqual(showcaseSlides[0].id, "cobre") // A simple check that data is static
})
