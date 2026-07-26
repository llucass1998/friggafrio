const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:5174');
  await page.waitForSelector('a[href*="/products/"]', { timeout: 10000 });
  const links = await page.$$('a[href*="/products/"]');
  await links[0].click();
  
  await page.waitForLoadState('networkidle');
  const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent));
  console.log('Available buttons:', buttons);
  await browser.close();
})();
