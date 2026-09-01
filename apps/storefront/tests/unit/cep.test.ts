import assert from "node:assert/strict"
import test from "node:test"
import { clearGuestCep, formatCep, lookupCep, normalizeCep, readGuestCep, setGuestCep } from "../../src/lib/cep.ts"

test("CEP helpers normalize display values and keep guest CEP only in memory", () => {
  assert.equal(normalizeCep("12.345-6789"), "12345678")
  assert.equal(formatCep("12345678"), "12345-678")
  setGuestCep("12345678")
  assert.equal(readGuestCep(), "12345-678")
  clearGuestCep()
  assert.equal(readGuestCep(), "")
})

test("CEP lookup uses eight digits, caches the response, and supports abort", async () => {
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async (_input, init) => {
    calls += 1
    if (init?.signal?.aborted) throw new DOMException("Aborted", "AbortError")
    return new Response(JSON.stringify({ logradouro: "Rua A", bairro: "Centro", localidade: "São Paulo", uf: "SP" }), { status: 200 })
  }
  try {
    assert.deepEqual(await lookupCep("01310-100"), { street: "Rua A", neighborhood: "Centro", city: "São Paulo", state: "SP" })
    assert.deepEqual(await lookupCep("01310100"), { street: "Rua A", neighborhood: "Centro", city: "São Paulo", state: "SP" })
    assert.equal(calls, 1)
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(() => lookupCep("01310-101", { signal: controller.signal }))
  } finally {
    globalThis.fetch = originalFetch
  }
})
