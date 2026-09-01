import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const caddyfile = readFileSync(
  new URL("./Caddyfile.wsl", import.meta.url),
  "utf8",
);

test("routes Medusa auth and admin paths to the backend", () => {
  assert.match(
    caddyfile,
    /@backend path[^\n]*\/store\/\*[^\n]*\/auth\/\*[^\n]*\/admin[^\n]*\/admin\/\*/,
  );
  assert.match(
    caddyfile,
    /handle @backend[\s\S]*reverse_proxy \{\$FRIGGAFRIO_BACKEND_UPSTREAM:http:\/\/172\.25\.20\.159:9000\}/,
  );
});

test("delivers a strict report-only CSP for the static Admin application", () => {
  assert.match(caddyfile, /@admin_app path \/app \/app\/\*/);
  assert.match(caddyfile, /handle @admin_app[\s\S]*Content-Security-Policy-Report-Only/);
  assert.match(caddyfile, /default-src 'self';[\s\S]*object-src 'none';[\s\S]*frame-src 'none'/);
  assert.doesNotMatch(caddyfile, /Content-Security-Policy-Report-Only[^\n]*(?:\*|unsafe-inline|unsafe-eval)/);
});
