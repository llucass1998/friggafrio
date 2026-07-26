const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let targetRequest = null;
  let targetResponse = null;
  let errorResponse = null;

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/store/carts')) {
      console.log(`[REQUEST] ${request.method()} ${url}`);
      // console.log('Headers:', request.headers());
      if (request.method() === 'POST' && url.endsWith('/store/carts')) {
          targetRequest = request;
          console.log('Cart Creation Request Payload:', request.postData());
      }
      if (request.method() === 'POST' && url.includes('/line-items')) {
          targetRequest = request;
          console.log('Add to Cart Request Payload:', request.postData());
      }
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/store/carts')) {
      console.log(`[RESPONSE] ${response.status()} ${url}`);
      try {
        const body = await response.text();
        if (response.status() >= 400) {
            errorResponse = {
                status: response.status(),
                body: body
            };
            console.log('Error Response Body:', body);
        }
      } catch (e) {
        console.log('Could not read response body:', e.message);
      }
    }
  });

  try {
    console.log('Navigating to storefront...');
    await page.goto('http://localhost:5174');
    
    console.log('Waiting for products to load...');
    await page.waitForSelector('a[href*="/products/"]', { timeout: 10000 });
    
    // We'll just directly go to the API to simulate adding to cart
    // Since the UI seems to be mostly showing "Solicitar Orçamento" (Request Quote)
    
    console.log('Evaluating fetch to create cart...');
    const result = await page.evaluate(async () => {
        try {
            // First get a region
            const regionRes = await fetch('http://localhost:9000/store/regions', {
                headers: { 'x-publishable-api-key': 'pk_1f40fb864c3b636f387432c8788dc4b8de3380f9c9fc497bb12f88cf654a3af8' }
            });
            const regionData = await regionRes.json();
            const regionId = regionData.regions[0].id;
            
            // Get a product variant
            const prodRes = await fetch(`http://localhost:9000/store/products?region_id=${regionId}`, {
                headers: { 'x-publishable-api-key': 'pk_1f40fb864c3b636f387432c8788dc4b8de3380f9c9fc497bb12f88cf654a3af8' }
            });
            const prodData = await prodRes.json();
            const variantId = prodData.products[0].variants[0].id;
            
            // Create cart
            const cartRes = await fetch('http://localhost:9000/store/carts', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-publishable-api-key': 'pk_1f40fb864c3b636f387432c8788dc4b8de3380f9c9fc497bb12f88cf654a3af8'
                },
                body: JSON.stringify({
                    region_id: regionId,
                    items: [{ variant_id: variantId, quantity: 1 }]
                })
            });
            
            const cartData = await cartRes.json();
            return {
                status: cartRes.status,
                cartData,
                payload: { region_id: regionId, items: [{ variant_id: variantId, quantity: 1 }] }
            };
        } catch (e) {
            return { error: e.message };
        }
    });
    
    console.log('API call result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    await browser.close();
  }
})();
