import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type DatabaseConnection = {
  raw: (query: string) => Promise<unknown>
}

const DATABASE_CHECK_TIMEOUT_MS = 2_000

const checkDatabase = async (connection: DatabaseConnection) => {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      connection.raw("SELECT 1"),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Database readiness check timed out")),
          DATABASE_CHECK_TIMEOUT_MS
        )
      }),
    ])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const database = req.scope.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    ) as DatabaseConnection

    await checkDatabase(database)

    res.status(200).json({
      status: "ready",
      checks: { database: "up" },
    })
  } catch {
    res.status(503).json({
      status: "unavailable",
      checks: { database: "down" },
    })
  }
}
