import { normalizeRow } from "../normalizer"
import { ParsedRow } from "../types"

describe("Normalizer", () => {
  it("normalizes SKU strings correctly", () => {
    const raw: ParsedRow = { sheetName: "GAS", codigo: " 123 ", descricao: "A", unidade: "UN", quantidade: 1, valor: 10 }
    const result = normalizeRow(raw)
    expect(result.sku).toBe("123")
  })

  it("handles empty or null SKU", () => {
    const raw: ParsedRow = { sheetName: "GAS", codigo: "", descricao: "A", unidade: "UN", quantidade: 1, valor: 10 }
    const result = normalizeRow(raw)
    expect(result.sku).toBe("")
  })

  it("parses Brazilian currency correctly", () => {
    const testCases = [
      { input: "R$ 91,000000", expected: 91.0 },
      { input: "1.595,00", expected: 1595.0 },
      { input: "36,644410", expected: 36.644410 },
      { input: "0,00", expected: 0 },
      { input: "1,00", expected: 1 },
      { input: "R$ 1.234.567,89", expected: 1234567.89 },
      { input: 91.5, expected: 91.5 },
      { input: null, expected: null },
      { input: "invalid", expected: null }
    ]

    for (const tc of testCases) {
      const raw: ParsedRow = { sheetName: "GAS", codigo: "1", descricao: "A", unidade: "UN", quantidade: 1, valor: tc.input as any }
      const result = normalizeRow(raw)
      expect(result.cost).toBe(tc.expected)
    }
  })

  it("classifies cost status correctly", () => {
    const getStatus = (val: any) => normalizeRow({ sheetName: "GAS", codigo: "1", descricao: "A", unidade: "UN", quantidade: 1, valor: val }).costStatus

    expect(getStatus(10)).toBe("VALID")
    expect(getStatus(null)).toBe("MISSING")
    expect(getStatus("")).toBe("MISSING")
    expect(getStatus(-5)).toBe("INVALID")
    expect(getStatus("invalid")).toBe("INVALID")
    expect(getStatus(0)).toBe("ZERO")
    expect(getStatus(1)).toBe("SUSPICIOUS")
  })

  it("parses quantities correctly", () => {
    const getQty = (val: any) => normalizeRow({ sheetName: "GAS", codigo: "1", descricao: "A", unidade: "UN", quantidade: val, valor: 10 }).quantity

    expect(getQty(10)).toBe(10)
    expect(getQty("152,544")).toBe(152.544)
    expect(getQty("193.5")).toBe(193.5)
    expect(getQty(0)).toBe(0)
    expect(getQty(-5)).toBe(-5)
    expect(getQty(null)).toBe(0)
  })
})
