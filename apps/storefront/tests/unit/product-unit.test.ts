import assert from "node:assert/strict"
import test from "node:test"
import { getProductUnit, getProductUnitSuffix, getProductDisplayCode } from "../../src/lib/utils/product-unit"
import type { HttpTypes } from "@medusajs/types"

test("getProductUnit extracts and normalizes unit from metadata", () => {
  assert.equal(getProductUnit({ metadata: { unit: "kg" } } as unknown as HttpTypes.StoreProduct), "KG")
  assert.equal(getProductUnit({ metadata: { unidade: "m" } } as unknown as HttpTypes.StoreProduct), "M")
  assert.equal(getProductUnit({ metadata: { unidade_medida: "pc" } } as unknown as HttpTypes.StoreProduct), "PC")
  assert.equal(getProductUnit({ metadata: {} } as unknown as HttpTypes.StoreProduct), null)
  assert.equal(getProductUnit(null), null)
})

test("getProductUnitSuffix appends unit suffix only for linear length, not for weight or volume", () => {
  assert.equal(getProductUnitSuffix({ metadata: { unit: "KG" } } as unknown as HttpTypes.StoreProduct), "")
  assert.equal(getProductUnitSuffix({ metadata: { unit: "KILO" } } as unknown as HttpTypes.StoreProduct), "")
  assert.equal(getProductUnitSuffix({ metadata: { unit: "QUILO" } } as unknown as HttpTypes.StoreProduct), "")
  assert.equal(getProductUnitSuffix({ metadata: { unit: "L" } } as unknown as HttpTypes.StoreProduct), "")
  assert.equal(getProductUnitSuffix({ metadata: { unit: "LT" } } as unknown as HttpTypes.StoreProduct), "")
  assert.equal(getProductUnitSuffix({ metadata: { unit: "LITRO" } } as unknown as HttpTypes.StoreProduct), "")
  assert.equal(getProductUnitSuffix({ metadata: { unit: "M" } } as unknown as HttpTypes.StoreProduct), " / m")
  assert.equal(getProductUnitSuffix({ metadata: { unit: "MT" } } as unknown as HttpTypes.StoreProduct), " / m")
  assert.equal(getProductUnitSuffix({ metadata: { unit: "PC" } } as unknown as HttpTypes.StoreProduct), "")
  assert.equal(getProductUnitSuffix({ metadata: { unit: "UN" } } as unknown as HttpTypes.StoreProduct), "")
  assert.equal(getProductUnitSuffix(null), "")
})

test("getProductDisplayCode prioritizes real Omie code over fallback numeric SKU", () => {
  const withOmieCode = {
    metadata: { omie_code: "HTAB2528", omie_external_id: "5610699244" },
    variants: [{ sku: "5610699244" }],
  } as unknown as HttpTypes.StoreProduct
  assert.equal(getProductDisplayCode(withOmieCode, "5610699244"), "HTAB2528")

  const withoutOmieCode = {
    metadata: { omie_external_id: "5610699244" },
    variants: [{ sku: "5610699244" }],
  } as unknown as HttpTypes.StoreProduct
  assert.equal(getProductDisplayCode(withoutOmieCode, "5610699244"), "5610699244")

  const withVariantOnly = {
    variants: [{ sku: "VBCV9058" }],
  } as unknown as HttpTypes.StoreProduct
  assert.equal(getProductDisplayCode(withVariantOnly), "VBCV9058")
})
