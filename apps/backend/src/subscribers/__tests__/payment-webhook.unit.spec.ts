import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/types"
import paymentWebhookReceivedHandler from "../payment-webhook"

describe("paymentWebhookReceivedHandler", () => {
  let mockLogger: {
    info: jest.Mock
    warn: jest.Mock
  }
  let mockContainer: {
    resolve: jest.Mock
  }

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
    }

    mockContainer = {
      resolve: jest.fn().mockImplementation((key) => {
        if (key === ContainerRegistrationKeys.LOGGER) return mockLogger
        return undefined
      }),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should handle valid event payload successfully", async () => {
    const args = {
      event: { data: { payload: { some: "data" } }, name: "mercado-pago.webhook.received" },
      // INEVITÁVEL: cast para simular a interface completa MedusaContainer usando apenas resolve mockado
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await paymentWebhookReceivedHandler(args)

    expect(mockLogger.info).toHaveBeenCalledWith(
      "[Payment] Webhook Received asynchronously for payload processing"
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it("should warn and return early when event payload is null", async () => {
    const args = {
      // INEVITÁVEL: forçar erro estrutural em tipo estrito de dados do Medusa via null payload
      event: { data: null as unknown as { payload: unknown }, name: "mercado-pago.webhook.received" },
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await paymentWebhookReceivedHandler(args)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      "[Payment] Webhook Received failed: Invalid event data structure. Data: null"
    )
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it("should warn and return early when event data has no payload key", async () => {
    const args = {
      // INEVITÁVEL: forçar erro estrutural faltando a key esperada
      event: { data: { anything_else: "abc" } as unknown as { payload: unknown }, name: "mercado-pago.webhook.received" },
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await paymentWebhookReceivedHandler(args)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      `[Payment] Webhook Received failed: Invalid event data structure. Data: {"anything_else":"abc"}`
    )
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it("should handle valid event payload when payload is null", async () => {
    const args = {
      event: { data: { payload: null }, name: "mercado-pago.webhook.received" },
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await paymentWebhookReceivedHandler(args)

    expect(mockLogger.info).toHaveBeenCalledWith(
      "[Payment] Webhook Received asynchronously for payload processing"
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })
})