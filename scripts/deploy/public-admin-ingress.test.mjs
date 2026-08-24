import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));
const guard = readFileSync(join(root, "deploy/wsl-guard-lib.sh"), "utf8");
const preflight = readFileSync(join(root, "deploy/wsl-preflight.sh"), "utf8");

test("preflight verifies the configured public ingress before an immutable swap", () => {
  assert.match(preflight, /verify_public_admin_ingress/);
  assert.match(guard, /FRIGGAFRIO_PUBLIC_ORIGIN\/health/);
  assert.match(guard, /FRIGGAFRIO_PUBLIC_ORIGIN\/br/);
  assert.match(guard, /FRIGGAFRIO_PUBLIC_ORIGIN\/app/);
});

test("a public Admin 404 is distinguished from an internally healthy Admin and fails closed", () => {
  assert.match(guard, /INTERNAL_ADMIN_ROUTE_STATUS/);
  assert.match(guard, /PUBLIC_ADMIN_ROUTE_STATUS/);
  assert.match(guard, /DEPLOY_BLOCKED_PUBLIC_ADMIN_INGRESS_ROUTE_MISSING/);
  assert.match(guard, /DEPLOY_BLOCKED_PUBLIC_ADMIN_ROUTE_UNVERIFIABLE/);
  assert.match(guard, /PUBLIC_INGRESS_HEADER/);
});

test("public health and storefront regressions block before any release swap", () => {
  assert.match(guard, /DEPLOY_BLOCKED_PUBLIC_HEALTHCHECK/);
  assert.match(guard, /DEPLOY_BLOCKED_PUBLIC_STOREFRONT/);
  assert.ok(preflight.indexOf("verify_public_admin_ingress") < preflight.indexOf("DEPLOY_LOCK"));
});
