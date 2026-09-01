import { GET } from "./route"

const response = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

describe("store auth status", () => {
  it("treats an anonymous visitor as a successful unauthenticated state", async () => {
    const res = response()
    await GET({} as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ authenticated: false, actor: null })
  })

  it("returns only the allowed customer actor hint", async () => {
    const res = response()
    await GET({ auth_context: { actor_type: "customer", actor_id: "cus_1" } } as never, res as never)
    expect(res.body).toEqual({ authenticated: true, actor: "customer" })
  })

  it("returns the fixed Admin redirect without exposing session data", async () => {
    const res = response()
    await GET({ auth_context: { actor_type: "user", actor_id: "user_1" } } as never, res as never)
    expect(res.body).toEqual({ authenticated: true, actor: "user", redirect_to: "/app" })
  })
})
