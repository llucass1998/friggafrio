import { readFileSync } from "node:fs"
import { join } from "node:path"

describe("payment operation raw amount migration", () => {
  it("upgrades the existing ledger additively without recreating it", () => {
    const source = readFileSync(join(__dirname, "migrations", "Migration20260826021320.ts"), "utf8")

    expect(source).toContain('add column if not exists "raw_amount" jsonb null')
    expect(source).not.toContain('create table if not exists "payment_operation"')
    expect(source).not.toContain('drop table if exists "payment_operation"')
  })
})
