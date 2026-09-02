import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
jest.setTimeout(240 * 1000)

const databaseUrl = process.env.TEST_DATABASE_URL
const redisUrl = process.env.REDIS_URL

if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL is required for HTTP integration tests")
}

if (!redisUrl) {
  throw new Error("REDIS_URL is required for HTTP integration tests")
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    DATABASE_URL: databaseUrl,
    DB_URL: databaseUrl,
    POSTGRES_URL: databaseUrl,
    REDIS_URL: redisUrl,
  },
  testSuite: ({ api }) => {
    describe("Health", () => {
      it("reports the process as live", async () => {
        const response = await api.get("/health/live", {
          validateStatus: () => true,
        })

        expect({ status: response.status, data: response.data }).toMatchObject({
          status: 200,
          data: { status: "ok" },
        })
        expect(Number.isNaN(Date.parse(response.data.timestamp))).toBe(false)
      })

      it("reports readiness only after database and Redis checks pass", async () => {
        const response = await api.get("/health/ready", { validateStatus: () => true })
        expect({ status: response.status, data: response.data }).toEqual({
          status: 200,
          data: { status: "ready", checks: { database: "up", redis: "up" } },
        })
      })
    })
  },
})
