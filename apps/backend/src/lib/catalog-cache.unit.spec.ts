import {
  createCatalogCacheKey,
  getCachedJson,
  setCachedJson,
  resetCatalogCacheClientForTesting,
  cachedPublicCatalog,
} from "./catalog-cache"

describe("catalog-cache", () => {
  const originalEnv = process.env.REDIS_URL

  afterEach(() => {
    process.env.REDIS_URL = originalEnv
    resetCatalogCacheClientForTesting()
  })

  describe("createCatalogCacheKey", () => {
    it("generates deterministic keys regardless of param insertion order", () => {
      const key1 = createCatalogCacheKey("facets", { q: "ar", brand: "elgin", page: 1 })
      const key2 = createCatalogCacheKey("facets", { brand: "elgin", page: 1, q: "ar" })
      expect(key1).toBe(key2)
      expect(key1).toBe('catalog:facets:{"brand":"elgin","page":1,"q":"ar"}')
    })

    it("filters out empty or undefined params", () => {
      const key = createCatalogCacheKey("search", { q: "ar", brand: undefined, empty: "" })
      expect(key).toBe('catalog:search:{"q":"ar"}')
    })
  })

  describe("without REDIS_URL", () => {
    beforeEach(() => {
      delete process.env.REDIS_URL
    })

    it("returns null on getCachedJson", async () => {
      const result = await getCachedJson("catalog:test")
      expect(result).toBeNull()
    })

    it("does not throw on setCachedJson", async () => {
      await expect(setCachedJson("catalog:test", { data: 1 }, 60)).resolves.toBeUndefined()
    })

    it("executes computation correctly and coalesces in-flight calls without Redis", async () => {
      const compute = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
        return { ok: true }
      })
      const [first, second] = await Promise.all([
        cachedPublicCatalog("ns", { a: 1 }, compute),
        cachedPublicCatalog("ns", { a: 1 }, compute),
      ])
      expect(compute).toHaveBeenCalledTimes(1)
      expect(first.value).toEqual({ ok: true })
      expect(second.value).toEqual({ ok: true })
      expect([first.cache, second.cache].sort()).toEqual(["COALESCED", "MISS"])
    })
  })
})
