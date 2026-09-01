import { readFileSync } from "node:fs"
import { join } from "node:path"

describe("payment attempt session reference migration", () => {
  it("adds the active Medusa session without recreating payment attempts", () => {
    const source = readFileSync(join(__dirname, "migrations", "Migration20260826033000.ts"), "utf8")

    expect(source).toContain('add column if not exists "payment_session_id" text null')
    expect(source).toContain('CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_payment_session_id"')
    expect(source).not.toContain('create table if not exists "payment_attempt"')
    expect(source).not.toContain('drop table if exists "payment_attempt"')
  })
})
