import { GET } from "./route"

const response = () => {
  const result = { statusCode: 0, body: undefined as unknown, status: jest.fn(), json: jest.fn() }
  result.status.mockImplementation((code: number) => {
    result.statusCode = code
    return result
  })
  result.json.mockImplementation((body: unknown) => {
    result.body = body
    return result
  })
  return result
}

describe("store auth session validation", () => {
  it("returns the admin destination only for a user actor", async () => {
    const adminResponse = response()
    await GET({ auth_context: { actor_type: "user" } } as never, adminResponse as never)
    expect(adminResponse.body).toEqual({ authenticated: true, redirect_to: "/app" })

    const customerResponse = response()
    await GET({ auth_context: { actor_type: "customer" } } as never, customerResponse as never)
    expect(customerResponse.body).toEqual({ authenticated: true, redirect_to: null })
  })
})
