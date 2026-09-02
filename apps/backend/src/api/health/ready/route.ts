import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Redis from "ioredis"

type DatabaseConnection = {
  raw: (query: string) => Promise<unknown>
}

const DATABASE_CHECK_TIMEOUT_MS = 2_000
const REDIS_CHECK_TIMEOUT_MS = 1_000

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

const checkRedis = async () => {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) throw new Error("Redis configuration missing")
  const client = new Redis(redisUrl, {
    connectTimeout: REDIS_CHECK_TIMEOUT_MS,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy: () => null,
  })
  // ioredis emits connection failures as events even when connect() rejects.
  // The readiness response below reports the failure without leaking details.
  client.on("error", () => undefined)
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    await client.connect()
    await Promise.race([
      client.ping(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Redis readiness check timed out")), REDIS_CHECK_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
    client.disconnect()
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  let databaseStatus: "up" | "down" = "down"
  let redisStatus: "up" | "down" = "down"

  try {
    const database = req.scope.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    ) as DatabaseConnection
    await checkDatabase(database)
    databaseStatus = "up"
  } catch {
    // Keep the response structured and secret-free while identifying the
    // dependency that prevented readiness.
  }

  if (databaseStatus === "up") {
    try {
      await checkRedis()
      redisStatus = "up"
    } catch {
      // Redis is required for durable sessions and cache-backed routes.
    }
  }

  if (databaseStatus === "up" && redisStatus === "up") {
    return res.status(200).json({
      status: "ready",
      checks: { database: databaseStatus, redis: redisStatus },
    })
  }

  return res.status(503).json({
    status: "unavailable",
    checks: { database: databaseStatus, redis: redisStatus },
  })
}
