import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { assertSafeCommand, collectSourceFiles, compareManifests, createManifest, runGuarded } from "./source-integrity-guard.mjs"

test("detects source additions, removals, and edits without restoring them", () => {
  const root = mkdtempSync(join(tmpdir(), "friggafrio-integrity-test-"))
  mkdirSync(join(root, "apps/backend/src"), { recursive: true })
  writeFileSync(join(root, "apps/backend/src/example.ts"), "before")
  const before = createManifest(root)
  writeFileSync(join(root, "apps/backend/src/example.ts"), "after")
  writeFileSync(join(root, "apps/backend/src/new.ts"), "new")
  const after = createManifest(root)
  const result = compareManifests(before, after)
  assert.deepEqual(result.changed, ["apps/backend/src/example.ts"])
  assert.deepEqual(result.added, ["apps/backend/src/new.ts"])
  assert.deepEqual(result.removed, [])
  assert.equal(readFileSync(join(root, "apps/backend/src/example.ts"), "utf8"), "after")
})

test("blocks destructive Git and source-copy commands", () => {
  assert.throws(() => assertSafeCommand("git", ["reset", "--hard"]), /DESTRUCTIVE_COMMAND_BLOCKED/)
  assert.throws(() => assertSafeCommand("git", ["clean", "-fd"]), /DESTRUCTIVE_COMMAND_BLOCKED/)
  assert.throws(() => assertSafeCommand("rsync", ["old/src", "apps/backend/src"]), /DESTRUCTIVE_COMMAND_BLOCKED/)
  assert.doesNotThrow(() => assertSafeCommand("pnpm", ["test:unit"]))
})

test("runs an allowed command after creating an integrity snapshot", () => {
  const root = mkdtempSync(join(tmpdir(), "friggafrio-integrity-run-"))
  mkdirSync(join(root, "apps/backend/src"), { recursive: true })
  writeFileSync(join(root, "apps/backend/src/ok.ts"), "ok")
  assert.equal(runGuarded(process.execPath, ["--version"], { root, manifestPath: join(root, "manifest.json") }), 0)
})

test("excludes generated artifacts and environment files from the source manifest", () => {
  const root = mkdtempSync(join(tmpdir(), "friggafrio-integrity-exclude-"))
  mkdirSync(join(root, "apps/backend/src"), { recursive: true })
  mkdirSync(join(root, "apps/backend/dist"), { recursive: true })
  writeFileSync(join(root, "apps/backend/src/ok.ts"), "ok")
  writeFileSync(join(root, "apps/backend/.env"), "secret")
  writeFileSync(join(root, "apps/backend/dist/generated.js"), "generated")
  assert.deepEqual(collectSourceFiles(root), ["apps/backend/src/ok.ts"])
})

test("includes storefront regression tests in the protected source set", () => {
  const root = mkdtempSync(join(tmpdir(), "friggafrio-integrity-tests-"))
  mkdirSync(join(root, "apps/storefront/tests"), { recursive: true })
  writeFileSync(join(root, "apps/storefront/tests/checkout.spec.ts"), "test")
  assert.deepEqual(collectSourceFiles(root), ["apps/storefront/tests/checkout.spec.ts"])
})
