import { test, expect, request as playwrightRequest } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { HttpTypes } from "@medusajs/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BACKEND_URL = process.env.VITE_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const STOREFRONT_URL = 'http://localhost:5173';
const PUBLISHABLE_KEY = process.env.VITE_MEDUSA_PUBLISHABLE_KEY || '';

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_MEDUSA_PUBLISHABLE_KEY in .env");
}

let BR_REGION_ID = '';
let TEST_VARIANT: HttpTypes.StoreProductVariant | null = null;

test.beforeAll(async () => {
  const reqContext = await playwrightRequest.newContext();
  const regionsRes = await reqContext.get(`${BACKEND_URL}/store/regions`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
  const regionsData = await regionsRes.json() as { regions: HttpTypes.StoreRegion[] };
  const brRegion = (regionsData.regions || []).find((r) => r.currency_code === 'brl');
  if (!brRegion) throw new Error('Região Brasil não encontrada');
  BR_REGION_ID = brRegion.id;

  const productsRes = await reqContext.get(`${BACKEND_URL}/store/products?region_id=${BR_REGION_ID}&fields=*variants.calculated_price,*variants.options,*options,*options.values`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
  const productsData = await productsRes.json() as { products: HttpTypes.StoreProduct[] };
  for (const p of (productsData.products || [])) {
    if (p.variants && p.variants.length > 0) {
      TEST_VARIANT = p.variants[0];
      break;
    }
  }
});

test.describe('Cart UI Translations', () => {

  test('deve exibir textos em portugues e validar pluralizacao', async ({ page, request }) => {
    // 1 item no carrinho
    const reqContext = request;
    const cartRes = await reqContext.post(`${BACKEND_URL}/store/carts`, {
      data: { region_id: BR_REGION_ID },
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    });
    const cartData = await cartRes.json() as { cart: HttpTypes.StoreCart };
    const CART_ID = cartData.cart.id;

    if (TEST_VARIANT?.id) {
      await reqContext.post(`${BACKEND_URL}/store/carts/${CART_ID}/line-items`, {
        data: { variant_id: TEST_VARIANT.id, quantity: 1 },
        headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
      });
    }

    await page.addInitScript((cid) => {
      window.sessionStorage.setItem('injected_ui_cart', '1');
      window.localStorage.setItem('medusa_cart', cid);
    }, CART_ID);

    await page.goto(`${STOREFRONT_URL}/br/cart`);
    await page.waitForLoadState('networkidle');

    // Asserts 1 item
    await expect(page.getByRole('heading', { name: 'Seu carrinho' })).toBeVisible();
    await expect(page.getByText('1 item pronto para finalizar a compra')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continuar comprando' })).toBeVisible();
    
    // Asserts seções
    await expect(page.getByRole('heading', { name: 'ITENS DO PEDIDO' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'RESUMO DO PEDIDO' })).toBeVisible();
    
    // Asserts summary values
    await expect(page.locator('span', { hasText: /^Frete$/ })).toBeVisible();
    await expect(page.locator('span', { hasText: /^Impostos$/ })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'CUPOM DE DESCONTO' })).toBeVisible();
    
    const btnAdicionarCupom = page.locator('button', { hasText: '+ Adicionar cupom' });
    if (await btnAdicionarCupom.isVisible()) {
        await btnAdicionarCupom.click();
    }
    await expect(page.getByPlaceholder('Digite o cupom')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aplicar', exact: true })).toBeVisible();

    // Action buttons
    await expect(page.getByRole('button', { name: 'Finalizar compra' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Solicitar orçamento' })).toBeVisible();

    // Trust indicators
    await expect(page.locator('span[aria-label="Compra segura"]')).toBeVisible();
    await expect(page.locator('span[aria-label="Entrega rápida"]')).toBeVisible();

    // Aria-labels
    await expect(page.locator('button[aria-label="Remover item"]').first()).toBeVisible();
    await expect(page.locator('button[aria-label="Aumentar quantidade"]').first()).toBeVisible();

    // Pluralization > 1
    const btnAumentar = page.locator('button[aria-label="Aumentar quantidade"]').first();
    const updatePromise = page.waitForResponse(res => res.url().includes('/line-items') && res.request().method() === 'POST');
    await btnAumentar.click();
    await updatePromise;
    
    // Allow re-render
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('2 itens prontos para finalizar a compra')).toBeVisible();
    
    // Cancelar cupom (só simula a view abrindo)
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible();

    // Nenhum texto inglês antigo:
    await expect(page.getByText('Your Cart')).not.toBeVisible();
    await expect(page.getByText('ORDER ITEMS')).not.toBeVisible();
    await expect(page.getByText('ORDER SUMMARY')).not.toBeVisible();
  });
});
