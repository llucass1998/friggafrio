import { test, expect } from '@playwright/test';

const viewports = [
  { width: 360, height: 800, name: 'Mobile' },
  { width: 768, height: 1024, name: 'Tablet' },
  { width: 1440, height: 900, name: 'Desktop' },
];

for (const viewport of viewports) {
  test(`Layout Home em viewport ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    // Verifica se não há overflow horizontal verificando a largura do body vs viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth);
    
    // Verifica menu no mobile vs desktop
    if (viewport.width < 1024) {
      await expect(page.getByLabel('Abrir menu mobile').first()).toBeVisible();
    } else {
      await expect(page.getByLabel('Abrir menu mobile').first()).not.toBeVisible();
    }
  });
}
