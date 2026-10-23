import {
  createCatalogCacheKey,
  getCachedJson,
  setCachedJson,
  resetCatalogCacheClientForTesting,
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
  })
})
