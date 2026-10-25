import Redis from "ioredis"
import { createHash, randomUUID } from "node:crypto"

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
      commandTimeout: 1500,
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

const epochKey = "catalog:public:v2:epoch"
const inFlight = new Map<string, Promise<unknown>>()

export async function invalidatePublicCatalog(): Promise<void> {
  try { await getRedisClient()?.incr(epochKey) } catch { /* O TTL limita o cache se o Redis estiver indisponível. */ }
}

/** Coalescência por contexto público; o epoch impede repovoar a versão invalidada. */
export async function cachedPublicCatalog<T>(namespace: string, context: object, compute: () => Promise<T>, ttl = 30): Promise<{ value: T; cache: string }> {
  let epoch = "0"
  const client = getRedisClient()
  try { epoch = await client?.get(epochKey) ?? "0" } catch { /* Consulta correta sem cache. */ }
  const digest = createHash("sha256").update(JSON.stringify(context)).digest("hex")
  const key = `catalog:public:v2:${epoch}:${namespace}:${digest}`
  const cached = await getCachedJson<T>(key)
  if (cached !== null) return { value: cached, cache: "HIT" }
  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) return { value: await existing, cache: "COALESCED" }
  const promise = (async () => {
    const token = randomUUID()
    let locked = false
    let cacheWritable = !client
    const lockKey = `${key}:lock`
    try {
      if (client) {
        try {
          locked = await client.set(lockKey, token, "PX", 15_000, "NX") === "OK"
          cacheWritable = locked
          if (!locked) {
            for (let attempt = 0; attempt < 20; attempt++) {
              await new Promise((resolve) => setTimeout(resolve, 100))
              const shared = await getCachedJson<T>(key)
              if (shared !== null) return shared
            }
          }
        } catch { /* Sem Redis, coalescência local permanece ativa. */ }
      }
      const value = await compute()
      // Se o epoch mudar durante o cálculo, este resultado nunca ocupa a nova versão.
      if (cacheWritable) await setCachedJson(key, value, ttl)
      return value
    } finally {
      if (locked) {
        try { await client?.eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", 1, lockKey, token) } catch { /* Lease expira automaticamente. */ }
      }
    }
  })()
  inFlight.set(key, promise)
  try { return { value: await promise, cache: "MISS" } } finally { if (inFlight.get(key) === promise) inFlight.delete(key) }
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
