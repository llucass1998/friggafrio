const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Vamos interceptar as requests de API que causam erro por falta de backend (9000) e mocká-las 
  // para permitir que o frontend renderize o produto e execute o hook useAddToCart
  await page.route('**/*localhost:9000/store/regions*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ regions: [{ id: "reg_123", currency_code: "brl", countries: [{ iso_2: "br" }] }] })
    });
  });

  await page.route('**/*localhost:9000/store/products*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        products: [{
          id: "prod_123",
          handle: "test-product",
          title: "Produto de Teste",
          options: [{ id: "opt_1", title: "Size" }],
          variants: [{ id: "var_123", title: "M", options: { "opt_1": "M" }, calculated_price: { calculated_amount: 100, currency_code: "BRL" }, inventory_quantity: 10 }]
        }]
      })
    });
  });

  await page.route('**/*localhost:9000/store/customers/me*', route => {
    route.fulfill({ status: 401, body: JSON.stringify({ message: "unauthorized" }) });
  });
  
  // Aqui está a rota problemática que você (usuário) mencionou que precisava ser fixada no frontend
  await page.route('**/*localhost:9000/store/carts*', async route => {
    console.log("-----------------------------------------");
    console.log(`INTERCEPTADO POST /store/carts: ${route.request().url()}`);
    console.log(`METHOD: ${route.request().method()}`);
    const reqBody = await route.request().postData();
    console.log(`BODY: ${reqBody}`);
    console.log("-----------------------------------------");
    
    if (route.request().method() === 'POST' && route.request().url().endsWith('/store/carts')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cart: { id: "cart_new_123", region_id: "reg_123" } })
      });
    } else if (route.request().method() === 'POST' && route.request().url().includes('/line-items')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cart: { id: "cart_new_123", items: [{ id: "item_1", variant_id: "var_123", quantity: 1 }] } })
      });
    } else {
      route.fulfill({ status: 200, body: JSON.stringify({ cart: { id: "cart_new_123" } }) });
    }
  });

  try {
    await page.goto('http://localhost:8000/br/products/test-product', { waitUntil: 'networkidle' });
    
    await page.waitForTimeout(1000);
    const hasButton = await page.$('button:has-text("Comprar")');
    if (hasButton) {
      console.log("Clicando no botão Comprar...");
      await page.click('button:has-text("Comprar")');
      await page.waitForTimeout(2000); // Aguarda request
    } else {
      console.log("Botão não encontrado");
    }
  } catch (err) {
    console.error("Erro durante o teste:", err.message);
  } finally {
    await browser.close();
  }
})();
