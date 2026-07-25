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
  await page.getByLabel(/Nome/i).first().fill('E2ELogin');
  await page.getByLabel(/Sobrenome/i).first().fill('User');
  await page.getByRole('textbox', { name: /E-mail/i }).fill(userEmail);
  await page.getByLabel(/Telefone/i).first().fill('11999999999');

  await page.getByLabel(/Senha/i).first().fill(userPassword);
  await page.getByLabel(/Confirmar senha/i).first().fill(userPassword);

  await page.getByLabel(/Li e aceito os Termos/i).first().check();
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await page.waitForURL('http://localhost:5173/br', { timeout: 15000 });

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
  await page.waitForURL('http://localhost:5173/br', { timeout: 15000 });

  // Check if home page renders the authenticated banner
  // The "Olá" text is hidden on mobile (hidden lg:block), so we just check for URL navigation on mobile
  if (page.viewportSize()?.width && page.viewportSize()!.width >= 1024) {
    await expect(page.getByText(/Olá, E2ELogin/i).first()).toBeVisible({ timeout: 10000 });
  }
});
