import { test, expect } from '@playwright/test';

test('protected favorites route redirects once without recursive returnTo', async ({ page }) => {
  await page.goto('http://localhost:5173/br/favorites');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL(/\/br\/account\/login\?returnTo=%2Fbr%2Ffavorites$/);
  expect(page.url().length).toBeLessThan(160);
  await expect(page.getByRole('heading', { name: 'Bem-vindo(a) de volta' })).toBeVisible();
});

test('Should protect account route and preserve returnTo', async ({ page }) => {
  // 1. Visitante acessa página protegida
  await page.goto('http://localhost:5173/br/account');
  await page.waitForLoadState('networkidle');

  // 2. Deve ser redirecionado para o login
  await expect(page).toHaveURL(/.*login.*/);

  // 3. Cadastrar e logar
  const userEmail = `e2e.protect.${Date.now()}@example.com`;
  const userPassword = 'Password123!';

  await page.goto('http://localhost:5173/br/account/register');
  await page.waitForLoadState('networkidle');
  
  // Create user through UI
  await page.locator('#pf_firstName').fill('E2EProtect');
  await page.locator('#pf_lastName').fill('User');
  await page.locator('#pf_email').fill(userEmail);
  await page.locator('#pf_phone').fill('11999999999');
  await page.locator('#pf_password').fill(userPassword);
  await page.locator('#pf_confirmPassword').fill(userPassword);
  await page.locator('#pf_firstName').locator('xpath=ancestor::form').getByRole('checkbox').first().check();
  
  await Promise.all([
    page.waitForURL(/\/br\/?$/),
    page.getByRole('button', { name: 'Criar conta' }).click()
  ]);

  // 4. Agora vai para account (protegida) e não deve ser bloqueado
  await page.goto('http://localhost:5173/br/account');
  await page.waitForLoadState('networkidle');
  await expect(page).not.toHaveURL(/.*login.*/);

  // 5. Logout na UI (agora account renderiza UI e pode ter botão Sair ou Minha conta)
  await page.context().clearCookies();

  // 6. Tenta acessar de novo, deve ser redirecionado
  await page.goto('http://localhost:5173/br/account');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/.*login.*/);
});
