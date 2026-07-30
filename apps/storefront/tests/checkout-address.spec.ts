import { test, expect, request as playwrightRequest } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { HttpTypes } from "@medusajs/types"

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
let TEST_PRODUCT: HttpTypes.StoreProduct | null = null;
let TEST_VARIANT: HttpTypes.StoreProductVariant | null = null;
let CART_ID = '';

test.beforeAll(async () => {
  const reqContext = await playwrightRequest.newContext();

  const regionsRes = await reqContext.get(`${BACKEND_URL}/store/regions`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
  const regionsData = (await regionsRes.json()) as { regions: HttpTypes.StoreRegion[] };
  const regions = regionsData.regions || [];

  const brRegion = regions.find((r) => r.currency_code === 'brl' && r.countries?.some((c) => c.iso_2 === 'br'));
  if (!brRegion) throw new Error('Região Brasil não encontrada');
  BR_REGION_ID = brRegion.id;

  const productsRes = await reqContext.get(`${BACKEND_URL}/store/products?region_id=${BR_REGION_ID}&fields=*variants.calculated_price,*variants.options,*options,*options.values`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
  const productsData = (await productsRes.json()) as { products: HttpTypes.StoreProduct[] };
  const products = productsData.products || [];

  for (const p of products) {
    if (p.variants && p.variants.length > 0) {
      const validVariant = p.variants.find((v) =>
        v.calculated_price &&
        v.calculated_price.currency_code === 'brl' &&
        v.calculated_price.calculated_amount && v.calculated_price.calculated_amount > 0 &&
        v.manage_inventory === true
      );
      if (validVariant && p.options) {
        TEST_PRODUCT = p;
        TEST_VARIANT = validVariant;
        break;
      }
    }
  }

  if (!TEST_PRODUCT || !TEST_VARIANT) throw new Error('Produto válido não encontrado');

  // Criar cart nativamente
  const cartRes = await reqContext.post(`${BACKEND_URL}/store/carts`, {
    data: { region_id: BR_REGION_ID },
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
  const { cart } = await cartRes.json();
  CART_ID = cart.id;

  // Adicionar produto
  await reqContext.post(`${BACKEND_URL}/store/carts/${CART_ID}/line-items`, {
    data: { variant_id: TEST_VARIANT.id, quantity: 1 },
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
});

test.describe('Checkout Address B2C e2e', () => {

  test('deve preencher e persistir o endereco B2C no checkout corretamente (SP)', async ({ page }) => {
    await page.addInitScript((goodId) => {
      if (!window.sessionStorage.getItem('injected_address_cart')) {
        window.localStorage.setItem('medusa_cart', goodId);
        window.sessionStorage.setItem('injected_address_cart', '1');
      }
    }, CART_ID);

    await page.goto(`${STOREFRONT_URL}/br/checkout`);
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { name: 'Endereço de Entrega' }).first();
    await expect(heading).toBeVisible();

    await page.fill('input[name="first_name"]', 'João');
    await page.fill('input[name="last_name"]', 'Silva');
    await page.fill('input[name="email"]', 'joao.silva@teste.com');
    await page.fill('input[name="phone"]', '11999999999');
    await page.fill('input[name="postal_code"]', '01001-000');
    await page.fill('input[name="logradouro"]', 'Praça da Sé');
    await page.fill('input[name="numero"]', '123');
    await page.fill('input[name="complemento"]', 'Apto 42');
    await page.fill('input[name="bairro"]', 'Sé');
    await page.fill('input[name="city"]', 'São Paulo');
    await page.fill('input[name="province"]', 'São Paulo');

    const submitBtn = page.getByRole('button', { name: 'Continuar para Entrega' });
    await expect(submitBtn).toBeEnabled();

    const updateCartPromise = page.waitForResponse(res => res.url().includes(`/store/carts/${CART_ID}`) && res.request().method() === 'POST');
    await submitBtn.click();

    // Duplo clique bloqueado
    await expect(submitBtn).toBeDisabled();

    const updateRes = await updateCartPromise;
    expect(updateRes.status()).toBe(200);

    const updatedData = (await updateRes.json()) as { cart: HttpTypes.StoreCart };
    const updatedCart = updatedData.cart;

    expect(updatedCart.id).toBe(CART_ID);
    expect(updatedCart.email).toBe('joao.silva@teste.com');
    expect(updatedCart.shipping_address).toBeTruthy();
    expect(updatedCart.shipping_address?.first_name).toBe('João');
    expect(updatedCart.shipping_address?.postal_code).toBe('01001000');
    expect(updatedCart.shipping_address?.address_1).toBe('Praça da Sé, 123 - Sé');
    expect(updatedCart.shipping_address?.address_2).toBe('Apto 42');
    expect(updatedCart.shipping_address?.province).toBe('SP');
    expect(updatedCart.shipping_address?.country_code).toBe('br');

    const cartIdAfter = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(cartIdAfter).toBe(CART_ID);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="first_name"]')).toHaveValue('João');
    await expect(page.locator('input[name="logradouro"]')).toHaveValue('Praça da Sé');
    await expect(page.locator('input[name="bairro"]')).toHaveValue('Sé');
    await expect(page.locator('input[name="email"]')).toHaveValue('joao.silva@teste.com');
    await expect(page.locator('input[name="province"]')).toHaveValue('SP');
  });

  test('deve bloquear checkout para estados fora de SP (RJ, Rio de Janeiro)', async ({ page }) => {
    await page.addInitScript((goodId) => {
      if (!window.sessionStorage.getItem('injected_address_cart3')) {
        window.localStorage.setItem('medusa_cart', goodId);
        window.sessionStorage.setItem('injected_address_cart3', '1');
      }
    }, CART_ID);

    let postCalls = 0;
    page.on('request', req => {
      if (req.url().includes(`/store/carts/${CART_ID}`) && req.method() === 'POST') {
        postCalls++;
      }
    });

    await page.goto(`${STOREFRONT_URL}/br/checkout`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="first_name"]', 'Carlos');
    await page.fill('input[name="last_name"]', 'Roberto');
    await page.fill('input[name="email"]', 'carlos@rj.com');
    await page.fill('input[name="phone"]', '21999999999');
    await page.fill('input[name="postal_code"]', '20000-000');
    await page.fill('input[name="logradouro"]', 'Avenida Rio Branco');
    await page.fill('input[name="numero"]', '100');
    await page.fill('input[name="bairro"]', 'Centro');
    await page.fill('input[name="city"]', 'Rio de Janeiro');

    // Teste 1: RJ
    await page.fill('input[name="province"]', 'RJ');

    const submitBtn = page.getByRole('button', { name: 'Continuar para Entrega' });
    await submitBtn.click();

    await expect(submitBtn).toBeEnabled();
    await expect(page.getByText('No momento, realizamos entregas somente no estado de São Paulo.')).toBeVisible();
    expect(postCalls).toBe(0);

    // Teste 2: Rio de Janeiro extenso
    await page.fill('input[name="province"]', 'Rio de Janeiro');
    await submitBtn.click();
    await expect(page.getByText('No momento, realizamos entregas somente no estado de São Paulo.')).toBeVisible();
    expect(postCalls).toBe(0);

    // Correção RJ -> sp
    await page.fill('input[name="province"]', 'sp');
    const updateCartPromise = page.waitForResponse(res => res.url().includes(`/store/carts/${CART_ID}`) && res.request().method() === 'POST');
    await submitBtn.click();

    const updateRes = await updateCartPromise;
    expect(updateRes.status()).toBe(200);
    expect(postCalls).toBe(1);

    const updatedData = (await updateRes.json()) as { cart: HttpTypes.StoreCart };
    expect(updatedData.cart.shipping_address?.province).toBe('SP');

    const cartIdAfter = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(cartIdAfter).toBe(CART_ID);
  });

  test('deve tratar 400 preservando formulário e id', async ({ page }) => {
    await page.addInitScript((goodId) => {
      if (!window.sessionStorage.getItem('injected_address_cart2')) {
        window.localStorage.setItem('medusa_cart', goodId);
        window.sessionStorage.setItem('injected_address_cart2', '1');
      }
    }, CART_ID);

    await page.route(`**/store/carts/${CART_ID}*`, async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ type: 'invalid_data', message: 'Simulated 400' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${STOREFRONT_URL}/br/checkout`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="first_name"]', 'Maria');
    await page.fill('input[name="last_name"]', 'Silva');
    await page.fill('input[name="email"]', 'maria.silva@teste.com');
    await page.fill('input[name="phone"]', '11999999999');
    await page.fill('input[name="postal_code"]', '01001-000');
    await page.fill('input[name="logradouro"]', 'Praça da Sé');
    await page.fill('input[name="numero"]', '123');
    await page.fill('input[name="bairro"]', 'Sé');
    await page.fill('input[name="city"]', 'São Paulo');
    await page.fill('input[name="province"]', 'SP');

    const submitBtn = page.getByRole('button', { name: 'Continuar para Entrega' });
    await submitBtn.click();

    // UI state assertion without arbitrary timeout
    await expect(submitBtn).toBeEnabled();
    await expect(page.getByText('Não foi possível salvar o endereço')).toBeVisible();
    await expect(page.locator('input[name="first_name"]')).toHaveValue('Maria');

    const cartIdAfter = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(cartIdAfter).toBe(CART_ID);
  });
});