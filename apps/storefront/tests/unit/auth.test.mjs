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

test("returnTo rejects the login page as a post-login destination", () => {
  assert.equal(normalizeReturnTo("/br/account/login", "br"), "/br");
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

test("Google login preserves the validated returnTo and prevents duplicate navigation", () => {
  const source = fs.readFileSync(new URL("../../src/pages/login.tsx", import.meta.url), "utf8");
  assert.match(source, /normalizeReturnTo\(search\.returnTo, countryCode\)/);
  assert.match(source, /setIsGoogleLoading\(true\)/);
  assert.match(source, /disabled=\{isGoogleLoading\}/);
  assert.match(source, /google_error === "authentication_failed"/);
  assert.match(source, /role="alert"/);
});

test("login route resumes an existing Admin session at /app", () => {
  const source = fs.readFileSync(
    new URL("../../src/routes/$countryCode/account/login.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /\/store\/auth\/session/);
  assert.match(source, /session\.redirect_to === ["']\/app["']/);
  assert.match(source, /ADMIN_ACCESS_URL \?\? ["']\/app["']/);
});

test("logout treats an already-cleared session as idempotent", () => {
  const source = fs.readFileSync(
    new URL("../../src/lib/context/auth-context.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /status === 401 \|\| status === 404/);
  assert.match(source, /isAlreadyLoggedOutError/);
});

test("the canonical auth provider probes the Medusa session before classifying a guest", () => {
  const source = fs.readFileSync(
    new URL("../../src/lib/context/auth-context.tsx", import.meta.url),
    "utf8",
  );
  const valueSource = fs.readFileSync(
    new URL("../../src/lib/context/auth-context-value.ts", import.meta.url),
    "utf8",
  );

  assert.match(valueSource, /authState: "loading" \| "authenticated" \| "guest"/);
  assert.match(source, /void probeSession\(\)/);
  assert.match(source, /sdk\.store\.customer\.retrieve/);
  assert.doesNotMatch(source, /if \(!readAuthHint\(\)\)/);
});

test("public pages defer the optional session probe while checkout verifies it immediately", () => {
  const source = fs.readFileSync(
    new URL("../../src/lib/context/auth-context.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /useLocation/);
  assert.match(source, /requiresImmediateSession/);
  assert.match(source, /window\.requestIdleCallback/);
  assert.match(source, /probeSession\(\{ includeAdmin: false \}\)/);
  assert.match(source, /if \(requiresImmediateSession\) \{\s*void probeSession\(\)/);
});

test("checkout renders a session skeleton and never shows guest controls to an authenticated customer", () => {
  const source = fs.readFileSync(
    new URL("../../src/components/checkout-customer-step.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /authState === "loading"/);
  assert.match(source, /isAuthenticatedSession/);
  assert.match(source, /customer\.first_name \|\| value\.firstName/);
  assert.match(source, /customer\.email \|\| value\.email/);
  assert.match(source, /Compra vinculada à conta de/);
  assert.match(source, /Compra como convidado/);
});
