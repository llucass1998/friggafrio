import { GET } from "./route"

const response = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((statusCode: number) => { result.statusCode = statusCode; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

describe("E2E isolation proof", () => {
  const environment = { ...process.env }

  afterEach(() => {
    process.env = { ...environment }
  })

  it("accepts only a test process bound to an isolated loopback database", () => {
    process.env.NODE_ENV = "test"
    process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:55433/frigga_test"
    process.env.TEST_DATABASE_URL = process.env.DATABASE_URL
    const res = response()
    GET({} as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ isolated: true })
  })

  it("fails closed for a non-test or non-isolated runtime", () => {
    process.env.NODE_ENV = "production"
    process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:55433/frigga_test"
    process.env.TEST_DATABASE_URL = process.env.DATABASE_URL
    const res = response()
    GET({} as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ isolated: false })
  })
})
