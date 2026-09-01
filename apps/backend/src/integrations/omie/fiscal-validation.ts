import type {
  FiscalCustomerInput,
  FiscalOrderInput,
  FiscalProductInput,
  FiscalValidationIssue,
  FiscalValidationResult,
} from "./fiscal-types"

const digits = (value: string): string => value.replace(/\D/g, "")

const validCpf = (value: string): boolean => {
  const input = digits(value)
  if (input.length !== 11 || /^(\d)\1+$/.test(input)) return false
  const check = (length: number): number => {
    let sum = 0
    for (let index = 0; index < length; index += 1) sum += Number(input[index]) * (length + 1 - index)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }
  return check(9) === Number(input[9]) && check(10) === Number(input[10])
}

const validCnpj = (value: string): boolean => {
  const input = digits(value)
  if (input.length !== 14 || /^(\d)\1+$/.test(input)) return false
  const calculate = (length: number): number => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = weights.reduce((total, weight, index) => total + Number(input[index]) * weight, 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  return calculate(12) === Number(input[12]) && calculate(13) === Number(input[13])
}

const issue = (code: FiscalValidationIssue["code"], field: string, message: string): FiscalValidationIssue => ({ code, field, message })

export const validateFiscalCustomer = (customer: FiscalCustomerInput): FiscalValidationIssue[] => {
  const issues: FiscalValidationIssue[] = []
  if (!customer.external_id.trim()) issues.push(issue("CUSTOMER_DOCUMENT_MISSING", "customer.external_id", "Customer integration identifier is required."))
  if (!customer.name.trim()) issues.push(issue("CUSTOMER_NAME_MISSING", "customer.name", "Customer name is required."))
  if (!customer.document.number.trim()) issues.push(issue("CUSTOMER_DOCUMENT_MISSING", "customer.document.number", "CPF or CNPJ is required."))
  else if (customer.document.type === "CPF" ? !validCpf(customer.document.number) : !validCnpj(customer.document.number)) issues.push(issue("CUSTOMER_DOCUMENT_INVALID", "customer.document.number", "CPF or CNPJ is invalid."))
  const address = customer.address
  if (!address.address_1.trim() || !address.city.trim() || !address.state.trim() || !/^\d{8}$/.test(digits(address.postal_code))) issues.push(issue("CUSTOMER_ADDRESS_MISSING", "customer.address", "Complete fiscal address is required."))
  if (!address.ibge_code?.trim()) issues.push(issue("CUSTOMER_IBGE_MISSING", "customer.address.ibge_code", "Municipality IBGE code is required for fiscal issuance."))
  return issues
}

export const validateFiscalProduct = (product: FiscalProductInput): FiscalValidationIssue[] => {
  const issues: FiscalValidationIssue[] = []
  if (!product.sku.trim()) issues.push(issue("PRODUCT_SKU_MISSING", "product.sku", "SKU is required."))
  if (!product.omie_code.trim()) issues.push(issue("PRODUCT_OMIE_CODE_MISSING", "product.omie_code", "Omie product code is required."))
  if (!product.description.trim() || !product.unit.trim()) issues.push(issue("PRODUCT_UNIT_MISSING", "product.unit", "Product description and unit are required."))
  if (!product.ncm?.trim()) issues.push(issue("PRODUCT_NCM_MISSING", "product.ncm", "NCM must be configured in Omie."))
  if (product.origin === null || !Number.isInteger(product.origin) || product.origin < 0 || product.origin > 8) issues.push(issue("PRODUCT_ORIGIN_MISSING", "product.origin", "Fiscal product origin must be configured."))
  if (!product.cfop?.trim()) issues.push(issue("PRODUCT_CFOP_MISSING", "product.cfop", "CFOP must be configured in the fiscal scenario."))
  if (!product.cst_csosn?.trim()) issues.push(issue("PRODUCT_CST_CSOSN_MISSING", "product.cst_csosn", "CST or CSOSN must be configured."))
  if (!product.tax_scenario?.trim()) issues.push(issue("PRODUCT_TAX_SCENARIO_MISSING", "product.tax_scenario", "Tax scenario requires accountant configuration."))
  return issues
}

export const validateFiscalOrder = (order: FiscalOrderInput, environment: "homologation" | "production" = "homologation"): FiscalValidationResult => {
  const issues: FiscalValidationIssue[] = []
  if (!order.medusa_order_id.trim()) issues.push(issue("ORDER_ITEMS_MISSING", "medusa_order_id", "Medusa order identifier is required."))
  if (!['authorized', 'captured'].includes(order.payment.status)) issues.push(issue("PAYMENT_NOT_CONFIRMED", "payment.status", "Only an authorized or captured payment can enter fiscal processing."))
  if (!Array.isArray(order.items) || order.items.length === 0) issues.push(issue("ORDER_ITEMS_MISSING", "items", "At least one fiscal item is required."))
  for (const [index, item] of order.items.entries()) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) issues.push(issue("ORDER_ITEMS_MISSING", `items.${index}.quantity`, "Item quantity must be a positive integer."))
    if (!Number.isFinite(item.unit_price) || item.unit_price < 0 || !Number.isFinite(item.discount) || item.discount < 0) issues.push(issue("ORDER_TOTAL_INVALID", `items.${index}`, "Item prices and discounts must be non-negative numbers."))
    issues.push(...validateFiscalProduct(item.product).map((entry) => ({ ...entry, field: `items.${index}.${entry.field}` })))
  }
  if (!Number.isFinite(order.total) || order.total < 0 || !Number.isFinite(order.subtotal) || order.subtotal < 0 || !Number.isFinite(order.shipping) || order.shipping < 0) issues.push(issue("ORDER_TOTAL_INVALID", "total", "Order totals must be finite and non-negative."))
  if (order.currency_code.toLowerCase() !== "brl") issues.push(issue("ORDER_CURRENCY_INVALID", "currency_code", "Fiscal integration supports BRL only."))
  if (!Number.isSafeInteger(order.payment.installments) || order.payment.installments < 1 || order.payment.installments > 10) issues.push(issue("INSTALLMENTS_INVALID", "payment.installments", "Installments must be between 1 and 10."))
  if (!order.shipping_method.key.trim()) issues.push(issue("SHIPPING_MAPPING_MISSING", "shipping_method.key", "A server-owned shipping mapping is required."))
  if (!Number.isFinite(order.shipping_method.amount) || order.shipping_method.amount < 0) issues.push(issue("SHIPPING_AMOUNT_MISMATCH", "shipping_method.amount", "Shipping amount is invalid."))
  if (order.shipping_method.pickup && order.shipping_method.amount !== 0) issues.push(issue("SHIPPING_AMOUNT_MISMATCH", "shipping_method.amount", "Store pickup must be zero-priced."))
  issues.push(...validateFiscalCustomer(order.customer))
  const status = issues.some((entry) => entry.code.includes("MISSING") || entry.code.includes("SCENARIO") || entry.code.includes("CST") || entry.code.includes("NCM") || entry.code.includes("CFOP") || entry.code.includes("IBGE"))
    ? "FISCAL_DATA_MISSING"
    : issues.some((entry) => entry.code === "PAYMENT_NOT_CONFIRMED") ? "ACCOUNTANT_REVIEW_REQUIRED"
      : issues.some((entry) => entry.code.includes("TOTAL") || entry.code.includes("CURRENCY") || entry.code.includes("INSTALLMENTS")) ? "PRICE_INVALID"
        : "FISCAL_READY"
  if (environment === "production") issues.push(issue("NFE_PRODUCTION_BLOCKED", "environment", "Production NF-e is disabled by the local fail-closed policy."))
  return { valid: issues.length === 0, status: issues.length === 0 ? "FISCAL_READY" : status, issues }
}
