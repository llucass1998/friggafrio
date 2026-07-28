import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    // Acessa a página principal
    await page.goto('/br');
  });

  test('should display contact form correctly', async ({ page }) => {
    // Rolar até a seção de contato
    const contactSection = page.locator('#contato');
    await expect(contactSection).toBeVisible();
    
    // Verificar elementos essenciais
    await expect(contactSection.locator('h2', { hasText: 'Fale Conosco' })).toBeVisible();
    await expect(contactSection.locator('label', { hasText: 'Nome completo' })).toBeVisible();
    await expect(contactSection.locator('label', { hasText: 'E-mail' })).toBeVisible();
    await expect(contactSection.locator('label', { hasText: 'Mensagem' })).toBeVisible();
    await expect(contactSection.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const contactSection = page.locator('#contato');
    
    // Tentar enviar formulário vazio
    await contactSection.locator('button[type="submit"]').click();
    
    // Verificar mensagens de erro de validação do Zod
    await expect(page.locator('text=Nome deve ter pelo menos 2 caracteres')).toBeVisible();
    await expect(page.locator('text=E-mail inválido')).toBeVisible();
    await expect(page.locator('text=Mensagem deve ter pelo menos 10 caracteres')).toBeVisible();
  });

  test('should intercept honeypot filling by bots', async ({ page }) => {
    const contactSection = page.locator('#contato');
    
    // Preencher campos obrigatórios
    await page.fill('#name', 'Bot User');
    await page.fill('#email', 'bot@example.com');
    await page.fill('#message', 'Esta é uma mensagem de teste automatizado válida.');
    
    // Preencher o honeypot (que o usuário normal não veria)
    // Precisamos forçar pois ele está escondido
    await page.evaluate(() => {
      const el = document.getElementById('website') as HTMLInputElement;
      if (el) el.value = 'http://spam-website.com';
    });
    
    // Disparar um evento de input para o react-hook-form pegar o valor modificado via evaluate
    await page.locator('#website').dispatchEvent('input');

    // Ao tentar enviar, o formulário deveria dar erro de honeypot, ou mockar sucesso silencioso
    await contactSection.locator('button[type="submit"]').click();
    
    // A validação do front do Zod vai pegar
    await expect(page.locator('text=Honeypot acionado')).toBeVisible();
  });
  
  test('should submit valid form successfully', async ({ page }) => {
    // Interceptar a chamada de API
    await page.route('**/api/store/contact-requests', async (route) => {
      const request = route.request();
      expect(request.method()).toBe('POST');
      
      const postData = JSON.parse(request.postData() || '{}');
      expect(postData.name).toBe('Usuário Teste');
      expect(postData.email).toBe('teste@example.com');
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          contact_request: {
            id: 'req_123',
            status: 'pending',
            created_at: new Date().toISOString()
          }
        })
      });
    });

    const contactSection = page.locator('#contato');
    
    // Preencher formulário validamente
    await page.fill('#name', 'Usuário Teste');
    await page.fill('#email', 'teste@example.com');
    await page.fill('#phone', '11999999999');
    await page.fill('#subject', 'Dúvida sobre compressor');
    await page.fill('#message', 'Olá, gostaria de saber se vocês têm o compressor Elgin 1/3 disponível.');
    
    // Enviar formulário
    await contactSection.locator('button[type="submit"]').click();
    
    // Verificar estado de sucesso (loader aparece, depois some e mostra check)
    // O botão muda para 'Enviando...' e depois a tela de sucesso aparece
    await expect(page.locator('text=Mensagem enviada com sucesso!')).toBeVisible();
  });
});
