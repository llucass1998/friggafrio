import { validateCheckoutCustomerInput } from "./checkout-input"

describe("checkout customer input validation", () => {
  it("accepts a valid CPF payload", () => {
    expect(validateCheckoutCustomerInput({
      person_type: "individual",
      document: "529.982.247-25",
    })).toEqual([])
  })

  it("rejects letters and invalid check digits", () => {
    expect(validateCheckoutCustomerInput({
      person_type: "individual",
      document: "abc52998224724",
    }).map((error) => error.code)).toContain("INVALID_CPF")
  })

  it("requires a CNPJ and legal name for businesses", () => {
    expect(validateCheckoutCustomerInput({
      person_type: "business",
      document: "04.252.011/0001-10",
    }).map((error) => error.code)).toContain("INVALID_LEGAL_NAME")
  })
})
