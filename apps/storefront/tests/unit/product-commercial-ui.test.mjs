import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

const card = readFileSync(new URL("../../src/components/public-product-card.tsx", import.meta.url), "utf8")
const detail = readFileSync(new URL("../../src/components/product-actions.tsx", import.meta.url), "utf8")

test("Product Card renders quote-only and pending states as factual PDP links", () => {
  assert.match(card, /purchaseState\.status === "quote_only"/)
  assert.match(card, /Sob cota/)
  assert.match(card, /purchaseState\.status === "price_pending"/)
  assert.match(card, /Valor em configura/)
  assert.match(card, /Consulte o valor/)
  assert.doesNotMatch(card, /Adicionar ao carrinho/)
  assert.doesNotMatch(card, /useAddToCart/)
})

test("Product Card does not render a pending calculated price", () => {
  const pendingBranch = card.match(/purchaseState\.status === "price_pending" \? \([\s\S]*?\) : purchaseState\.status === "out_of_stock"/)
  assert.ok(pendingBranch, "expected an explicit price_pending presentation branch")
  assert.doesNotMatch(pendingBranch[0], /formatCurrencyAmount/)
})

test("Product Detail routes quote and pending states through consultative actions", () => {
  assert.match(detail, /const quoteState = purchaseState\.status === "quote_only" \|\| purchaseState\.status === "price_pending"/)
  assert.match(detail, /Sob orçamento/)
  assert.match(detail, /Preço sob consulta/)
  assert.match(detail, /Solicitar orçamento/)
  assert.match(detail, /Falar com um especialista/)
  assert.match(detail, /canBuySelected/)
})

test("Product Detail does not format a calculated price for pending states", () => {
  assert.match(detail, /const displayPrice = selectedVariant\?\.calculated_price\?\.calculated_amount/)
  assert.match(detail, /purchaseState\.status === "purchasable" \? purchaseState\.price : undefined/)
  assert.match(detail, /quoteState \? \(/)
  assert.match(detail, /formattedPrice = typeof displayPrice === "number" && displayPrice > 0/)
})
