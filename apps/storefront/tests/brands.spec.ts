import { test, expect } from '@playwright/test';

test('Seção de Marcas é renderizada corretamente e contém marcas confirmadas', async ({ page }) => {
  await page.goto('/');

  const sectionHeading = page.locator('h2', { hasText: 'Marcas que você encontra na FriggaFrio' });
  await expect(sectionHeading).toBeVisible();

  const marcasText = page.getByText('Trabalhamos com produtos de marcas reconhecidas');
  await expect(marcasText).toBeVisible();

  // Validate the images are present
  await expect(page.locator('img[alt="Logo da Bitzer"]')).toBeVisible();
  await expect(page.locator('img[alt="Logo da Siccom"]')).toBeVisible();
  await expect(page.locator('img[alt="Logo da Coel"]')).toBeVisible();
  
  // Validate correct source files
  await expect(page.locator('img[alt="Logo da Bitzer"]')).toHaveAttribute('src', '/images/brands/bitzer.webp');
  await expect(page.locator('img[alt="Logo da Siccom"]')).toHaveAttribute('src', '/images/brands/siccom.webp');
  await expect(page.locator('img[alt="Logo da Coel"]')).toHaveAttribute('src', '/images/brands/coel.webp');
});

test('Produtos Especializados tem nome e termina antes do footer', async ({ page }) => {
  await page.goto('/');

  const produtosHeading = page.locator('h2', { hasText: 'Produtos Especializados FriggaFrio' });
  await expect(produtosHeading).toBeVisible();

  // Calculate coordinates to ensure no overlap
  const footerLocator = page.locator('footer');
  const sectionLocator = page.locator('section').filter({ has: produtosHeading });
  
  const sectionBox = await sectionLocator.boundingBox();
  const footerBox = await footerLocator.boundingBox();
  
  expect(sectionBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  
  if (sectionBox && footerBox) {
    expect(sectionBox.y + sectionBox.height).toBeLessThanOrEqual(footerBox.y);
  }
});
