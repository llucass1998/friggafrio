import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
jest.setTimeout(60 * 1000)

const databaseUrl = process.env.TEST_DATABASE_URL

if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL is required for HTTP integration tests")
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    DATABASE_URL: databaseUrl,
    DB_URL: databaseUrl,
    POSTGRES_URL: databaseUrl,
  },
  testSuite: ({ api }) => {
    describe("Ping", () => {
      it("ping the server health endpoint", async () => {
        const response = await api.get('/health')
        expect(response.status).toEqual(200)
      })
    })
  },
})
