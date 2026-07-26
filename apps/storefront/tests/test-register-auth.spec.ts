import { test, expect } from '@playwright/test';

test.describe('Customer Registration UI Verify', () => {
  test('Take a screenshot of the register page to understand what is rendering', async ({ page }) => {
    await page.goto('/br/account/register');
    // Ensure the network is idle
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'register-page-debug.png', fullPage: true });
  });
});
