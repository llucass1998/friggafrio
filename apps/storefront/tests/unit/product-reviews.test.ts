import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

test("review client supports controlled edits through the authenticated endpoint", () => {
  const source = readFileSync(resolve(process.cwd(), "src/lib/data/product-reviews.ts"), "utf8")
  assert.match(source, /method: "PATCH"/)
  assert.match(source, /reviews\/\$\{reviewId\}/)
})
test("PDP emits AggregateRating only when the server summary has real reviews", () => {
  const source = readFileSync(resolve(process.cwd(), "src/routes/$countryCode/products/$handle.tsx"), "utf8")
  assert.match(source, /reviewSummary\?\.total && reviewSummary\.average !== null/)
  assert.match(source, /"@type": "AggregateRating"/)
  assert.match(source, /reviewCount: reviewSummary\.total/)
})
