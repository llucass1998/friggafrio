import assert from "node:assert/strict"
import test from "node:test"
import { buildCatalogSearchQuery } from "@/lib/utils/catalog-query"

test("catalog search query omits empty filters and preserves availability", () => {
  assert.deepEqual(buildCatalogSearchQuery({
    regionId: " reg_br ",
    limit: 24,
    offset: 0,
    filters: {
      availability: "in_stock",
      option_value_id: ["", "  "],
      category_id: "",
      brand: ["collection_1", ""],
      q: "  ",
    },
  }), {
    region_id: "reg_br",
    limit: "24",
    offset: "0",
    availability: "in_stock",
    brand: "collection_1",
  })
})
