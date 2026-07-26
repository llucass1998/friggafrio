const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:5174');
  await page.waitForSelector('a[href*="/products/"]', { timeout: 10000 });
  
  // Get all links to find one with a price (likely to have add to cart)
  const links = await page.$$('a[href*="/products/"]');
  console.log(`Found ${links.length} product links`);
  
  // Try the second one since the first seems to be "Preço em confirmação" (Price TBD)
  if (links.length > 1) {
      await links[1].click();
  } else {
      await links[0].click();
  }
  
  await page.waitForLoadState('networkidle');
  const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent));
  console.log('Available buttons on 2nd product:', buttons);
  await browser.close();
})();
