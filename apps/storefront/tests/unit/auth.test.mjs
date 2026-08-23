import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
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

test("returnTo rejects paths containing control characters", () => {
  assert.equal(normalizeReturnTo("/br/account\u0000/orders", "br"), "/br");
  assert.equal(normalizeReturnTo("/br/account\u007f/orders", "br"), "/br");
});

test("the authenticated fallback normalizes invalid country codes", () => {
  assert.equal(defaultAuthenticatedPath("BR"), "/br");
  assert.equal(defaultAuthenticatedPath("../admin"), "/br");
});

test("public login source contains no administrative UI or copy", () => {
  const source = fs.readFileSync(new URL("../../src/pages/login.tsx", import.meta.url), "utf8");
  for (const phrase of ["Painel administrativo", "Acesso administrativo", "Ir para o acesso administrativo", "Medusa", "ADMIN_ACCESS_URL"]) {
    assert.equal(source.includes(phrase), false, `unexpected public admin text: ${phrase}`);
  }
});

test("login route resumes an existing Admin session through the safe session status endpoint", () => {
  const source = fs.readFileSync(
    new URL("../../src/routes/$countryCode/account/login.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /\/store\/auth\/status/);
  assert.match(source, /status\.redirect_to === ["']\/app["']/);
  assert.match(source, /ADMIN_ACCESS_URL \?\? ["']\/app["']/);
});

test("logout treats an already-cleared session as idempotent", () => {
  const source = fs.readFileSync(
    new URL("../../src/lib/context/auth-context.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /isAlreadyLoggedOutError/);
  assert.match(source, /\.status === 401/);
  assert.match(source, /\.status === 404/);
});

test("public bootstrap coalesces StrictMode status checks and protects Customer Me", () => {
  const source = fs.readFileSync(
    new URL("../../src/lib/context/auth-context.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /let authStatusInFlight/);
  assert.match(source, /getSafeAuthStatus/);
  assert.match(source, /status\.actor === "user"/);
  assert.match(source, /return \(await fetchCustomer\(\)\) \? "customer" : null/);
  assert.doesNotMatch(source, /\/store\/auth\/session/);
});
