import { isValidCpf, isValidCnpj, normalizeDocument } from "../../lib/validation/document"

describe("Document validation", () => {
  it("should normalize documents correctly", () => {
    expect(normalizeDocument("123.456.789-00")).toBe("12345678900")
    expect(normalizeDocument("12.345.678/0001-90")).toBe("12345678000190")
  })

  it("should reject invalid CPFs", () => {
    expect(isValidCpf("11111111111")).toBe(false)
    expect(isValidCpf("12345678900")).toBe(false)
  })

  it("should reject invalid CNPJs", () => {
    expect(isValidCnpj("11111111111111")).toBe(false)
    expect(isValidCnpj("12345678000100")).toBe(false)
  })
})
