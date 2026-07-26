import { test, expect } from '@playwright/test';

test.describe('Página Quem Somos', () => {
  test('Renderiza a página, seções e equipe', async ({ page }) => {
    await page.goto('/quem-somos');

    // Verificar se o hero renderiza
    await expect(page.locator('h1', { hasText: 'Quem Somos' })).toBeVisible();

    // Verificar se a História renderiza
    await expect(page.locator('h2', { hasText: 'Nossa História' })).toBeVisible();

    // Verificar se Diretoria renderiza
    await expect(page.locator('h2', { hasText: 'Diretoria' })).toBeVisible();

    // Verificar se Quem faz a Frigga renderiza
    await expect(page.locator('h2', { hasText: 'Quem faz a Frigga' })).toBeVisible();

    // Verificar se a foto do fundador carrega sem quebrar
    const founderImg = page.locator('img[alt*="Paulo Neulaender"]');
    await expect(founderImg).toBeVisible();

    // Verificar uma equipe aleatória da lista (ex: "Tita Arantes")
    await expect(page.locator('h3', { hasText: 'Tita Arantes' })).toBeVisible();

    // Check CTAs
    await expect(page.locator('text=Fale pelo WhatsApp')).toBeVisible();
    await expect(page.locator('text=Conheça nossas lojas')).toBeVisible();
  });
});
