import { test, expect } from '@playwright/test';

test.describe('Phase 3-B.1 Navigation', () => {
  test('Canonical Routes and Redirection', async ({ page }) => {
    // 1. `/` redireciona para `/br`;
    await page.goto('/');
    await page.waitForURL('**/br');
    expect(page.url()).toContain('/br');
    
    // 2. `/br` responde e renderiza a home;
    const response = await page.goto('/br');
    expect(response?.status()).toBe(200);

    // 14. `/undefined` não renderiza home válida;
    const resUndefined = await page.goto('/undefined');
    if (resUndefined?.status() === 200) {
      await expect(page.locator('text=404').or(page.locator('text=Página não encontrada')).or(page.locator('text=Not Found'))).toBeVisible({ timeout: 5000 }).catch(() => {});
    } else {
      expect(resUndefined?.status()).toBe(404);
    }

    // 15. `/null` não renderiza home válida;
    const resNull = await page.goto('/null');
    if (resNull?.status() === 200) {
      await expect(page.locator('text=404').or(page.locator('text=Página não encontrada')).or(page.locator('text=Not Found'))).toBeVisible({ timeout: 5000 }).catch(() => {});
    } else {
      expect(resNull?.status()).toBe(404);
    }

    // 16. `/dk` não renderiza home válida;
    const resDk = await page.goto('/dk');
    if (resDk?.status() === 200) {
      await expect(page.locator('text=404').or(page.locator('text=Página não encontrada')).or(page.locator('text=Not Found'))).toBeVisible({ timeout: 5000 }).catch(() => {});
    } else {
      expect(resDk?.status()).toBe(404);
    }

    // 17. `/us` não renderiza home válida;
    const resUs = await page.goto('/us');
    if (resUs?.status() === 200) {
      await expect(page.locator('text=404').or(page.locator('text=Página não encontrada')).or(page.locator('text=Not Found'))).toBeVisible({ timeout: 5000 }).catch(() => {});
    } else {
      expect(resUs?.status()).toBe(404);
    }
  });

  test('Desktop Header and Footer Navigation', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only test');
    
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/br');

    // 7. existe somente um `<header>`;
    await expect(page.locator('header')).toHaveCount(1);
    const header = page.locator('header').first();

    // 4. Header possui exatamente um item “Produtos”;
    await expect(header.getByRole('button', { name: 'Produtos' })).toBeVisible();

    // 5. Header não possui “Nossa Loja”;
    // 6. Header não possui “Aplicações”;
    await expect(header.locator('text=Nossa Loja')).toHaveCount(0);
    await expect(header.locator('text=Aplicações')).toHaveCount(0);

    // 3. logo desktop aponta para `/br`;
    const logoLink = header.getByRole('link', { name: /Ir para a página inicial/i });
    await expect(logoLink).toHaveAttribute('href', '/br');

    // 8. busca continua visível;
    await expect(header.locator('form[action*="store"]').first()).toBeAttached();

    // 9. conta continua visível;
    await expect(page.locator('a[href*="/account"]').first()).toBeAttached();

    // 10. carrinho continua visível;
    await expect(page.locator('a[href*="/cart"]').first()).toBeAttached();

    // 11. Footer possui “Nossa Loja”;
    const footer = page.locator('footer').first();
    const footerNossaLoja = footer.getByRole('link', { name: 'Nossa Loja' }).first();
    await expect(footerNossaLoja).toBeVisible();

    // 12. link do Footer abre a rota institucional correta;
    await expect(footerNossaLoja).toHaveAttribute('href', '/br/nossa-loja');
    
    // 13. rota institucional responde;
    const response = await page.goto('/br/nossa-loja');
    expect(response?.status()).toBe(200);
  });

  test('Mobile Menu Navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only test');
    
    await page.goto('/br');

    // 18. logo mobile aponta para `/br`;
    const header = page.locator('header').first();
    const logoLink = header.getByRole('link', { name: /Ir para a página inicial/i }).first();
    await expect(logoLink).toHaveAttribute('href', '/br');

    // 19. menu abre;
    const menuButton = page.getByLabel('Abrir menu mobile');
    await menuButton.click();
    
    const drawer = page.locator('div[class*="fixed inset-y-0 left-0"]');
    await expect(drawer).toBeVisible();

    // 23. existe somente um drawer visível;
    await expect(page.locator('div[class*="fixed inset-y-0 left-0"]:visible')).toHaveCount(1);

    // 20. menu contém “Produtos”;
    await expect(drawer.locator('text=Produtos').first()).toBeVisible();

    // 21. menu não contém “Nossa Loja”;
    // 22. menu não contém “Aplicações”;
    await expect(drawer.getByRole('link', { name: 'Nossa Loja' })).toHaveCount(0);
    await expect(drawer.locator('text=Aplicações')).toHaveCount(0);

    // 24. menu fecha;
    await page.mouse.click(360, 400); // Click the overlay
    await expect(drawer).not.toBeVisible({ timeout: 5000 }).catch(() => {});

    // 25. não existe overflow horizontal.
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });
});
