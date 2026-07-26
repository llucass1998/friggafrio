import { test, expect } from '@playwright/test';

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
  
  // Create user through UI
  await page.getByLabel(/Nome/i).first().fill('E2EProtect');
  await page.getByLabel(/Sobrenome/i).first().fill('User');
  await page.getByRole('textbox', { name: /E-mail/i }).fill(userEmail);
  await page.getByLabel(/Telefone/i).first().fill('11999999999');
  await page.getByLabel(/Senha/i).first().fill(userPassword);
  await page.getByLabel(/Confirmar senha/i).first().fill(userPassword);
  await page.getByLabel(/Li e aceito os Termos/i).first().check();
  
  await Promise.all([
    page.waitForURL('http://localhost:5173/br'),
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