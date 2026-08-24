import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  MedusaRuntimeContractError,
  validateMedusaRuntimeContract,
} from "./medusa-runtime-contract.mjs";

function createRelease({ html = '<script src="/app/assets/admin.js"></script>', installDependencies = true } = {}) {
  const release = mkdtempSync(join(tmpdir(), "friggafrio medusa runtime "));
  const runtime = join(release, "apps/backend/.medusa/server");
  mkdirSync(join(runtime, "public/admin/assets"), { recursive: true });
  writeFileSync(join(runtime, "package.json"), '{"name":"runtime"}');
  writeFileSync(join(runtime, "public/admin/index.html"), html);
  writeFileSync(join(runtime, "public/admin/assets/admin.js"), "console.log('admin')");
  if (installDependencies) {
    mkdirSync(join(runtime, "node_modules/.bin"), { recursive: true });
    writeFileSync(join(runtime, "node_modules/.bin/medusa"), "#!/usr/bin/env node");
  }
  return { release, runtime };
}

function expectContractFailure(code, options) {
  assert.throws(
    () => validateMedusaRuntimeContract(options),
    (error) => error instanceof MedusaRuntimeContractError && error.code === code,
  );
}

test("accepts a generated Admin build and runtime dependencies", () => {
  const fixture = createRelease();
  try {
    const result = validateMedusaRuntimeContract({
      releaseDir: fixture.release,
      runtimeDir: fixture.runtime,
      requireRuntimeDependencies: true,
    });
    assert.equal(result.adminAssets.length, 1);
  } finally {
    rmSync(fixture.release, { recursive: true, force: true });
  }
});

test("fails closed when the generated Admin index is missing or empty", () => {
  const missing = createRelease();
  const empty = createRelease({ html: "" });
  try {
    rmSync(join(missing.runtime, "public/admin/index.html"));
    expectContractFailure("MEDUSA_ADMIN_INDEX_MISSING", { releaseDir: missing.release });
    expectContractFailure("MEDUSA_ADMIN_INDEX_EMPTY", { releaseDir: empty.release });
  } finally {
    rmSync(missing.release, { recursive: true, force: true });
    rmSync(empty.release, { recursive: true, force: true });
  }
});

test("fails closed for a missing Admin asset or an incorrect runtime directory", () => {
  const fixture = createRelease();
  try {
    rmSync(join(fixture.runtime, "public/admin/assets/admin.js"));
    expectContractFailure("MEDUSA_ADMIN_ASSET_MISSING", { releaseDir: fixture.release });
    expectContractFailure("MEDUSA_RUNTIME_WORKING_DIRECTORY_INVALID", {
      releaseDir: fixture.release,
      runtimeDir: join(fixture.release, "apps/backend"),
    });
  } finally {
    rmSync(fixture.release, { recursive: true, force: true });
  }
});

test("requires a fresh runtime dependency install after a build recreates the server", () => {
  const fixture = createRelease({ installDependencies: false });
  try {
    expectContractFailure("MEDUSA_RUNTIME_DEPENDENCIES_MISSING", {
      releaseDir: fixture.release,
      requireRuntimeDependencies: true,
    });
  } finally {
    rmSync(fixture.release, { recursive: true, force: true });
  }
});

test("supports release paths containing spaces and clean releases without inherited artifacts", () => {
  const fixture = createRelease({ html: '<link href="assets/admin.css" rel="stylesheet">' });
  try {
    writeFileSync(join(fixture.runtime, "public/admin/assets/admin.css"), "body{}");
    const result = validateMedusaRuntimeContract({
      releaseDir: fixture.release,
      requireRuntimeDependencies: true,
    });
    assert.deepEqual(result.adminAssets, ["assets/admin.css"]);
  } finally {
    rmSync(fixture.release, { recursive: true, force: true });
  }
});
