import {
  FiscalWritesDisabledError,
  LocalOmieFiscalGateway,
  assertFiscalPayloadSafe,
  buildFiscalOperationPlan,
  canAccessFiscalDocument,
  privateDocumentHeaders,
  reconcileExternalInvoiceState,
  buildFiscalWorkflowDecision,
  fiscalRetryAt,
  persistFiscalProjection,
  toFiscalAdminView,
  toFiscalCustomerView,
  reconcileFiscalTrigger,
  transitionFiscalState,
  validateFiscalOrder,
  type FiscalOrderInput,
  type FiscalState,
} from "."

const validOrder = (): FiscalOrderInput => ({
  medusa_order_id: "order_fiscal_test_1",
  customer: {
    external_id: "cus_fiscal_test_1",
    name: "Customer Fiscal Test",
    document: { type: "CPF", number: "52998224725" },
    address: { address_1: "Rua Fiscal, 1", city: "Sao Paulo", state: "SP", postal_code: "01001000", country_code: "br", ibge_code: "3550308" },
    consumer_final: true,
  },
  items: [{
    sku: "SKU-OMIE-1",
    quantity: 2,
    unit_price: 100,
    discount: 0,
    product: { sku: "SKU-OMIE-1", omie_code: "omie_1", description: "Fiscal product", unit: "UN", ncm: "12345678", origin: 0, cfop: "5102", cst_csosn: "102", tax_scenario: "CENARIO_TESTE" },
  }],
  subtotal: 200,
  shipping: 0,
  total: 200,
  currency_code: "brl",
  payment: { status: "captured", method: "pix", installments: 1, provider_payment_id: "provider_payment_reference" },
  shipping_method: { key: "FRIGGAFRIO_PICKUP_STORE_1", amount: 0, pickup: true, state: "SP" },
})

describe("Omie fiscal local fail-closed workflow", () => {
  it("does not make a pending Pix fiscally eligible", () => {
    const order = validOrder()
    order.payment.status = "pending"
    expect(reconcileFiscalTrigger(order)).toMatchObject({ state: "PAYMENT_PENDING", reason: "payment_pending" })
  })

  it.each(["failed", "canceled", "refunded"] as const)("does not make a %s card/payment fiscally eligible", (status) => {
    const order = validOrder()
    order.payment.status = status
    expect(reconcileFiscalTrigger(order)).toMatchObject({ state: "NOT_ELIGIBLE", reason: "payment_not_confirmed" })
  })

  it("allows a captured Pix/card order only after every fiscal mapping validates", () => {
    expect(validateFiscalOrder(validOrder())).toEqual({ valid: true, status: "FISCAL_READY", issues: [] })
    expect(reconcileFiscalTrigger(validOrder())).toMatchObject({ state: "READY_FOR_FISCAL_SYNC", retryable: true })
  })

  it.each([
    ["NCM", (order: FiscalOrderInput) => { order.items[0].product.ncm = null }, "PRODUCT_NCM_MISSING"],
    ["CFOP", (order: FiscalOrderInput) => { order.items[0].product.cfop = null }, "PRODUCT_CFOP_MISSING"],
    ["CST/CSOSN", (order: FiscalOrderInput) => { order.items[0].product.cst_csosn = null }, "PRODUCT_CST_CSOSN_MISSING"],
    ["Omie code", (order: FiscalOrderInput) => { order.items[0].product.omie_code = "" }, "PRODUCT_OMIE_CODE_MISSING"],
    ["IBGE", (order: FiscalOrderInput) => { order.customer.address.ibge_code = null }, "CUSTOMER_IBGE_MISSING"],
  ] as const)("blocks missing %s configuration", (_label, mutate, expectedCode) => {
    const order = validOrder()
    mutate(order)
    const result = validateFiscalOrder(order)
    expect(result.valid).toBe(false)
    expect(result.status).toBe("FISCAL_DATA_MISSING")
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: expectedCode })]))
    expect(reconcileFiscalTrigger(order).state).toBe("BLOCKED_MISSING_CONFIGURATION")
  })

  it("blocks invalid documents, invalid totals, installments, and pickup amount tampering", () => {
    const order = validOrder()
    order.customer.document.number = "00000000000"
    order.total = -1
    order.payment.installments = 11
    order.shipping_method.amount = 1
    const result = validateFiscalOrder(order)
    expect(result.issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      "CUSTOMER_DOCUMENT_INVALID", "ORDER_TOTAL_INVALID", "INSTALLMENTS_INVALID", "SHIPPING_AMOUNT_MISMATCH",
    ]))
  })

  it("uses an immutable Medusa order reference and stable distinct operation keys", () => {
    const first = buildFiscalOperationPlan(validOrder())
    const second = buildFiscalOperationPlan(validOrder())
    expect(first).toEqual(second)
    expect(first.integrationCode).toBe("FRIGGAFRIO-order_fiscal_test_1")
    expect(new Set(Object.values(first.idempotency)).size).toBe(3)
  })

  it("never permits a local Omie write or remote lookup before homologation is explicitly enabled", async () => {
    const gateway = new LocalOmieFiscalGateway()
    await expect(gateway.findCustomer(validOrder().customer)).rejects.toBeInstanceOf(FiscalWritesDisabledError)
    await expect(gateway.createSalesOrder(validOrder(), "key")).rejects.toBeInstanceOf(FiscalWritesDisabledError)
    await expect(gateway.requestInvoice("omie_order", "key")).rejects.toBeInstanceOf(FiscalWritesDisabledError)
  })

  it("makes repeated and out-of-order external states monotonic", () => {
    expect(transitionFiscalState("SALES_ORDER_CREATED", "SALES_ORDER_CREATED")).toBe("SALES_ORDER_CREATED")
    expect(reconcileExternalInvoiceState("NFE_AUTHORIZED", "INVOICE_PROCESSING")).toBe("NFE_AUTHORIZED")
    expect(reconcileExternalInvoiceState("NFE_CANCELLED", "INVOICE_PROCESSING")).toBe("NFE_CANCELLED")
    expect(() => transitionFiscalState("NFE_AUTHORIZED", "PAYMENT_PENDING")).toThrow("Invalid fiscal state transition")
    expect(transitionFiscalState("BLOCKED_MISSING_CONFIGURATION", "READY_FOR_FISCAL_SYNC")).toBe("READY_FOR_FISCAL_SYNC")
  })

  it("keeps documents private and grants customer access only to the owning order", () => {
    expect(canAccessFiscalDocument({ orderId: "order", customerId: "owner", role: "customer" }, "owner")).toBe(true)
    expect(canAccessFiscalDocument({ orderId: "order", customerId: "other", role: "customer" }, "owner")).toBe(false)
    expect(canAccessFiscalDocument({ orderId: "order", customerId: "admin", role: "admin" }, "owner")).toBe(true)
    expect(privateDocumentHeaders()).toMatchObject({ "cache-control": "private, no-store", "x-content-type-options": "nosniff" })
  })

  it("exposes bounded fiscal views without credentials or raw provider payloads", () => {
    const record = {
      id: "fiscal_1",
      medusa_order_id: "order_1",
      integration_code: "FRIGGAFRIO-order_1",
      state: "NFE_AUTHORIZED" as const,
      environment: "homologation" as const,
      omie_customer_id: "omie_customer_1",
      omie_sales_order_id: "omie_order_1",
      nfe: { nfe_id: "nfe_1", number: "1", series: "1", access_key: "key", authorized_at: null, xml_url: "/private/nfe.xml", danfe_url: "/private/nfe.pdf" },
      attempts: 1,
      last_error: null,
      external_event_id: null,
    }
    expect(toFiscalAdminView(record)).not.toHaveProperty("environment")
    expect(toFiscalAdminView(record)).not.toHaveProperty("omie_customer_id")
    expect(toFiscalCustomerView(record)).toEqual({ order_id: "order_1", state: "NFE_AUTHORIZED", nfe: record.nfe })
  })

  it("rejects payment credentials and card data in any fiscal payload", () => {
    expect(() => assertFiscalPayloadSafe({ card_token: "temporary" })).toThrow("FISCAL_PAYLOAD_CONTAINS_SENSITIVE_FIELD")
    expect(() => assertFiscalPayloadSafe({ token: "temporary" })).toThrow("FISCAL_PAYLOAD_CONTAINS_SENSITIVE_FIELD")
    expect(() => assertFiscalPayloadSafe({ payment: { provider_payment_id: "permitted_reference" } })).not.toThrow()
  })

  it("creates exactly one payment-confirmed outbox intent for a valid order", () => {
    const decision = buildFiscalWorkflowDecision(validOrder())
    expect(decision).toMatchObject({
      state: "READY_FOR_FISCAL_SYNC",
      eventType: "PAYMENT_CONFIRMED_AND_RECONCILED",
      outboxEventKey: "fiscal:FRIGGAFRIO-order_fiscal_test_1:payment-confirmed",
    })
    expect(buildFiscalWorkflowDecision(validOrder())).toEqual(decision)
  })

  it("does not enqueue fiscal work before payment confirmation", () => {
    const order = validOrder()
    order.payment.status = "pending"
    expect(buildFiscalWorkflowDecision(order)).toMatchObject({
      state: "PAYMENT_PENDING",
      eventType: null,
      outboxEventKey: null,
    })
  })

  it("routes payment reversals to fiscal reconciliation without regressing an authorized NF-e", () => {
    const order = validOrder()
    order.payment.status = "refunded"
    expect(reconcileFiscalTrigger(order, "NFE_AUTHORIZED")).toMatchObject({ state: "REFUND_RECONCILIATION_PENDING", reason: "payment_refunded_after_nfe" })
    expect(reconcileFiscalTrigger(order, "SALES_ORDER_CREATED")).toMatchObject({ state: "REFUND_RECONCILIATION_PENDING", reason: "payment_refunded_before_nfe" })
    order.payment.status = "canceled"
    expect(reconcileFiscalTrigger(order, "SALES_ORDER_CREATED")).toMatchObject({ state: "CANCELLATION_PENDING", reason: "payment_canceled_after_sales_order" })
    expect(reconcileFiscalTrigger(order, "NFE_AUTHORIZED")).toMatchObject({ state: "CANCELLATION_PENDING", reason: "payment_canceled_after_sales_order" })
  })

  it("uses bounded exponential retry timestamps", () => {
    const now = 1_000_000
    expect(fiscalRetryAt(0, now).getTime()).toBe(now + 1_000)
    expect(fiscalRetryAt(4, now).getTime()).toBe(now + 16_000)
    expect(fiscalRetryAt(99, now).getTime()).toBe(now + 60 * 60 * 1_000)
  })

  it("persists one fiscal projection and one outbox event across retries", async () => {
    type FiscalRow = { id: string; state: FiscalState; integration_code: string; medusa_order_id?: string }
    type OutboxRow = { id: string; status: string; event_key?: string }
    const fiscalRows: FiscalRow[] = []
    const outboxRows: OutboxRow[] = []
    const stores = {
      fiscalOrders: {
        listFiscalOrders: async () => fiscalRows,
        createFiscalOrders: async (input: Record<string, unknown>) => {
          const row: FiscalRow = { id: "fiscal_1", state: input.state as FiscalState, integration_code: String(input.integration_code), medusa_order_id: String(input.medusa_order_id) }
          fiscalRows.push(row)
          return row
        },
        updateFiscalOrders: async (input: Record<string, unknown>) => {
          const row = fiscalRows[0]
          if (typeof input.state === "string") row.state = input.state as FiscalState
          return row
        },
      },
      outbox: {
        listFiscalOutboxEvents: async (filters: Record<string, unknown>) => outboxRows.filter((row) => row.event_key === filters.event_key),
        createFiscalOutboxEvents: async (input: Record<string, unknown>) => {
          const row: OutboxRow = { id: "outbox_1", status: String(input.status), event_key: String(input.event_key) }
          outboxRows.push(row)
          return row
        },
      },
    }
    const first = await persistFiscalProjection(validOrder(), stores)
    const second = await persistFiscalProjection(validOrder(), stores)
    expect(first).toMatchObject({ state: "READY_FOR_FISCAL_SYNC", duplicate: false, outboxEventId: "outbox_1" })
    expect(second).toMatchObject({ state: "READY_FOR_FISCAL_SYNC", duplicate: true, outboxEventId: "outbox_1" })
    expect(fiscalRows).toHaveLength(1)
    expect(outboxRows).toHaveLength(1)
  })

  it("recovers unique races by re-reading the durable projection and outbox", async () => {
    let fiscalReads = 0
    let outboxReads = 0
    const stores = {
      fiscalOrders: {
        listFiscalOrders: async () => fiscalReads++ === 0 ? [] : [{ id: "fiscal_race", state: "READY_FOR_FISCAL_SYNC" as const, integration_code: "FRIGGAFRIO-order_fiscal_test_1" }],
        createFiscalOrders: async () => { throw new Error("unique constraint") },
        updateFiscalOrders: async () => undefined,
      },
      outbox: {
        listFiscalOutboxEvents: async () => outboxReads++ === 0 ? [] : [{ id: "outbox_race", status: "pending" }],
        createFiscalOutboxEvents: async () => { throw new Error("duplicate key") },
      },
    }
    await expect(persistFiscalProjection(validOrder(), stores)).resolves.toMatchObject({ duplicate: true, fiscalOrderId: "fiscal_race", outboxEventId: "outbox_race" })
  })
})
