import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GET } from "./route"

const ping = jest.fn()
const connect = jest.fn()
const disconnect = jest.fn()

jest.mock("ioredis", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ on: jest.fn(), connect, ping, disconnect })),
}))

const response = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((statusCode: number) => { result.statusCode = statusCode; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

describe("readiness", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.REDIS_URL = "redis://127.0.0.1:56480"
    connect.mockResolvedValue(undefined)
    ping.mockResolvedValue("PONG")
  })

  it("reports ready only when database and Redis are available", async () => {
    const scope = { resolve: (key: unknown) => key === ContainerRegistrationKeys.PG_CONNECTION ? { raw: jest.fn().mockResolvedValue(1) } : undefined }
    const res = response()
    await GET({ scope } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ status: "ready", checks: { database: "up", redis: "up" } })
  })

  it("fails closed and identifies Redis as down without leaking provider details", async () => {
    ping.mockRejectedValue(new Error("private redis endpoint"))
    const scope = { resolve: () => ({ raw: jest.fn().mockResolvedValue(1) }) }
    const res = response()
    await GET({ scope } as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ status: "unavailable", checks: { database: "up", redis: "down" } })
    expect(JSON.stringify(res.body)).not.toContain("private")
  })

  it("fails closed before probing Redis when the database is down", async () => {
    const scope = { resolve: () => ({ raw: jest.fn().mockRejectedValue(new Error("database down")) }) }
    const res = response()
    await GET({ scope } as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ status: "unavailable", checks: { database: "down", redis: "down" } })
    expect(connect).not.toHaveBeenCalled()
  })
})
