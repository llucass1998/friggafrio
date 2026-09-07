import assert from "node:assert/strict"
import test from "node:test"
import type { HttpTypes } from "@medusajs/types"
import { selectFeaturedInventoryProducts, selectHomeProducts } from "@/lib/data/home-products"

const product = (id: string, category: string): HttpTypes.StoreProduct => ({
  id,
  title: id,
  handle: id,
  thumbnail: `/images/${id}.webp`,
  categories: [{ id: `cat_${category}`, handle: category }],
  variants: [{
    id: `variant_${id}`,
    manage_inventory: true,
    allow_backorder: false,
    inventory_quantity: 1,
    calculated_price: { calculated_amount: 10 },
  }],
}) as HttpTypes.StoreProduct

test("maintenance shelf accepts its dedicated category candidates", () => {
  const dedicatedMaintenanceCandidate = product("maintenance-item", "componentes")
  const specializedProducts = selectHomeProducts([product("specialized-item", "compressores")], "specialized")

  const maintenanceProducts = selectHomeProducts([dedicatedMaintenanceCandidate], "maintenance", {
    excludeIds: new Set(specializedProducts.map((item) => item.id)),
  })

  assert.deepEqual(maintenanceProducts.map((item) => item.id), ["maintenance-item"])
})

test("specialized shelf does not consume maintenance candidates", () => {
  const specialized = product("specialized-item", "compressores")
  const maintenance = product("maintenance-item", "componentes")

  const selected = selectHomeProducts([specialized, maintenance], "specialized")

  assert.deepEqual(selected.map((item) => item.id), [specialized.id])
})

test("ready shelf excludes products already shown by other Home shelves", () => {
  const reserved = product("reserved", "componentes")
  const available = product("available", "compressores")

  const selected = selectFeaturedInventoryProducts([reserved, available], {
    excludeIds: new Set([reserved.id]),
  })

  assert.deepEqual(selected.map((item) => item.id), ["available"])
})

test("ready shelf keeps purchasable products when an image is absent", () => {
  const item = product("without-image", "outros")
  item.thumbnail = null
  item.images = []

  assert.deepEqual(selectFeaturedInventoryProducts([item]).map((entry) => entry.id), ["without-image"])
})

test("the three Home shelves keep distinct purchasable products", () => {
  const generalCandidates = Array.from({ length: 11 }, (_, index) =>
    product(`general-${index + 1}`, index === 0 ? "compressores" : "outros"),
  )
  const maintenance = product("maintenance", "componentes")

  const specializedProducts = selectHomeProducts([...generalCandidates, maintenance], "specialized")
  const maintenanceProducts = selectHomeProducts([maintenance], "maintenance", {
    excludeIds: new Set(specializedProducts.map((item) => item.id)),
  })
  const readyProducts = selectFeaturedInventoryProducts([...generalCandidates, maintenance], {
    excludeIds: new Set([
      ...specializedProducts.map((item) => item.id),
      ...maintenanceProducts.map((item) => item.id),
    ]),
  })

  assert.equal(specializedProducts.length, 10)
  assert.deepEqual(maintenanceProducts.map((item) => item.id), ["maintenance"])
  assert.deepEqual(readyProducts.map((item) => item.id), ["general-11"])
})
