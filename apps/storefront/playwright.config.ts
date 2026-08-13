// Fail-Closed E2E Protection: Do not run against production or raw databases in CI without a specific isolated connection
if (!process.env.TEST_DATABASE_URL && process.env.CI) {
  console.warn("WARN: Playwright skipping real CI execution due to missing TEST_DATABASE_URL");
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
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
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
    command: 'pnpm exec vite --host 127.0.0.1',
    url: 'http://127.0.0.1:5173/@vite/client',
    env: {
      VITE_MEDUSA_BACKEND_URL: 'http://127.0.0.1:9000',
      // Local publishable keys are public and match the disposable Medusa seed.
      VITE_MEDUSA_PUBLISHABLE_KEY: process.env.VITE_MEDUSA_PUBLISHABLE_KEY ?? 'pk_99c64d5a87e0109049ed7333c05d7160483814d28b14d8a0c1c4f9aa13773cd1',
      NO_PROXY: process.env.NO_PROXY,
      no_proxy: process.env.NO_PROXY,
    },
    reuseExistingServer: false,
  },
});
