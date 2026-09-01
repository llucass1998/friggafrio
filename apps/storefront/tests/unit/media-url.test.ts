import test from "node:test"
import assert from "node:assert/strict"
import { resolveMediaUrl } from "../../src/lib/media-url"

test("keeps external media URLs unchanged outside localhost", () => {
  assert.equal(resolveMediaUrl("https://cdn.example.com/image.jpg"), "https://cdn.example.com/image.jpg")
})

test("keeps relative media paths unchanged", () => {
  assert.equal(resolveMediaUrl("/static/image.jpg"), "/static/image.jpg")
})

test("routes production upload hosts through the local backend on localhost", () => {
  assert.equal(
    resolveMediaUrl("https://friggafrio.istigestao.com.br/uploads/product.jpg", { hostname: "localhost", isDevelopment: true }),
    "http://localhost:9000/uploads/product.jpg",
  )
})

test("does not rewrite public media outside local development", () => {
  const source = "https://friggafrio.istigestao.com.br/uploads/product.jpg"
  assert.equal(resolveMediaUrl(source, { hostname: "localhost", isDevelopment: false }), source)
})
