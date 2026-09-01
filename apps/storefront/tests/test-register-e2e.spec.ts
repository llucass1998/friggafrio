import { test, expect } from '@playwright/test';

test('Should register a new B2C user successfully', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('response', async res => {
    if (res.status() >= 400) {
      console.log('API ERROR:', res.url(), res.status(), await res.text().catch(() => 'no body'));
    }
  });

  await page.goto('http://localhost:5173/br/account/register');
  
  await page.waitForLoadState('networkidle');
  
  // Fill in the form
  await page.locator('#pf_firstName').fill('E2E');
  await page.locator('#pf_lastName').fill('User');
  await page.locator('#pf_email').fill(`e2e.test.${Date.now()}@example.com`);
  await page.locator('#pf_phone').fill('11999999999');

  await page.locator('#pf_password').fill('Password123!');
  await page.locator('#pf_confirmPassword').fill('Password123!');

  await page.locator('#pf_firstName').locator('xpath=ancestor::form').getByRole('checkbox').first().check();
  
  await page.getByRole('button', { name: 'Criar conta' }).click();
  
  // Wait for redirect to home or some authenticated state
  await page.waitForURL(/\/br\/?$/, { timeout: 15000 });

  // Check if home page renders the authenticated banner
  // The "Olá" text is hidden on mobile (hidden lg:block), so we just check for URL navigation on mobile
  if (page.viewportSize()?.width && page.viewportSize()!.width >= 1024) {
    await expect(page.getByRole('link', { name: 'Minha conta' }).first()).toBeVisible({ timeout: 10000 });
  }
});
