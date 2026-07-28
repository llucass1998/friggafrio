import { test, expect } from '@playwright/test';

test.describe('Carrossel de Categorias em Destaque (Fase 4-A)', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar a API de categorias para fornecer mock de dados previsível
    await page.route('**/store/categories?include_ancestors_tree=false', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          categories: [
            { id: 'cat_1', name: 'Categoria 1', handle: 'cat-1', metadata: { image: 'http://example.com/img1.jpg' } },
            { id: 'cat_2', name: 'Categoria 2', handle: 'cat-2' },
            { id: 'cat_3', name: 'Categoria 3', handle: 'cat-3', metadata: { image: 'http://example.com/img3.jpg' } },
            { id: 'cat_4', name: 'Categoria 4', handle: 'cat-4' },
            { id: 'cat_5', name: 'Categoria 5', handle: 'cat-5', metadata: { image: 'http://example.com/img5.jpg' } },
            { id: 'cat_6', name: 'Categoria 6', handle: 'cat-6' },
            { id: 'cat_7', name: 'Categoria 7', handle: 'cat-7' }
          ]
        })
      });
    });
    
    await page.goto('/br');
  });

  test('Deve renderizar os botões de navegação no lado direito do cabeçalho', async ({ page }) => {
    const prevBtn = page.getByRole('button', { name: 'Ver categoria anterior' });
    const nextBtn = page.getByRole('button', { name: 'Ver próxima categoria' });
    
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
  });

  test('Deve usar botões de navegação para interagir com o carrossel', async ({ page }) => {
    const prevBtn = page.getByRole('button', { name: 'Ver categoria anterior' });
    const nextBtn = page.getByRole('button', { name: 'Ver próxima categoria' });
    
    // O botão de voltar deve começar desabilitado
    await expect(prevBtn).toBeDisabled();
    
    // O botão de avançar deve estar habilitado 
    await expect(nextBtn).toBeEnabled();
    
    // Clica para avançar
    await nextBtn.click();
    
    // Agora o botão voltar deve estar habilitado
    await expect(prevBtn).toBeEnabled();
  });

  test('Deve renderizar fallback para categorias sem imagem na metadata', async ({ page }) => {
    // A Categoria 2 não tem imagem, deve mostrar a primeira letra
    const cat2Card = page.getByRole('link', { name: 'C Categoria 2' });
    await expect(cat2Card).toBeVisible();
    await expect(cat2Card.locator('text=C')).toBeVisible();
  });
  
  test('Deve filtrar catálogo pela categoria ao clicar em um card', async ({ page }) => {
    const cat1Card = page.getByRole('link', { name: 'Categoria 1' });
    
    // Interceptar a API de produtos para não travar na página de listagem
    await page.route('**/store/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [], count: 0 })
      });
    });
    
    await cat1Card.click();
    
    // Deve navegar para a página store com o parâmetro correto
    await page.waitForURL('**/br/store?category=cat_1*');
    
    // O filtro na URL deve estar presente
    expect(page.url()).toContain('category=cat_1');
  });
});
