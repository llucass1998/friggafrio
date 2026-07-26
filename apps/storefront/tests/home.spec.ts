import { test, expect } from '@playwright/test';

test('Página Inicial carrega e exibe componentes Frigga', async ({ page }) => {
  await page.goto('/');

  // Categorias em Destaque
  await expect(page.getByText('Categorias em Destaque')).toBeVisible();

  // Produtos em Destaque
  await expect(page.locator('h2', { hasText: 'Produtos Especializados FriggaFrio' })).toBeVisible();

  // Seção de Serviços
  await expect(page.getByText('Marcas que você encontra na FriggaFrio')).toBeVisible();
});

test('Header contém busca e navegação corretas', async ({ page }) => {
  await page.goto('/');

  // Navegação
  await expect(page.getByRole('link', { name: 'Quem Somos' }).first()).toBeVisible();
});
