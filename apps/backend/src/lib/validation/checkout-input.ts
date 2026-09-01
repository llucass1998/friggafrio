import { isValidCnpj, isValidCpf, normalizeDocument } from "./document"

export type CheckoutCustomerInput = {
  person_type?: unknown
  document?: unknown
  legal_name?: unknown
}

export type CheckoutInputError = { code: string; field: string; message: string }

const text = (value: unknown): string => typeof value === "string" ? value.trim() : ""

export const validateCheckoutCustomerInput = (input: CheckoutCustomerInput): CheckoutInputError[] => {
  const personType = text(input.person_type)
  const document = normalizeDocument(text(input.document))
  const legalName = text(input.legal_name)
  const errors: CheckoutInputError[] = []
  if (personType !== "individual" && personType !== "business") {
    errors.push({ code: "INVALID_PERSON_TYPE", field: "customer.person_type", message: "Person type is invalid." })
  } else if (personType === "individual" && !isValidCpf(document)) {
    errors.push({ code: "INVALID_CPF", field: "customer.document", message: "Informe um CPF válido." })
  } else if (personType === "business" && !isValidCnpj(document)) {
    errors.push({ code: "INVALID_CNPJ", field: "customer.document", message: "Informe um CNPJ válido." })
  }
  if (personType === "business" && (legalName.length < 2 || legalName.length > 120)) {
    errors.push({ code: "INVALID_LEGAL_NAME", field: "customer.legal_name", message: "Legal name is invalid." })
  }
  return errors
}
