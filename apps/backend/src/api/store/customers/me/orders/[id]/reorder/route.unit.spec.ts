import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { POST } from "./route"

jest.mock("../../../../../../../workflows/reorder", () => ({
  reorderWorkflow: { run: jest.fn() },
}))

const response = () => ({
  json: jest.fn(),
})

const request = (order: Record<string, unknown> | undefined, actorId?: string) => ({
  params: { id: "order_1" },
  auth_context: actorId ? { actor_id: actorId } : undefined,
  scope: {
    resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY
      ? { graph: jest.fn().mockResolvedValue({ data: order ? [order] : [] }) }
      : undefined,
  },
})

describe("customer reorder authorization boundary", () => {
  it("rejects unauthenticated requests before loading an order", async () => {
    await expect(POST(request({ id: "order_1" }) as never, response() as never))
      .rejects.toMatchObject({ type: "unauthorized" })
  })

  it("rejects an order belonging to another customer", async () => {
    await expect(POST(request({ id: "order_1", customer_id: "customer_a" }, "customer_b") as never, response() as never))
      .rejects.toMatchObject({ type: "unauthorized" })
  })

  it("rejects canceled orders before creating a reorder cart", async () => {
    await expect(POST(request({ id: "order_1", customer_id: "customer_a", status: "canceled" }, "customer_a") as never, response() as never))
      .rejects.toMatchObject({ type: "invalid_data" })
  })
})
