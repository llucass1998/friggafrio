import puppeteer from 'playwright';

(async () => {
  const browser = await puppeteer.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Navigating to store...");
    await page.goto('http://localhost:5174/br/store');
    
    console.log("Waiting for products to load...");
    await page.waitForSelector('a[href*="/br/products/"]', { timeout: 10000 });
    
    const productLinks = await page.$$('a[href*="/br/products/"]');
    if (productLinks.length > 0) {
      console.log("Clicking first product...");
      await productLinks[0].click();
      
      console.log("Waiting for 'Comprar' button...");
      await page.waitForSelector('button:has-text("Comprar")', { timeout: 10000 });
      
      console.log("Setting up response interception for /store/carts...");
      let cartRequestCount = 0;
      let cartResponseData = null;
      
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/store/carts')) {
          cartRequestCount++;
          console.log(`[API] Cart API response received: ${url} (Status: ${response.status()})`);
          try {
            const json = await response.json();
            cartResponseData = json;
          } catch (e) {
            console.log(`[API] Could not parse JSON from ${url}`);
          }
        }
      });
      
      console.log("Clicking 'Comprar' button...");
      await page.click('button:has-text("Comprar")');
      
      console.log("Waiting a bit to see if requests are made...");
      await page.waitForTimeout(5000);
      
      console.log(`Cart Requests captured: ${cartRequestCount}`);
      if (cartResponseData) {
         console.log(JSON.stringify(cartResponseData).substring(0, 200) + '...');
      }
      
      // verify cart count or local storage
      const localStorageCart = await page.evaluate(() => localStorage.getItem('medusa_cart'));
      console.log("Local Storage medusa_cart:", localStorageCart);
      
      const cartCount = await page.evaluate(() => {
        const span = document.querySelector('a[href="/br/cart"] span');
        return span ? span.textContent : 'Not found';
      });
      console.log("Cart count in UI:", cartCount);

    } else {
      console.log("No products found to click");
    }
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    await browser.close();
  }
})();
