const store = new Map<string, string>()
const mockClient = {
  status: "ready",
  on: jest.fn(), disconnect: jest.fn(),
  get: jest.fn(async (key: string) => store.get(key) ?? null),
  set: jest.fn(async (key: string, value: string) => {
    if (store.has(key)) return null
    store.set(key, value); return "OK"
  }),
  setex: jest.fn(async (key: string, _ttl: number, value: string) => { store.set(key, value) }),
  incr: jest.fn(async (key: string) => { const value = Number(store.get(key) ?? 0) + 1; store.set(key, String(value)); return value }),
  eval: jest.fn(async (_script: string, _count: number, key: string, token: string) => {
    if (store.get(key) === token) store.delete(key)
    return 1
  }),
}
jest.mock("ioredis", () => ({ __esModule: true, default: jest.fn(() => mockClient) }))
import { cachedPublicCatalog, invalidatePublicCatalog, resetCatalogCacheClientForTesting } from "./catalog-cache"

describe("Cache público concorrente e invalidação", () => {
  const original = process.env.REDIS_URL
  beforeEach(() => { store.clear(); jest.clearAllMocks(); process.env.REDIS_URL = "redis://fixture.invalid" })
  afterEach(() => { resetCatalogCacheClientForTesting(); if (original === undefined) delete process.env.REDIS_URL; else process.env.REDIS_URL = original })
  it("dez requests idênticos calculam uma única vez e depois retornam HIT", async () => {
    const compute = jest.fn(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); return { count: 89 } })
    const results = await Promise.all(Array.from({ length: 10 }, () => cachedPublicCatalog("search", { region: "br", offset: 0 }, compute)))
    expect(compute).toHaveBeenCalledTimes(1)
    expect(results.every((r) => r.value.count === 89)).toBe(true)
    expect((await cachedPublicCatalog("search", { region: "br", offset: 0 }, compute)).cache).toBe("HIT")
  })
  it("não repovoa epoch novo quando preço ou estoque muda durante o cálculo", async () => {
    let release!: () => void
    const started = new Promise<void>((resolve) => { release = resolve })
    const pending = cachedPublicCatalog("search", { page: 1 }, async () => { await started; return { old: true } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    await invalidatePublicCatalog()
    release(); await pending
    const fresh = await cachedPublicCatalog("search", { page: 1 }, async () => ({ old: false }))
    expect(fresh.cache).toBe("MISS")
    expect(fresh.value.old).toBe(false)
  })
  it("separa página, região e canal para não misturar resultados", async () => {
    const compute = jest.fn(async () => ({ ok: true }))
    for (const context of [{ page: 1, region: "br", channel: "a" }, { page: 2, region: "br", channel: "a" }, { page: 1, region: "br", channel: "b" }]) await cachedPublicCatalog("search", context, compute)
    expect(compute).toHaveBeenCalledTimes(3)
  })
})
