import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));
const guard = readFileSync(join(root, "deploy/wsl-guard-lib.sh"), "utf8");

function materializationFunction() {
  const match = guard.match(
    /install_medusa_runtime_dependencies\(\) \{([\s\S]*?)\n\}/,
  );
  assert.ok(match, "runtime dependency materialization function must exist");
  return match[1];
}

test("uses explicit pnpm 10 legacy deploy for backend production dependencies", () => {
  const source = materializationFunction();
  assert.match(
    source,
    /pnpm --dir "\$release_dir" --filter backend --prod deploy --legacy "\$dependency_stage"/,
  );
  assert.doesNotMatch(source, /inject-workspace-packages|force-legacy-deploy/);
});

test("keeps dependency materialization fail-closed and scoped to its stage", () => {
  const source = materializationFunction();
  assert.match(source, /\[\[ ! -e "\$dependency_stage" \]\]/);
  assert.match(source, /\[\[ ! -e "\$runtime_dir\/node_modules" \]\]/);
  assert.match(source, /if ! pnpm[\s\S]*?; then/);
  assert.match(source, /rm -rf -- "\$dependency_stage"/);
  assert.match(source, /MEDUSA_RUNTIME_DEPENDENCY_INSTALL_FAILED/);
  assert.match(source, /\[\[ -d "\$dependency_stage\/node_modules" \]\]/);
  assert.match(source, /rm -f -- "\$dependency_stage\/node_modules\/\.pnpm\/node_modules\/backend"/);
  assert.match(source, /require_self_contained_node_modules "\$dependency_stage\/node_modules"/);
});

test("retains quoted paths, production-only deployment, and runtime validation", () => {
  const source = materializationFunction();
  assert.match(source, /--dir "\$release_dir"/);
  assert.match(source, /--prod deploy --legacy/);
  assert.match(source, /mv "\$dependency_stage\/node_modules" "\$runtime_dir\/node_modules"/);
  assert.match(
    source,
    /verify_medusa_runtime_contract "\$release_dir" --require-runtime-dependencies/,
  );
});

test("rejects any dependency symlink that escapes the staged node_modules tree", () => {
  assert.match(guard, /MEDUSA_RUNTIME_EXTERNAL_SYMLINK/);
  assert.match(guard, /find "\$node_modules_dir" -type l -print0/);
  assert.match(guard, /\[\[ "\$target" == "\$node_modules_dir"\/\* \]\]/);
});
