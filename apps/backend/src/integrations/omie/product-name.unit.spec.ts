import { normalizeProductDisplayName } from "./product-name"

describe("normalizeProductDisplayName", () => {
  const protectedTerms = ["CFM", "2.5/8S", "AGT67", "MS-100", "R410A"]

  it("uses Portuguese sentence case while preserving technical terms", () => {
    expect(normalizeProductDisplayName("BOMBA DE VACUO DUPLO ESTAGIO 12 CFM", protectedTerms))
      .toBe("Bomba de vácuo duplo estágio 12 CFM")
    expect(normalizeProductDisplayName("VALVULA ESFERA 2.5/8S AGT67", protectedTerms))
      .toBe("Válvula esfera 2.5/8S AGT67")
    expect(normalizeProductDisplayName("MANIFOLD DIGITAL MS-100 PLUS", protectedTerms))
      .toBe("Manifold digital MS-100 Plus")
  })

  it("is deterministic, idempotent, and safe for empty input", () => {
    const value = normalizeProductDisplayName("  VALVULA   R410A  ", protectedTerms)
    expect(value).toBe("Válvula R410A")
    expect(normalizeProductDisplayName(value, protectedTerms)).toBe(value)
    expect(normalizeProductDisplayName("", protectedTerms)).toBe("")
  })
})
