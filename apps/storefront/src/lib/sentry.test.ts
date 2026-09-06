import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("sentry source is PII-safe and initialized once", () => {
  const source = readFileSync(new URL("./sentry.ts", import.meta.url), "utf8")
  assert.match(source, /let initialized = false/)
  assert.match(source, /sendDefaultPii: false/)
  assert.match(source, /delete event\.user/)
  assert.match(source, /redacted-email/)
  assert.doesNotMatch(source, /replayIntegration/)
})
