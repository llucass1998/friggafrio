import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createProductWhatsAppUrl } from "../../src/lib/whatsapp.ts"

test("product WhatsApp links contain only public product context", () => {
  const url = createProductWhatsAppUrl({
    rawNumber: "5511999999999",
    title: "Compressor Frigga",
    reference: "SKU-123",
    quantity: 2,
    price: "R$ 1.200,00",
    url: "https://friggafrio.istigestao.com.br/br/products/compressor",
  })

  assert.ok(url)
  const message = decodeURIComponent(url.split("?text=")[1] ?? "")
  assert.match(message, /Compressor Frigga/)
  assert.match(message, /SKU-123/)
  assert.match(message, /Quantidade: 2/)
  assert.doesNotMatch(message, /cart|token|customer|session/i)
})

test("PDP WhatsApp links use the router path so SSR and hydration agree", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/product-actions.tsx"), "utf8")
  assert.match(source, /url: location\.pathname/)
  assert.doesNotMatch(source, /window\.location\.href/)
})
