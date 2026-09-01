import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { POST } from "./route"

const responseOf = () => {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) { response.statusCode = code; return response },
    json(payload: unknown) { response.payload = payload; return response },
  }
  return response
}

describe("admin pickup status", () => {
  it("marks a pickup ready and records the operator", async () => {
    const updateOrders = jest.fn().mockResolvedValue([{ id: "order_1", metadata: { frigga_pickup_status: "ready_for_pickup" } }])
    const query = { graph: jest.fn().mockResolvedValue({ data: [{ id: "order_1", metadata: { frigga_fulfillment_mode: "pickup", frigga_pickup_status: "awaiting_preparation" }, shipping_methods: [] }] }) }
    const raw = jest.fn()
    const scope = { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : key === Modules.ORDER ? { updateOrders } : key === ContainerRegistrationKeys.PG_CONNECTION ? { transaction: async (handler: (transaction: unknown) => Promise<unknown>) => handler({ raw }) } : undefined }
    const response = responseOf()
    await POST({ params: { id: "order_1" }, body: { status: "ready_for_pickup" }, auth_context: { actor_id: "admin_1" }, scope } as never, response as never)
    expect(updateOrders).toHaveBeenCalledWith([{ id: "order_1", metadata: expect.objectContaining({ frigga_pickup_status: "ready_for_pickup", frigga_pickup_ready_by: "admin_1" }) }])
    expect(raw).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock(hashtext(?))", ["pickup-status:order_1"])
    expect(response.statusCode).toBe(200)
  })

  it("rejects a duplicate transition before touching the order module", async () => {
    const updateOrders = jest.fn()
    const query = { graph: jest.fn().mockResolvedValue({ data: [{ id: "order_1", metadata: { frigga_fulfillment_mode: "pickup", frigga_pickup_status: "ready_for_pickup" }, shipping_methods: [] }] }) }
    const scope = { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : key === Modules.ORDER ? { updateOrders } : key === ContainerRegistrationKeys.PG_CONNECTION ? { transaction: async (handler: (transaction: unknown) => Promise<unknown>) => handler({ raw: jest.fn() }) } : undefined }
    await expect(POST({ params: { id: "order_1" }, body: { status: "ready_for_pickup" }, auth_context: { actor_id: "admin_1" }, scope } as never, responseOf() as never)).rejects.toThrow("Invalid pickup status transition")
    expect(updateOrders).not.toHaveBeenCalled()
  })
})
