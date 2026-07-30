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
let OTHER_REGION_ID = '';
let TEST_PRODUCT: any = null;
let TEST_VARIANT: any = null;

test.beforeAll(async () => {
  const reqContext = await playwrightRequest.newContext();

  const regionsRes = await reqContext.get(`${BACKEND_URL}/store/regions`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
  const regionsData = await regionsRes.json();
  const regions = regionsData.regions || [];

  const brRegion = regions.find((r: any) => r.currency_code === 'brl' && r.countries?.some((c: any) => c.iso_2 === 'br'));
  const otherRegion = regions.find((r: any) => r.currency_code !== 'brl');

  if (!brRegion || !otherRegion) {
    throw new Error('Não foi possível encontrar a Região Brasil ou outra região para teste de incompatibilidade');
  }

  BR_REGION_ID = brRegion.id;
  OTHER_REGION_ID = otherRegion.id;

  const productsRes = await reqContext.get(`${BACKEND_URL}/store/products?region_id=${BR_REGION_ID}&fields=*variants.calculated_price,*variants.options,*options,*options.values`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
  });
  const productsData = await productsRes.json();
  const products = productsData.products || [];

  for (const p of products) {
    if (p.variants && p.variants.length > 0) {
      const validVariant = p.variants.find((v: any) =>
        v.calculated_price &&
        v.calculated_price.currency_code === 'brl' &&
        v.calculated_price.calculated_amount > 0 &&
        v.manage_inventory === true
      );
      if (validVariant && p.options) {
        TEST_PRODUCT = p;
        TEST_VARIANT = validVariant;
        break;
      }
    }
  }

  if (!TEST_PRODUCT || !TEST_VARIANT) {
    throw new Error('Nenhum produto válido encontrado');
  }
});

test.describe('Cart validation e2e - Incompatible Cart Recovery', () => {
  let requests: {url: string, method: string}[] = [];

  test.beforeEach(async ({ page }) => {
    requests = [];
    page.on('request', request => {
      if (request.url().includes('/store/carts')) {
        requests.push({
          url: request.url(),
          method: request.method(),
        });
      }
    });
  });

  test('should discard incompatible cart and create new before adding item', async ({ page, request }) => {
    const cartRes = await request.post(`${BACKEND_URL}/store/carts`, {
      data: { region_id: OTHER_REGION_ID },
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    });
    const { cart: badCart } = await cartRes.json();
    const BAD_CART_ID = badCart.id;

    await page.addInitScript((badId) => {
      if (!window.sessionStorage.getItem('injected_bad_cart')) {
        window.localStorage.setItem('medusa_cart', badId);
        window.sessionStorage.setItem('injected_bad_cart', '1');
      }
    }, BAD_CART_ID);

    await page.goto(`${STOREFRONT_URL}/br/products/${TEST_PRODUCT.handle}`);

    const initialCartId = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(initialCartId).toBe(BAD_CART_ID);

    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: TEST_PRODUCT.title }).first()).toBeVisible();

    for (const opt of TEST_VARIANT.options) {
      const optionBtn = page.getByRole('button', { name: opt.value, exact: true });
      await expect(optionBtn).toBeVisible();
      await optionBtn.click();
    }

    const buyBtn = page.getByRole('button', { name: `Comprar ${TEST_PRODUCT.title}`, exact: true });
    await expect(buyBtn).toBeVisible();
    await expect(buyBtn).toBeEnabled();

    const createCartPromise = page.waitForResponse(res => res.url().includes('/store/carts') && !res.url().includes('/line-items') && res.request().method() === 'POST');
    const lineItemPromise = page.waitForResponse(res => res.url().includes('/line-items') && res.request().method() === 'POST');

    await buyBtn.click();

    const createCartRes = await createCartPromise;
    const createCartResBody = await createCartRes.json();
    const newlyCreatedCart = createCartResBody.cart || createCartResBody;

    const lineItemRes = await lineItemPromise;
    expect(lineItemRes.status()).toBe(200);

    const finalCartId = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(finalCartId).toBeTruthy();
    expect(finalCartId).not.toBe(BAD_CART_ID);

    const getOldCartReqs = requests.filter(r => r.url.includes(BAD_CART_ID) && r.method === 'GET');
    expect(getOldCartReqs.length).toBeGreaterThanOrEqual(1);

    const lineItemsOldCart = requests.filter(r => r.url.includes(BAD_CART_ID) && r.url.includes('/line-items') && r.method === 'POST');
    expect(lineItemsOldCart.length).toBe(0);

    const lineItemsNewCart = requests.filter(r => finalCartId && r.url.includes(finalCartId) && r.url.includes('/line-items') && r.method === 'POST');
    expect(lineItemsNewCart.length).toBe(1);

    const createCartReqs = requests.filter(r => r.method === 'POST' && r.url.includes('/store/carts') && !r.url.includes('/line-items'));
    expect(createCartReqs.length).toBeGreaterThanOrEqual(1);

    // Confirm that the newly created cart has BRL region and currency using the local backend to bypass tricky proxy nesting
    const verifyReq = await request.get(`${BACKEND_URL}/store/carts/${finalCartId}`, {
        headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    });
    const verifyData = await verifyReq.json();
    const verifiedCart = verifyData.cart;

    expect(verifiedCart.region_id).toBe(BR_REGION_ID);
    expect(verifiedCart.currency_code).toBe('brl');

    // Drawer assertions
    const itemTitle = page.getByRole('heading', { name: TEST_PRODUCT.title });
    await expect(itemTitle.first()).toBeVisible();

    const subtotalText = page.getByText('R$');
    await expect(subtotalText.first()).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    const storedAfterReload = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(storedAfterReload).toBe(finalCartId);
  });

  test('should reuse valid cart', async ({ page, request }) => {
    const apiContext = request;
    const res = await apiContext.post(`${BACKEND_URL}/store/carts`, {
      data: { region_id: BR_REGION_ID },
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    });
    const { cart } = await res.json();
    const VALID_CART_ID = cart.id;

    await page.addInitScript((goodId) => {
      if (!window.sessionStorage.getItem('injected_good_cart')) {
        window.localStorage.setItem('medusa_cart', goodId);
        window.sessionStorage.setItem('injected_good_cart', '1');
      }
    }, VALID_CART_ID);

    await page.goto(`${STOREFRONT_URL}/br/products/${TEST_PRODUCT.handle}`);
    await page.waitForLoadState('networkidle');

    for (const opt of TEST_VARIANT.options) {
      const optionBtn = page.getByRole('button', { name: opt.value, exact: true });
      await expect(optionBtn).toBeVisible();
      await optionBtn.click();
    }

    const buyBtn = page.getByRole('button', { name: `Comprar ${TEST_PRODUCT.title}`, exact: true });
    await expect(buyBtn).toBeVisible();
    await expect(buyBtn).toBeEnabled();

    const lineItemPromise = page.waitForResponse(res => res.url().includes('/line-items') && res.request().method() === 'POST');
    await buyBtn.click();

    const lineItemRes = await lineItemPromise;
    expect(lineItemRes.status()).toBe(200);

    const storedCartId = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(storedCartId).toBe(VALID_CART_ID);

    const createCartRequests = requests.filter(r => r.method === 'POST' && r.url.includes('/store/carts') && !r.url.includes('/line-items'));
    expect(createCartRequests.length).toBe(0);

    const itemTitle = page.getByRole('heading', { name: TEST_PRODUCT.title });
    await expect(itemTitle.first()).toBeVisible();

    const subtotalText = page.getByText('R$');
    await expect(subtotalText.first()).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    const storedAfterReload = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(storedAfterReload).toBe(VALID_CART_ID);
  });
});