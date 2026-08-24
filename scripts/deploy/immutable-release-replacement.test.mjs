import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));
const deploy = readFileSync(join(root, "deploy/wsl-deploy.sh"), "utf8");
const preflight = readFileSync(join(root, "deploy/wsl-preflight.sh"), "utf8");
const guard = readFileSync(join(root, "deploy/wsl-guard-lib.sh"), "utf8");

test("requires an explicit immutable mode and a clean official candidate", () => {
  assert.match(deploy, /--immutable/);
  assert.match(deploy, /git clone --branch/);
  assert.match(guard, /require_official_origin/);
  assert.match(guard, /IMMUTABLE_CANDIDATE_SHA_MISMATCH/);
  assert.match(guard, /require_clean_git_dir "IMMUTABLE_CANDIDATE"/);
  assert.match(guard, /IMMUTABLE_CANDIDATE_OUTSIDE_RELEASE_ROOT/);
  assert.match(guard, /IMMUTABLE_CANDIDATE_SYMLINK/);
});

test("requires backup, legacy manifest, runtime contract, and reversible rename", () => {
  assert.match(deploy, /write_legacy_manifest/);
  assert.match(deploy, /pg_restore --list/);
  assert.match(deploy, /systemctl cat friggafrio-backend\.service/);
  assert.match(deploy, /mv "\$FRIGGAFRIO_DEPLOY_DIR" "\$legacy_dir"/);
  assert.match(deploy, /IMMUTABLE_RELEASE_VERIFY_FAILED_ROLLED_BACK/);
  assert.match(preflight, /LEGACY_MANIFEST_MISSING/);
  assert.match(preflight, /OLD_UNIT_BACKUP_MISSING/);
});

test("rejects missing Admin or unmaterialized runtime through the existing contract", () => {
  assert.match(preflight, /verify_medusa_runtime_contract .*--require-runtime-dependencies/);
  assert.match(deploy, /install_medusa_runtime_dependencies/);
  assert.match(guard, /MEDUSA_RUNTIME_EXTERNAL_SYMLINK/);
});
