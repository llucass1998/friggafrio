const { chromium } = require('playwright');

(async () => {
  console.log("Iniciando navegador...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
  });
  
  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('response', response => {
    if (response.url().includes('/store/carts')) {
      console.log(`CART RESPONSE: ${response.url()} [${response.status()}]`);
    }
  });

  try {
    console.log("Navegando para o frontend...");
    await page.goto('http://localhost:8000');
    
    // Aguardar o primeiro produto carregar
    await page.waitForSelector('a[href^="/br/products/"]', { timeout: 15000 });
    
    // Clicar no primeiro produto
    const productLink = await page.$('a[href^="/br/products/"]');
    if (!productLink) throw new Error("Produto não encontrado na tela inicial");
    
    const href = await productLink.getAttribute('href');
    console.log(`Acessando produto: ${href}`);
    await page.goto(`http://localhost:8000${href}`);
    
    console.log("Procurando botão Comprar...");
    await page.waitForSelector('button:has-text("Comprar")', { timeout: 10000 });
    
    console.log("Clicando no botão Comprar...");
    await page.click('button:has-text("Comprar")');
    
    console.log("Aguardando 3 segundos para rede processar...");
    await page.waitForTimeout(3000);
    
    console.log("Teste finalizado.");
  } catch (err) {
    console.error("Erro durante o teste:", err.message);
  } finally {
    await browser.close();
  }
})();
