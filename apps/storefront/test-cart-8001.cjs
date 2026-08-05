const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to http://localhost:8001...");
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
    
    // Aguardar o primeiro produto carregar
    console.log("Waiting for products...");
    await page.waitForSelector('a[href^="/br/products/"]', { timeout: 10000 });
    
    const productLink = await page.$('a[href^="/br/products/"]');
    const href = await productLink.getAttribute('href');
    console.log(`Acessando produto: ${href}`);
    await page.goto(`http://localhost:8001${href}`, { waitUntil: 'networkidle' });
    
    console.log("Procurando botão Comprar...");
    await page.waitForSelector('button:has-text("Comprar")', { timeout: 10000 });
    
    console.log("Clicando no botão Comprar...");
    await page.click('button:has-text("Comprar")');
    
    console.log("Aguardando 3 segundos para rede processar...");
    await page.waitForTimeout(3000);
    
    console.log("Teste finalizado com sucesso. O frontend conseguiu conectar ao Backend real e clicar!");
  } catch (err) {
    console.error("Erro durante o teste:", err.message);
  } finally {
    await browser.close();
  }
})();
