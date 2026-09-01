import { POST } from "./route"

const response = () => {
  const result = { statusCode: 200, payload: undefined as unknown }
  return {
    status(code: number) { result.statusCode = code; return this },
    json(payload: unknown) { result.payload = payload; return this },
    get statusCode() { return result.statusCode },
    get payload() { return result.payload },
  }
}

describe("newsletter unsubscribe", () => {
  it("marks the subscription cancelled without accepting an email from the browser", async () => {
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{ id: "sub_1", status: "active", email: "ana@example.com" }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token: "a".repeat(32) }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ status: "unsubscribed" })
    expect(service.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({ id: "sub_1", status: "unsubscribed" }))
  })

  it("is idempotent after the local status is already cancelled", async () => {
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{ id: "sub_1", status: "unsubscribed", email: "ana@example.com" }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token: "a".repeat(32) }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(service.updateNewsletterSubscriptions).not.toHaveBeenCalled()
  })
})
