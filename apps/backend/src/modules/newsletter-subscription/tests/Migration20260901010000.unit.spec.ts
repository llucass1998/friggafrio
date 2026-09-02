import { readFileSync } from "node:fs"
import { join } from "node:path"

describe("newsletter pending status migration", () => {
  it("replaces only the legacy status constraint and accepts pending confirmation", () => {
    const source = readFileSync(
      join(__dirname, "../migrations/Migration20260901010000.ts"),
      "utf8",
    )
    expect(source).toContain("newsletter_subscription_status_check_pending")
    expect(source).toContain("validate constraint")
    expect(source).toContain("to_regclass('public.newsletter_subscription')")
    expect(source).toContain(
      "''pending'', ''active'', ''unsubscribed'', ''bounced'', ''complained''",
    )
    expect(source).toContain("newsletter_subscription_status_check_legacy")
    expect(source).toContain("pending_constraint_exists")
    expect(source).toContain("legacy_constraint_exists")
    expect(source).not.toMatch(
      /delete|truncate|drop table|if exists \"newsletter_subscription\"/i,
    )
  })
})
