import { test, expect } from '@playwright/test';

test.describe('Contact Section - Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display horizontal layout and floating labels', async ({ page }) => {
    const contactSection = page.locator('#contato');
    await expect(contactSection).toBeVisible();

    // Scroll down to the contact section to ensure it is visible and hydrated
    await contactSection.scrollIntoViewIfNeeded();

    // The copy area
    await expect(contactSection.locator('h2', { hasText: 'Fale com a FriggaFrio' })).toBeVisible();
    await expect(contactSection.locator('h3', { hasText: 'Converse com nossos técnicos e consultores de vendas.' })).toBeVisible();
    
    // Check floating labels structure
    const nameLabel = contactSection.locator('label[for="name"]');
    await expect(nameLabel).toHaveText('Nome completo *');
    const nameInput = contactSection.locator('input#name');
    await expect(nameInput).toHaveAttribute('placeholder', 'Nome completo');
  });

  test('should validate form and show error for short message', async ({ page }) => {
    const contactSection = page.locator('#contato');
    await expect(contactSection).toBeVisible();
    await contactSection.scrollIntoViewIfNeeded();

    // Fill required fields but a short message
    await page.fill('input#name', 'João Silva');
    await page.fill('input#email', 'joao@example.com');
    await page.fill('textarea#message', 'Curta');
    
    // Click submit
    await page.click('button[type="submit"]');

    // Expect zod validation error
    await expect(page.locator('text="Mensagem deve ter pelo menos 10 caracteres"')).toBeVisible();
  });

  test('should submit successfully when form is valid', async ({ page }) => {
    // Mock the backend endpoint
    await page.route('**/store/contact-requests', async route => {
      expect(route.request().method()).toBe('POST');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    const contactSection = page.locator('#contato');
    await expect(contactSection).toBeVisible();
    await contactSection.scrollIntoViewIfNeeded();

    await page.fill('input#name', 'Maria Oliveira');
    await page.fill('input#email', 'maria@example.com');
    await page.fill('input#phone', '11999999999');
    await page.fill('input#subject', 'Dúvida sobre orçamento');
    await page.fill('textarea#message', 'Olá, gostaria de saber mais sobre o orçamento de peças.');
    
    // Check that honeypot works - we don't fill it, it remains empty
    
    await page.click('button[type="submit"]');

    // Check success state
    await expect(page.locator('text="Mensagem enviada com sucesso!"')).toBeVisible();
    await expect(page.locator('text="Agradecemos o seu contato."')).toBeVisible();
    await expect(page.locator('button:has-text("Enviar nova mensagem")')).toBeVisible();
  });

  test('should display server errors correctly', async ({ page }) => {
    // Mock the backend endpoint to return an error
    await page.route('**/store/contact-requests', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro forçado do servidor para testes.' })
      });
    });

    const contactSection = page.locator('#contato');
    await expect(contactSection).toBeVisible();
    await contactSection.scrollIntoViewIfNeeded();

    await page.fill('input#name', 'Carlos Mendes');
    await page.fill('input#email', 'carlos@example.com');
    await page.fill('textarea#message', 'Mensagem de teste suficientemente longa para passar pelo zod.');
    
    await page.click('button[type="submit"]');

    // Check error state
    await expect(page.locator('text="Erro forçado do servidor para testes."')).toBeVisible();
  });
});
