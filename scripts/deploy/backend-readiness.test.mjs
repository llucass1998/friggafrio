import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));
const verify = readFileSync(join(root, "deploy/wsl-verify.sh"), "utf8");

test("readiness polling has a bounded monotonic 60-second contract", () => {
  assert.match(verify, /FRIGGAFRIO_READINESS_TIMEOUT_SECONDS.*60/);
  assert.match(verify, /awk '\{print \$1\}' \/proc\/uptime/);
  assert.match(verify, /FRIGGAFRIO_READINESS_INTERVAL_SECONDS.*1/);
  assert.match(verify, /FRIGGAFRIO_READINESS_REQUIRED_200.*3/);
  assert.match(verify, /sleep "\$FRIGGAFRIO_READINESS_INTERVAL_SECONDS"/);
});

test("readiness handles startup refusal and requires three consecutive successful health probes", () => {
  assert.match(verify, /status_code.*curl/);
  assert.match(verify, /status_code" == "000"/);
  assert.match(verify, /consecutive=\$\(\(consecutive \+ 1\)\)/);
  assert.match(verify, /consecutive.*FRIGGAFRIO_READINESS_REQUIRED_200/);
  assert.match(verify, /VERIFY_BACKEND_HEALTH_HTTP_/);
});

test("readiness rejects failed services, restart loops, isolated 200s, and timeout with diagnostics", () => {
  assert.match(verify, /VERIFY_BACKEND_SERVICE_\$state/);
  assert.match(verify, /VERIFY_BACKEND_RESTART_LOOP/);
  assert.match(verify, /consecutive=0/);
  assert.match(verify, /VERIFY_BACKEND_READINESS_TIMEOUT/);
  assert.match(verify, /BACKEND_READINESS_DIAGNOSTICS=BEGIN/);
  assert.match(verify, /journalctl -u friggafrio-backend\.service/);
});

test("only validates Store API, Storefront, and Admin after backend readiness", () => {
  assert.ok(verify.indexOf("wait_for_backend_readiness") < verify.indexOf("VERIFY_STORE_API_FAILED"));
  assert.match(verify, /VERIFY_STOREFRONT_FAILED/);
  assert.match(verify, /VERIFY_ADMIN_APP_FAILED/);
});
