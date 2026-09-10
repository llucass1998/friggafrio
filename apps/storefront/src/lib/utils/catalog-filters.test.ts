import assert from "node:assert/strict"
import test from "node:test"
import {
  normalizeCatalogFilters,
  normalizeCatalogPriceRange,
  normalizeFilterValues,
} from "@/lib/utils/catalog-filters"

test("catalog filter values are deduplicated across repeated and comma-delimited params", () => {
  assert.deepEqual(normalizeFilterValues(["eos,danfoss", "eos", " danfoss "]), ["eos", "danfoss"])
})

test("catalog price ranges accept isolated bounds and reject inverted bounds", () => {
  assert.deepEqual(normalizeCatalogPriceRange("10", ""), { price_min: 10 })
  assert.deepEqual(normalizeCatalogPriceRange("100", "10"), {})
  assert.deepEqual(normalizeCatalogPriceRange("-1", "50"), { price_max: 50 })
  assert.deepEqual(normalizeCatalogPriceRange("R$ 1.234,56", "2.000,00"), { price_min: 1234.56, price_max: 2000 })
})

test("catalog filters have a stable canonical shape", () => {
  assert.deepEqual(normalizeCatalogFilters({
    q: "  R22  ",
    brand: ["eos", "eos"],
    option_value_id: "220v,220v",
    promotion: true,
    price_min: 5.129,
  }), {
    q: "R22",
    brand: ["eos"],
    option_value_id: ["220v"],
    promotion: true,
    price_min: 5.13,
  })
})
