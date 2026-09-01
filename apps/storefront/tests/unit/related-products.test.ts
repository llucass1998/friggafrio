import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { rankRelatedProducts } from "../../src/lib/utils/related-products.ts"

const product = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  title: id,
  description: "Produto técnico",
  handle: id,
  thumbnail: `https://cdn.example/${id}.jpg`,
  metadata: { application: "refrigeracao", ...((overrides.metadata || {}) as Record<string, unknown>) },
  categories: [{ id: "cat-a" }],
  collection_id: "col-a",
  tags: [{ id: "tag-a" }],
  type: { value: "peca" },
  variants: [{ calculated_price: { calculated_amount: 100 }, manage_inventory: true, inventory_quantity: 10 }],
  ...overrides,
}) as never

test("related ranking excludes the current product and duplicates", () => {
  const source = product("source")
  const result = rankRelatedProducts(source, [source, product("a"), product("a"), product("b")], 4)
  assert.deepEqual(new Set(result.map((item) => item.id)), new Set(["a", "b"]))
})

test("explicit relationships outrank contextual fallback candidates", () => {
  const source = product("source", { metadata: { related_product_ids: ["explicit"], application: "refrigeracao" } })
  const result = rankRelatedProducts(source, [product("fallback", { categories: [{ id: "other" }], collection_id: "other", tags: [] }), product("explicit", { categories: [{ id: "other" }], collection_id: "other", tags: [] })], 2)
  assert.equal(result[0]?.id, "explicit")
})

test("selection is stable per product and prefers valid image and stock", () => {
  const sourceA = product("source-a")
  const candidates = [
    product("no-image", { thumbnail: null, variants: [{ calculated_price: { calculated_amount: 100 }, manage_inventory: true, inventory_quantity: 0 }] }),
    product("good", { categories: [{ id: "other" }], collection_id: "other", tags: [], metadata: { application: "other" } }),
    product("same-context", { metadata: { application: "refrigeracao" } }),
  ]
  const first = rankRelatedProducts(sourceA, candidates, 3).map((item) => item.id)
  const second = rankRelatedProducts(sourceA, candidates, 3).map((item) => item.id)
  assert.deepEqual(first, second)
  assert.equal(first[0], "same-context")
})

test("known incompatible compatibility groups are excluded without explicit relation", () => {
  const source = product("source", { metadata: { compatibility: "model-a" } })
  const result = rankRelatedProducts(source, [product("incompatible", { metadata: { compatibility: "model-b" } }), product("compatible", { metadata: { compatibility: "model-a" } })], 4)
  assert.deepEqual(result.map((item) => item.id), ["compatible"])
})

test("category fallback outranks an unrelated candidate and supports parent categories", () => {
  const source = product("source", {
    categories: [{ id: "child-a", parent_category_id: "parent-a" }],
  })
  const result = rankRelatedProducts(source, [
    product("unrelated", { categories: [{ id: "other" }], collection_id: "other" }),
    product("same-parent", { categories: [{ id: "child-b", parent_category_id: "parent-a" }], collection_id: "other" }),
    product("same-category", { categories: [{ id: "child-a", parent_category_id: "parent-a" }] }),
  ], 3)
  assert.deepEqual(result.map((item) => item.id).slice(0, 2), ["same-category", "same-parent"])
})

test("small catalogs return only available unique candidates", () => {
  const source = product("source")
  const result = rankRelatedProducts(source, [source, product("only")], 4)
  assert.deepEqual(result.map((item) => item.id), ["only"])
})

test("products without categories remain safe and deterministic", () => {
  const source = product("source", { categories: [] })
  const candidates = [
    product("a", { categories: [] }),
    product("b", { categories: [] }),
    source,
  ]
  const first = rankRelatedProducts(source, candidates, 4).map((item) => item.id)
  const second = rankRelatedProducts(source, candidates, 4).map((item) => item.id)
  assert.deepEqual(first, second)
  assert.equal(first.includes("source"), false)
})

test("explicit relation IDs accept legacy delimited metadata", () => {
  const source = product("source", { metadata: { related_products: "explicit-a;explicit-b" } })
  const result = rankRelatedProducts(source, [
    product("fallback", { categories: [{ id: "same" }] }),
    product("explicit-b", { categories: [{ id: "other" }] }),
    product("explicit-a", { categories: [{ id: "other" }] }),
  ], 3)
  assert.deepEqual(result.map((item) => item.id).slice(0, 2), ["explicit-a", "explicit-b"])
})

test("selection limits repeated context when alternatives exist", () => {
  const source = product("source", { categories: [{ id: "cat-a" }] })
  const candidates = [
    product("same-1", { categories: [{ id: "cat-a" }] }),
    product("same-2", { categories: [{ id: "cat-a" }] }),
    product("same-3", { categories: [{ id: "cat-a" }] }),
    product("other-1", { categories: [{ id: "cat-b" }] }),
    product("other-2", { categories: [{ id: "cat-c" }] }),
  ]
  const result = rankRelatedProducts(source, candidates, 4)
  const sameCategory = result.filter((item) => item.categories?.some((category) => category.id === "cat-a"))
  assert.ok(sameCategory.length <= 2)
  assert.ok(result.some((item) => item.id === "other-1" || item.id === "other-2"))
})

test("the data layer uses one broad candidate query instead of one request per card", () => {
  const source = readFileSync(resolve(process.cwd(), "src/lib/data/related-products.ts"), "utf8")
  assert.equal((source.match(/sdk\.store\.product\.list\(/g) ?? []).length, 1)
  assert.match(source, /limit: 100/)
  assert.match(source, /rankRelatedProducts\(product, response\.products, limit\)/)
})

test("a ten-product category matrix produces contextual, stable sets", () => {
  const candidates = Array.from({ length: 40 }, (_, index) => product(`candidate-${index}`, {
    categories: [{ id: `cat-${index % 10}` }],
    collection_id: `collection-${index % 4}`,
    metadata: { application: `application-${index % 5}` },
  }))
  const sources = Array.from({ length: 10 }, (_, index) => product(`source-${index}`, {
    categories: [{ id: `cat-${index}` }],
    collection_id: `collection-${index % 4}`,
    metadata: { application: `application-${index % 5}` },
  }))
  const rows = sources.map((source) => {
    const related = rankRelatedProducts(source, candidates, 4).map((item) => item.id)
    assert.equal(new Set(related).size, related.length)
    assert.equal(related.includes(source.id), false)
    return related.join(",")
  })
  assert.ok(new Set(rows).size >= 5)
})
