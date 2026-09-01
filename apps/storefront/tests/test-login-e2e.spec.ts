import { test, expect } from '@playwright/test';

test('Should login an existing B2C user successfully', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('response', async res => {
    if (res.status() >= 400) {
      console.log('API ERROR:', res.url(), res.status(), await res.text().catch(() => 'no body'));
    }
  });

  // First create a user to login with
  const userEmail = `e2e.login.${Date.now()}@example.com`;
  const userPassword = 'Password123!';

  await page.goto('http://localhost:5173/br/account/register');
  await page.waitForLoadState('networkidle');

  // Fill in the form
  await page.locator('#pf_firstName').fill('E2ELogin');
  await page.locator('#pf_lastName').fill('User');
  await page.locator('#pf_email').fill(userEmail);
  await page.locator('#pf_phone').fill('11999999999');

  await page.locator('#pf_password').fill(userPassword);
  await page.locator('#pf_confirmPassword').fill(userPassword);

  await page.locator('#pf_firstName').locator('xpath=ancestor::form').getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await page.waitForURL(/\/br\/?$/, { timeout: 15000 });

  // Wait a moment for auth state to propagate fully
  await page.waitForTimeout(500);

  // Logout by directly calling backend and removing token to bypass navigation issues
  await page.evaluate(() => {
    window.localStorage.removeItem('medusa_auth_token');
    window.sessionStorage.removeItem('auth_state');
  });

  // Now we are logged out. Go to login page.
  await page.goto('http://localhost:5173/br/account/login');
  await page.waitForLoadState('networkidle');

  // Login
  await page.getByRole('textbox', { name: /E-mail/i }).fill(userEmail);
  await page.getByLabel(/Senha/i).first().fill(userPassword);

  await page.getByRole('button', { name: 'Entrar' }).click();

  // Wait for redirect to home or some authenticated state
  await page.waitForURL(/\/br\/?$/, { timeout: 15000 });

  // Check if home page renders the authenticated banner
  // The "Olá" text is hidden on mobile (hidden lg:block), so we just check for URL navigation on mobile
  if (page.viewportSize()?.width && page.viewportSize()!.width >= 1024) {
    await expect(page.getByRole('link', { name: 'Minha conta' }).first()).toBeVisible({ timeout: 10000 });
  }
});
