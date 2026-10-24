import orderPlacedHandler from "./order-placed"
import { exportMedusaOrderToOmieWorkflow } from "../workflows/omie"

jest.mock("../workflows/omie", () => ({
  exportMedusaOrderToOmieWorkflow: jest.fn(() => ({ run: jest.fn().mockResolvedValue({}) })),
}))

describe("Order Placed Subscriber", () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  const container = {
    resolve: () => logger,
  }

  it("triggers exportMedusaOrderToOmieWorkflow when order.placed event is received", async () => {
    await orderPlacedHandler({
      event: {
        name: "order.placed",
        data: { id: "order_test_123" },
      },
      pluginOptions: {},
      container: container as never,
    })

    expect(exportMedusaOrderToOmieWorkflow).toHaveBeenCalledWith(container)
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("order_test_123"),
    )
  })
})
