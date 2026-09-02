import test from "node:test"
import assert from "node:assert/strict"
import { isLoopbackMediaUrl, resolveMediaUrl } from "../../src/lib/media-url"

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

test("blocks persisted loopback media from the public storefront", () => {
  assert.equal(
    resolveMediaUrl("http://localhost:9000/static/missing-product.jpg", { hostname: "friggafrio.istigestao.com.br", isDevelopment: false }),
    undefined,
  )
})

test("keeps loopback media available to the local development backend", () => {
  assert.equal(
    resolveMediaUrl("http://localhost:9000/static/local-product.jpg", { hostname: "localhost", isDevelopment: true }),
    "http://localhost:9000/static/local-product.jpg",
  )
})

test("identifies every loopback host form used by legacy image records", () => {
  assert.equal(isLoopbackMediaUrl("http://localhost:9000/static/product.jpg"), true)
  assert.equal(isLoopbackMediaUrl("http://127.0.0.1:9000/static/product.jpg"), true)
  assert.equal(isLoopbackMediaUrl("https://friggafrio.istigestao.com.br/static/product.jpg"), false)
})
