import assert from "node:assert/strict"
import test from "node:test"

import { resolveMedusaBackendUrl } from "../../src/config/runtime-backend-url.ts"

test("local browser hosts preserve an explicitly configured local backend", () => {
  assert.equal(
    resolveMedusaBackendUrl("http://localhost:19001/", "localhost"),
    "http://localhost:19001",
  )
  assert.equal(
    resolveMedusaBackendUrl("http://127.0.0.1:19001", "127.0.0.1"),
    "http://127.0.0.1:19001",
  )
  assert.equal(
    resolveMedusaBackendUrl("http://localhost:9000", "127.0.0.1"),
    "http://127.0.0.1:9000",
  )
})

test("local browser hosts fall back to the canonical local backend for a non-local configured origin", () => {
  assert.equal(
    resolveMedusaBackendUrl("https://friggafrio.istigestao.com.br", "localhost"),
    "http://localhost:9000",
  )
  assert.equal(
    resolveMedusaBackendUrl(undefined, "127.0.0.1"),
    "http://127.0.0.1:9000",
  )
})

test("production hosts keep the configured backend origin", () => {
  assert.equal(
    resolveMedusaBackendUrl("https://friggafrio.istigestao.com.br/", "friggafrio.istigestao.com.br"),
    "https://friggafrio.istigestao.com.br",
  )
})

test("missing backend configuration fails closed outside local browser hosts", () => {
  assert.throws(
    () => resolveMedusaBackendUrl(undefined, "friggafrio.istigestao.com.br"),
    /VITE_MEDUSA_BACKEND_URL nao foi configurada/,
  )
})

test("backend configuration rejects unsupported URLs and embedded credentials", () => {
  assert.throws(
    () => resolveMedusaBackendUrl("javascript:alert(1)", "friggafrio.istigestao.com.br"),
    /VITE_MEDUSA_BACKEND_URL invalida/,
  )
  assert.throws(
    () => resolveMedusaBackendUrl("https://user:pass@example.com", "friggafrio.istigestao.com.br"),
    /VITE_MEDUSA_BACKEND_URL invalida/,
  )
})
