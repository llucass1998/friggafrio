import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { readAnalyticsConsent, trackAnalyticsEvent } from "@/lib/analytics"

test("analytics defaults to denied outside a browser", () => {
  assert.equal(readAnalyticsConsent(), "denied")
  assert.doesNotThrow(() => trackAnalyticsEvent("page_view", { page_location: "/br" }))
})

test("analytics source keeps the consent boundary and approved event names", () => {
  const source = readFileSync(new URL("./analytics.ts", import.meta.url), "utf8")
  assert.match(source, /analytics_storage: "denied"/)
  assert.match(source, /ad_user_data: "denied"/)
  assert.match(source, /purchase/)
  assert.match(source, /lastPageView/)
})
