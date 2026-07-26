import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultAuthenticatedPath,
  normalizeReturnTo,
} from "../../src/lib/auth/return-to.ts";

test("returnTo accepts only a path inside the active country", () => {
  assert.equal(
    normalizeReturnTo("/br/account/orders?orderId=order_123", "br"),
    "/br/account/orders?orderId=order_123",
  );
});

test("returnTo rejects absolute and protocol-relative redirects", () => {
  assert.equal(normalizeReturnTo("https://attacker.example", "br"), "/br");
  assert.equal(normalizeReturnTo("//attacker.example/path", "br"), "/br");
});

test("returnTo rejects paths from another country scope", () => {
  assert.equal(normalizeReturnTo("/us/account", "br"), "/br");
});

test("the authenticated fallback normalizes invalid country codes", () => {
  assert.equal(defaultAuthenticatedPath("BR"), "/br");
  assert.equal(defaultAuthenticatedPath("../admin"), "/br");
});
