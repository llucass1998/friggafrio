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
  await page.getByLabel(/Nome/i).first().fill('E2E');
  await page.getByLabel(/Sobrenome/i).first().fill('User');
  await page.getByRole('textbox', { name: /E-mail/i }).fill(`e2e.test.${Date.now()}@example.com`);
  await page.getByLabel(/Telefone/i).first().fill('11999999999');
  
  await page.getByLabel(/Senha/i).first().fill('Password123!');
  await page.getByLabel(/Confirmar senha/i).first().fill('Password123!');
  
  await page.getByLabel(/Li e aceito os Termos/i).first().check();
  
  await page.getByRole('button', { name: 'Criar conta' }).click();
  
  // Wait for redirect to home or some authenticated state
  await page.waitForURL('http://localhost:5173/br', { timeout: 15000 });

  // Check if home page renders the authenticated banner
  // The "Olá" text is hidden on mobile (hidden lg:block), so we just check for URL navigation on mobile
  if (page.viewportSize()?.width && page.viewportSize()!.width >= 1024) {
    await expect(page.getByText(/Olá, E2E/i).first()).toBeVisible({ timeout: 10000 });
  }
});
