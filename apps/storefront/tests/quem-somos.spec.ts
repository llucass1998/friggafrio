import { test, expect } from '@playwright/test';

test.describe('Página Quem Somos', () => {
  test('Renderiza a página, seções e equipe', async ({ page }) => {
    await page.goto('/quem-somos');

    // Verificar se o hero renderiza
    await expect(page.locator('h1', { hasText: 'Quem Somos' })).toBeVisible();

    // Verificar se a História renderiza
    await expect(page.locator('h2', { hasText: /Nossa Hist.ria/ })).toBeVisible();

    // Verificar se Diretoria renderiza
    await expect(page.locator('h2', { hasText: 'Diretoria' })).toBeVisible();

    // Verificar se Quem faz a Frigga renderiza
    await expect(page.locator('h2', { hasText: 'Quem faz a Frigga' })).toBeVisible();

    // Verificar se a foto do fundador carrega sem quebrar
    const founderImg = page.locator('img[alt*="Paulo Neulaender"]');
    await expect(founderImg).toBeVisible();

    // Verificar uma equipe aleatória da lista (ex: "Tita Arantes")
    await expect(page.getByRole('heading', { name: 'Tita Arantes' }).first()).toBeVisible();

    // Leadership carousel excludes the founder and exposes bounded controls.
    await expect(page.getByRole('button', { name: /Diretor anterior/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pr.ximo diretor/ })).toBeVisible();
    await expect(page.locator('[aria-label="Diretoria FriggaFrio"] [data-carousel-original="true"]')).toHaveCount(5);
    await expect(page.locator('[aria-label="Diretoria FriggaFrio"] img[alt*="Paulo"]')).toHaveCount(0);

    // Check CTAs
    await expect(page.locator('text=Fale pelo WhatsApp')).toBeVisible();
    await expect(page.getByRole('link', { name: /Conhe.*nossas lojas/ })).toBeVisible();
  });
});
