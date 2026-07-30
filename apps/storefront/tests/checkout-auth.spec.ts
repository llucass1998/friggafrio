import { test, expect, request as playwrightRequest } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
let TEST_VARIANT: any = null;

test.beforeAll(async () => {
  const reqContext = await playwrightRequest.newContext();
  const regionsRes = await reqContext.get(`${BACKEND_URL}/store/regions`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
  const regionsData = await regionsRes.json();
  const brRegion = (regionsData.regions || []).find((r: any) => r.currency_code === 'brl');
  if (!brRegion) throw new Error('Região Brasil não encontrada');
  BR_REGION_ID = brRegion.id;

  const productsRes = await reqContext.get(`${BACKEND_URL}/store/products?region_id=${BR_REGION_ID}&fields=*variants.calculated_price,*variants.options,*options,*options.values`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
  const productsData = await productsRes.json();
  for (const p of (productsData.products || [])) {
    if (p.variants?.length > 0) {
      TEST_VARIANT = p.variants[0];
      break;
    }
  }
});

test.describe('Checkout Auth e2e', () => {

  test('visitante abre checkout e ve painel de autenticacao com rotas validas', async ({ page, request }) => {
    const reqContext = request;
    const cartRes = await reqContext.post(`${BACKEND_URL}/store/carts`, {
      data: { region_id: BR_REGION_ID },
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    });
    const { cart } = await cartRes.json();
    const CART_ID = cart.id;

    await reqContext.post(`${BACKEND_URL}/store/carts/${CART_ID}/line-items`, {
      data: { variant_id: TEST_VARIANT.id, quantity: 1 },
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    });

    await page.addInitScript((cid) => {
      window.localStorage.setItem('medusa_cart', cid);
    }, CART_ID);

    let addressUpdates = 0;
    let newCarts = 0;
    let paymentSessions = 0;

    page.on('request', req => {
      if (req.method() === 'POST') {
        if (req.url().match(/\/store\/carts\/cart_[^\/]+$/)) addressUpdates++;
        if (req.url().endsWith('/store/carts')) newCarts++;
        if (req.url().includes('/payment-sessions')) paymentSessions++;
      }
    });

    await page.goto(`${STOREFRONT_URL}/br/checkout`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Entre para finalizar sua compra' })).toBeVisible();
    await expect(page.getByText('Para continuar com o pedido, entre na sua conta ou faça seu cadastro.')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Endereço de Entrega' })).not.toBeVisible();

    const btnEntrar = page.locator('main').getByRole('link', { name: 'Entrar', exact: true });
    const btnCriarConta = page.locator('main').getByRole('link', { name: 'Criar conta' });
    const btnVoltar = page.locator('main').getByRole('link', { name: 'Voltar ao carrinho' });

    await expect(btnEntrar).toBeVisible();
    await expect(btnCriarConta).toBeVisible();
    await expect(btnVoltar).toBeVisible();

    const hrefEntrar = await btnEntrar.getAttribute('href');
    expect(hrefEntrar).toContain('returnTo=%2Fbr%2Fcheckout');

    const currentCartId = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(currentCartId).toBe(CART_ID);
    expect(addressUpdates).toBe(0);
    expect(newCarts).toBe(0);
    expect(paymentSessions).toBe(0);
  });
});
