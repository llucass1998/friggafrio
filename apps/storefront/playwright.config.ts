// Fail-closed E2E protection: financial specs are opt-in and release gates
// require an explicitly isolated database plus a healthy local backend.
const requireBackend = process.env.E2E_REQUIRE_BACKEND === "1" || Boolean(process.env.CI)
const e2eBackendUrl = process.env.E2E_BACKEND_URL ?? 'http://127.0.0.1:9000'
const parseE2eUrl = (value: string): URL => {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error("E2E_RELEASE_PREFLIGHT_BACKEND_URL_INVALID")
  }
  if (parsed.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(parsed.hostname)) {
    throw new Error("E2E_RELEASE_PREFLIGHT_BACKEND_MUST_BE_LOOPBACK")
  }
  return parsed
}
if (requireBackend && !process.env.TEST_DATABASE_URL) {
  throw new Error("E2E_RELEASE_PREFLIGHT_REQUIRES_TEST_DATABASE_URL")
}
if (requireBackend) {
  parseE2eUrl(e2eBackendUrl)
  let testDatabase: URL
  try {
    testDatabase = new URL(process.env.TEST_DATABASE_URL!)
  } catch {
    throw new Error("E2E_RELEASE_PREFLIGHT_TEST_DATABASE_URL_INVALID")
  }
  if (!["127.0.0.1", "localhost"].includes(testDatabase.hostname) || /(^|_)prod(uction)?($|_)/i.test(testDatabase.pathname)) {
    throw new Error("E2E_RELEASE_PREFLIGHT_TEST_DATABASE_MUST_BE_LOCAL_ISOLATED")
  }
  if (process.env.DATABASE_URL && process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
    throw new Error("E2E_RELEASE_PREFLIGHT_TEST_DATABASE_MUST_BE_ISOLATED")
  }
}
if (requireBackend && process.env.E2E_BACKEND_ISOLATION_ATTESTED !== "1") {
  throw new Error("E2E_RELEASE_PREFLIGHT_BACKEND_ISOLATION_ATTESTATION_REQUIRED")
}

// Keep Playwright's local readiness requests off the environment proxy.
const loopbackHosts = ["127.0.0.1", "localhost"];
if (process.env.VITE_MEDUSA_PUBLISHABLE_KEY) {
  process.env.VITE_MEDUSA_PUBLISHABLE_KEY = process.env.VITE_MEDUSA_PUBLISHABLE_KEY.trim();
}
process.env.NO_PROXY = [...new Set(`${process.env.NO_PROXY ?? ""},${loopbackHosts.join(",")}`.split(",").filter(Boolean))].join(",");
process.env.no_proxy = process.env.NO_PROXY;

import { defineConfig, devices } from '@playwright/test';


export default defineConfig({
  testDir: './tests',
  globalSetup: requireBackend ? './tests/global-setup.ts' : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  // Financial E2E remains outside this recovery wave regardless of env vars.
  testIgnore: ['**/real-checkout-card.spec.ts', '**/real-checkout-session.spec.ts'],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173/@vite/client',
    env: {
      VITE_MEDUSA_BACKEND_URL: e2eBackendUrl,
      // Local publishable keys are public and match the disposable Medusa seed.
      VITE_MEDUSA_PUBLISHABLE_KEY: process.env.VITE_MEDUSA_PUBLISHABLE_KEY ?? 'pk_99c64d5a87e0109049ed7333c05d7160483814d28b14d8a0c1c4f9aa13773cd1',
      NO_PROXY: process.env.NO_PROXY,
      no_proxy: process.env.NO_PROXY,
    },
    reuseExistingServer: !requireBackend,
  },
});
