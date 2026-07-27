import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/types"
import orderPlacedHandler from "../order-placed"

describe("orderPlacedHandler", () => {
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
      event: { data: { id: "order_12345" }, name: "order.placed" },
      // INEVITÁVEL: cast para simular a interface completa MedusaContainer usando apenas resolve mockado
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await orderPlacedHandler(args)

    expect(mockLogger.info).toHaveBeenCalledWith(
      "[Notifications] Handling 'order.placed' event for order: order_12345"
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it("should warn and return early when event payload is null", async () => {
    const args = {
      // INEVITÁVEL: forçar erro estrutural em tipo estrito de dados do Medusa via null payload
      event: { data: null as unknown as { id: string }, name: "order.placed" },
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await orderPlacedHandler(args)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      "[Notifications] Handling 'order.placed' failed: Invalid event data structure. Data: null"
    )
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it("should warn and return early when event payload lacks id", async () => {
    const args = {
      // INEVITÁVEL: forçar erro estrutural faltando `id` no payload estrito
      event: { data: { some_other_field: 123 } as unknown as { id: string }, name: "order.placed" },
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await orderPlacedHandler(args)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      `[Notifications] Handling 'order.placed' failed: Invalid event data structure. Data: {"some_other_field":123}`
    )
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it("should warn and return early when id is not a string", async () => {
    const args = {
      // INEVITÁVEL: forçar tipagem incorreta do atributo id no payload estrito
      event: { data: { id: 123 } as unknown as { id: string }, name: "order.placed" },
      container: mockContainer as unknown as MedusaContainer,
      pluginOptions: {},
    }

    await orderPlacedHandler(args)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      `[Notifications] Handling 'order.placed' failed: Invalid event data structure. Data: {"id":123}`
    )
    expect(mockLogger.info).not.toHaveBeenCalled()
  })
})