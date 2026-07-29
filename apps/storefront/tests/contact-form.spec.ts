import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    // Acessa a página principal
    await page.goto('/br');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // Wait for hydration
  });

  test('should display contact form correctly', async ({ page }) => {
    // Rolar até a seção de contato
    const contactSection = page.locator('#contato');
    await expect(contactSection).toBeVisible();
    
    // Verificar elementos essenciais
    await expect(contactSection.locator('h2', { hasText: 'Fale com a FriggaFrio' })).toBeVisible();
    await expect(contactSection.locator('label', { hasText: 'Nome completo' })).toBeVisible();
    await expect(contactSection.locator('label', { hasText: 'E-mail' })).toBeVisible();
    await expect(contactSection.locator('label', { hasText: 'Mensagem' })).toBeVisible();
    await expect(page.locator('#contato').locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const contactSection = page.locator('#contato');

    // Garantir que o componente está hidratado no client-side
    await contactSection.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // Wait for hydration
    await page.waitForTimeout(1000);

    // Garantir que a validação aconteça através de interação real de usuário
    await page.locator('#name').fill('a'); // Inválido (min 2)
    await page.locator('#email').fill('emailinvalido'); // Inválido
    await page.locator('#message').fill('curta'); // Inválido (min 10)
    
    // Tirar o foco para disparar validação onBlur/onChange
    await page.locator('#message').blur();
    
    // Submeter formulário para garantir que hook-form registre todos os erros
    await page.locator('#contato button[type="submit"]').click();

    // Verificar mensagens de erro de validação do Zod
    await expect(page.getByText('Nome deve ter pelo menos 2 caracteres')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('E-mail inválido')).toBeVisible();
    await expect(page.getByText('Mensagem deve ter pelo menos 10 caracteres')).toBeVisible();
  });

  test('should intercept honeypot filling by bots', async ({ page }) => {
    const contactSection = page.locator('#contato');
    
    // Preencher campos obrigatórios
    await page.fill('#name', 'Bot User');
    await page.fill('#email', 'bot@example.com');
    await page.fill('#message', 'Esta é uma mensagem de teste automatizado válida.');
    
    // Preencher o honeypot (que o usuário normal não veria)
    // Precisamos forçar pois ele está escondido
    await page.locator('#website').fill('http://spam-website.com', { force: true });
    await page.locator('#website').blur();

    // Ao tentar enviar, o formulário deveria dar erro de honeypot, ou mockar sucesso silencioso
    // Submeter formulário
    await page.locator('#contato button[type="submit"]').click();

    // A validação do front do Zod vai pegar
    await expect(page.getByText('Honeypot acionado')).toBeAttached({ timeout: 10000 });
  });
  
  test('should submit valid form successfully', async ({ page }) => {
    // Interceptar a chamada de API
    await page.route('**/store/contact-requests', async (route) => {
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
    // Enviar formulário
    await page.locator('#contato button[type="submit"]').click();

    // Verificar estado de sucesso
    await expect(page.getByText('Mensagem enviada com sucesso!')).toBeVisible({ timeout: 10000 });
  });
});
