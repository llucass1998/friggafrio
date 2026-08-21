import assert from "node:assert/strict"
import test from "node:test"

import { resolveMedusaBackendUrl } from "../../src/config/runtime-backend-url.ts"

test("local browser hosts always use the canonical local backend", () => {
  assert.equal(
    resolveMedusaBackendUrl("https://friggafrio.istigestao.com.br", "localhost"),
    "http://localhost:9000",
  )
  assert.equal(
    resolveMedusaBackendUrl("https://friggafrio.istigestao.com.br", "127.0.0.1"),
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
