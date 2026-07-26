import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { resolveRepairMode } from "../scripts/repair-friggafrio-sellable-catalog"

describe("safe catalog repair script", () => {
  it("uses dry-run by default and when explicitly requested", () => {
    expect(resolveRepairMode([])).toBe("dry-run")
    expect(resolveRepairMode(["--dry-run"])).toBe("dry-run")
    expect(resolveRepairMode(["dry-run"])).toBe("dry-run")
  })

  it("requires an explicit apply flag to mutate state", () => {
    expect(resolveRepairMode(["--apply"])).toBe("apply")
    expect(resolveRepairMode(["apply"])).toBe("apply")
  })

  it("rejects conflicting execution modes", () => {
    expect(() => resolveRepairMode(["--dry-run", "--apply"])).toThrow(
      "Use apenas --dry-run ou --apply"
    )
  })

  it("does not create sellable products or embed commercial values", () => {
    const scriptPath = resolve(
      process.cwd(),
      "src/scripts/repair-friggafrio-sellable-catalog.ts"
    )
    const source = readFileSync(scriptPath, "utf8")

    expect(source).not.toContain("createProductsWorkflow")
    expect(source).not.toContain("amount:")
    expect(source).not.toContain("purchase_enabled: true")
    expect(source).not.toContain("sku:")
  })
})
