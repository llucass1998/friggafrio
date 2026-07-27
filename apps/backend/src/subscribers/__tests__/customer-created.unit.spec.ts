import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/types"
import customerCreatedHandler from "../customer-created"

describe("customerCreatedHandler", () => {
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
      event: { data: { id: "cus_12345" }, name: "customer.created" },
      // INEVITÁVEL: cast para simular a interface completa MedusaContainer usando apenas resolve mockado
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await customerCreatedHandler(args)

    expect(mockLogger.info).toHaveBeenCalledWith(
      "[Notifications] Handling 'customer.created' event for customer: cus_12345"
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it("should warn and return early when event payload is null", async () => {
    const args = {
      // INEVITÁVEL: forçar erro estrutural em tipo estrito de dados do Medusa via null payload
      event: { data: null as unknown as { id: string }, name: "customer.created" },
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await customerCreatedHandler(args)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      "[Notifications] Handling 'customer.created' failed: Invalid event data structure. Data: null"
    )
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it("should warn and return early when event payload lacks id", async () => {
    const args = {
      // INEVITÁVEL: forçar erro estrutural faltando `id` no payload estrito
      event: { data: { other: "data" } as unknown as { id: string }, name: "customer.created" },
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await customerCreatedHandler(args)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      `[Notifications] Handling 'customer.created' failed: Invalid event data structure. Data: {"other":"data"}`
    )
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it("should warn and return early when id is empty", async () => {
    const args = {
      event: { data: { id: "   " }, name: "customer.created" },
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await customerCreatedHandler(args)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      `[Notifications] Handling 'customer.created' failed: Invalid event data structure. Data: {"id":"   "}`
    )
    expect(mockLogger.info).not.toHaveBeenCalled()
  })
})