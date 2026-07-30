import { test, expect } from '@playwright/test';

test.describe('Cart validation e2e', () => {
  const BAD_CART_ID = 'cart_01KYT2D0YQEN1ZZKDQ40E119P0';
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

  test('should discard incompatible cart and create new before adding item', async ({ page }) => {
    // Navigate to real product PDP
    await page.goto('http://localhost:5173/br/products/gas-r22-freon');

    // Inject invalid cart into localStorage once
    await page.evaluate((badId) => {
      window.localStorage.setItem('medusa_cart', badId);
    }, BAD_CART_ID);

    const cartId = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(cartId).toBe(BAD_CART_ID);

    await page.waitForLoadState('networkidle');

    // Title Check
    await expect(page.locator('h1', { hasText: 'Gás R22 Freon' }).first()).toBeVisible();

    // The option is 'Botija'. Find the button and click it to select variant
    const optionBtn = page.getByRole('button', { name: 'Botija', exact: true });
    await expect(optionBtn).toBeVisible();
    await optionBtn.click();
    
    // Now the buy button should be enabled and accessible as "Comprar Gás R22 Freon"
    const buyBtn = page.getByRole('button', { name: 'Comprar Gás R22 Freon', exact: true });
    await expect(buyBtn).toBeVisible();
    await expect(buyBtn).toBeEnabled();

    // Click Buy!
    await buyBtn.click();

    // Let the mutation fly
    await page.waitForResponse(res => res.url().includes('/line-items') && res.status() === 200, { timeout: 10000 });

    const newCartId = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(newCartId).toBeTruthy();
    expect(newCartId).not.toBe(BAD_CART_ID);
    
    const lineItemRequestsOnBad = requests.filter(r => 
      r.url.includes(BAD_CART_ID) && r.url.includes('/line-items') && r.method === 'POST'
    );
    expect(lineItemRequestsOnBad.length).toBe(0);

    const lineItemRequestsOnNew = requests.filter(r => 
      newCartId && r.url.includes(newCartId) && r.url.includes('/line-items') && r.method === 'POST'
    );
    expect(lineItemRequestsOnNew.length).toBe(1);

    // Refresh test
    await page.reload();
    await page.waitForLoadState('networkidle');
    const storedAfterReload = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(storedAfterReload).toBe(newCartId);
  });

  test('should reuse valid cart', async ({ page, request }) => {
    const apiContext = request;
    const res = await apiContext.post('http://localhost:9000/store/carts', {
      data: { region_id: 'reg_01KYC122G9SCKQK6W4919J9QF9' },
      headers: { 'x-publishable-api-key': 'pk_1f40fb864c3b636f387432c8788dc4b8de3380f9c9fc497bb12f88cf654a3af8' }
    });
    const { cart } = await res.json();
    const VALID_CART_ID = cart.id;

    await page.goto('http://localhost:5173/br/products/gas-r22-freon');
    await page.evaluate((goodId) => {
      window.localStorage.setItem('medusa_cart', goodId);
    }, VALID_CART_ID);

    await page.waitForLoadState('networkidle');

    const optionBtn = page.getByRole('button', { name: 'Botija', exact: true });
    await expect(optionBtn).toBeVisible();
    await optionBtn.click();
    
    const buyBtn = page.getByRole('button', { name: 'Comprar Gás R22 Freon', exact: true });
    await expect(buyBtn).toBeVisible();
    await expect(buyBtn).toBeEnabled();
    
    await buyBtn.click();
    
    await page.waitForResponse(res => res.url().includes('/line-items') && res.status() === 200, { timeout: 10000 });

    const storedCartId = await page.evaluate(() => window.localStorage.getItem('medusa_cart'));
    expect(storedCartId).toBe(VALID_CART_ID);

    const createCartRequests = requests.filter(r => r.method === 'POST' && r.url.endsWith('/store/carts'));
    expect(createCartRequests.length).toBe(0);
  });
});
