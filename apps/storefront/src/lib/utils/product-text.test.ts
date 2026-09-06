import assert from "node:assert/strict"
import test from "node:test"
import { decodeProductText, normalizeProductDisplayName } from "@/lib/utils/product-text"

test("normalizes all-caps catalog titles without changing technical codes", () => {
  assert.equal(normalizeProductDisplayName("BOMBA DE VACUO DUPLO ESTAGIO 12 CFM"), "Bomba de vácuo duplo estágio 12 CFM")
  assert.equal(normalizeProductDisplayName("VALVULA ESFERA 2.5/8S AGT67"), "Válvula esfera 2.5/8S AGT67")
  assert.equal(normalizeProductDisplayName("MANIFOLD DIGITAL MS-100 PLUS"), "Manifold digital MS-100 Plus")
  assert.equal(decodeProductText("R410A &amp; VALVULA"), "R410A & válvula")
})
