import { test, expect } from '@playwright/test';

test.describe('Filtro de Categoria na Rota de Loja (Fase 4-A)', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar rotas para evitar lentidão
    await page.route('**/store/categories*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          categories: [
            { id: 'cat_1', name: 'Categoria 1', handle: 'cat-1' },
            { id: 'cat_2', name: 'Categoria 2', handle: 'cat-2' }
          ]
        })
      });
    });
  });

  test('A página /store deve renderizar e aceitar limpar os filtros', async ({ page }) => {
    let categoryFiltered = false;
    
    await page.route('**/store/products*', async (route) => {
      const url = route.request().url();
      if (url.includes('category_id=cat_1')) {
        categoryFiltered = true;
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [], count: 0 })
      });
    });
    
    // Visita a loja com filtro na URL
    await page.goto('/br/store?category=cat_1');
    
    // Deve ter consultado a API com o category_id
    expect(categoryFiltered).toBeTruthy();
    
    // O botão de limpar filtros deve aparecer (pois não encontrou produtos e tem filtros)
    const clearBtn = page.getByRole('button', { name: 'Limpar Busca e Filtros' });
    await expect(clearBtn).toBeVisible();
    
    // Ao clicar, deve limpar o parâmetro da URL
    await clearBtn.click();
    await page.waitForURL('**/br/store');
    expect(page.url()).not.toContain('category=cat_1');
  });
  
  test('O link de "Ver todas as categorias" da Home deve ir sem filtros', async ({ page }) => {
    await page.goto('/br');
    
    // Interceptar listagem vazia
    await page.route('**/store/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [], count: 0 })
      });
    });
    
    const viewAllLink = page.getByRole('link', { name: 'Ver todas as categorias' }).first();
    await viewAllLink.click();
    
    await page.waitForURL('**/br/store');
    expect(page.url()).not.toContain('category=');
  });
});
