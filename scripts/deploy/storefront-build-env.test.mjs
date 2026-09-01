import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import test from "node:test"
import { validateStorefrontBuildEnv } from "./storefront-build-env.mjs"

test("requires Maps before a production storefront build", () => {
  const directory = mkdtempSync(join(tmpdir(), "friggafrio-maps-env-"))
  mkdirSync(join(directory, "apps/storefront"), { recursive: true })
  writeFileSync(join(directory, "apps/storefront/.env"), "VITE_GOOGLE_MAPS_REQUIRED=true\n")
  assert.throws(() => validateStorefrontBuildEnv(directory), /VITE_GOOGLE_MAPS_EMBED_API_KEY/)
  writeFileSync(join(directory, "apps/storefront/.env.local"), "VITE_GOOGLE_MAPS_EMBED_API_KEY=test-key\n")
  assert.deepEqual(validateStorefrontBuildEnv(directory), { mapsRequired: "YES", mapsKey: "PRESENT" })
  rmSync(directory, { recursive: true, force: true })
})
