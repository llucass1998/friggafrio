import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

const card = readFileSync(new URL("../../src/components/public-product-card.tsx", import.meta.url), "utf8")
const detail = readFileSync(new URL("../../src/components/product-actions.tsx", import.meta.url), "utf8")

for (const [surface, source] of [["Product Card", card], ["Product Detail", detail]]) {
  test(`${surface} renders quote-only and pending states as non-purchasable`, () => {
    assert.match(source, /purchaseState\.status === "quote_only"/)
    assert.match(source, /Somente sob cotação/)
    assert.match(source, /purchaseState\.status === "price_pending"/)
    assert.match(source, /Valor em configuração/)
    assert.match(source, /Consulte o valor/)
    assert.match(source, /disabled=/)
  })

  test(`${surface} does not render a pending calculated price`, () => {
    const pendingBranch = source.match(/purchaseState\.status === "price_pending" \? \([\s\S]*?\) : displayPrice/)
    assert.ok(pendingBranch, "expected an explicit price_pending presentation branch")
    assert.doesNotMatch(pendingBranch[0], /formatCurrencyAmount/)
  })
}
