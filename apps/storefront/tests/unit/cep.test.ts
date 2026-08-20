import assert from "node:assert/strict"
import test from "node:test"
import { clearGuestCep, formatCep, normalizeCep, readGuestCep, setGuestCep } from "../../src/lib/cep.ts"

test("CEP helpers normalize display values and keep guest CEP only in memory", () => {
  assert.equal(normalizeCep("12.345-6789"), "12345678")
  assert.equal(formatCep("12345678"), "12345-678")
  setGuestCep("12345678")
  assert.equal(readGuestCep(), "12345-678")
  clearGuestCep()
  assert.equal(readGuestCep(), "")
})
