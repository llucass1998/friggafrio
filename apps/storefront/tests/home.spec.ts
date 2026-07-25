import { test, expect } from '@playwright/test';

test('Página Inicial carrega e exibe componentes Frigga', async ({ page }) => {
  await page.goto('/');

  // Título e logo principal
  await expect(page.getByText('Frigga', { exact: true }).first()).toBeVisible();

  // Hero Section
  await expect(page.locator('h1')).toContainText('Refrigeração profissional');

  // Categorias em Destaque
  await expect(page.getByText('Categorias em Destaque')).toBeVisible();

  // Produtos em Destaque
  await expect(page.getByText('Produtos em Destaque')).toBeVisible();

  // Seção de Serviços
  await expect(page.getByText('Serviços Especializados Frigga')).toBeVisible();
});

test('Header contém busca e navegação corretas', async ({ page }) => {
  await page.goto('/');
  
  // Campo de busca
  await expect(page.getByPlaceholder(/Busque por produto, gás/i)).toBeVisible();
  
  // Navegação
  await expect(page.getByRole('link', { name: 'Gases Refrigerantes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compressores' })).toBeVisible();
});
