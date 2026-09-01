import assert from "node:assert/strict"
import test from "node:test"
import { scanText } from "./bundle-scan.mjs"

test("ignores public keys and symbol names without private values", () => {
  const source = `const publishable = "pk_test_public"; const key = process.env.OMIE_APP_SECRET;`
  assert.deepEqual(scanText(source), [])
})

test("detects private credential values and payment data in a bundle", () => {
  const source = [
    `const resend = "re_${"a".repeat(24)}";`,
    `const card = { pan: "4111111111111111", cvv: "123" };`,
  ].join("\n")
  const ids = scanText(source).map((hit) => hit.id).sort()
  assert.deepEqual(ids, ["cvv-literal", "pan-literal", "resend-api-key"])
})

test("detects private keys and session cookie values", () => {
  const privateHeader = ["-----BEGIN", "PRIVATE KEY-----"].join(" ")
  const privateFooter = ["-----END", "PRIVATE KEY-----"].join(" ")
  const source = `${privateHeader}\nfrigga\n${privateFooter}\nconnect.sid=abcdefghijklmnop`
  const ids = scanText(source).map((hit) => hit.id).sort()
  assert.deepEqual(ids, ["private-key", "session-cookie-value"])
})

test("does not flag publishable payment keys, translated labels, or docs", () => {
  const source = [
    `const env = { VITE_MERCADO_PAGO_PUBLIC_KEY: "APP_USR-922741c6-9be4-4da7-8ce4-37953cd54cd8" }`,
    `const labels = { password: "Passwort", newPassword: "Contraseña" }`,
    `/** sdk.auth.register({ password: "supersecret" }) */`,
  ].join("\n")
  assert.deepEqual(scanText(source), [])
})

test("detects an access token assigned to a private payment field", () => {
  const source = `const config = { MERCADO_PAGO_ACCESS_TOKEN: "APP_USR-922741c6-9be4-4da7-8ce4-37953cd54cd8" }`
  assert.deepEqual(scanText(source).map((hit) => hit.id), ["mercado-pago-private-token"])
})
