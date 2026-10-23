import Redis from "ioredis"

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  if (redisClient && redisClient.status !== "end") {
    return redisClient
  }

  try {
    redisClient = new Redis(redisUrl, {
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: false,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
    })

    redisClient.on("error", () => {
      // Fail silently to prevent crashing requests or unhandled errors
    })

    return redisClient
  } catch {
    return null
  }
}

export function createCatalogCacheKey(prefix: string, queryParams: Record<string, unknown> = {}): string {
  const sortedKeys = Object.keys(queryParams).sort()
  const normalized: Record<string, unknown> = {}
  for (const k of sortedKeys) {
    if (queryParams[k] !== undefined && queryParams[k] !== null && queryParams[k] !== "") {
      normalized[k] = queryParams[k]
    }
  }
  return `catalog:${prefix}:${JSON.stringify(normalized)}`
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient()
    if (!client) return null
    const raw = await client.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCachedJson(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    const client = getRedisClient()
    if (!client) return
    const serialized = JSON.stringify(data)
    await client.setex(key, ttlSeconds, serialized)
  } catch {
    // Fail silently so catalog functionality is never compromised
  }
}

export function resetCatalogCacheClientForTesting(): void {
  if (redisClient) {
    try {
      redisClient.disconnect()
    } catch {
      // ignore
    }
    redisClient = null
  }
}
