import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"

test("country cookie lookup uses the typed Headers API", () => {
  const source = readFileSync(resolve(process.cwd(), "src/lib/data/country-code.ts"), "utf8")
  assert.match(source, /headers\?\.get\("cookie"\)/)
  assert.doesNotMatch(source, /headers\?\.cookie/)
})
