const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    console.log(`\n--- REQUEST TO BACKEND ---`);
    console.log(`${req.method} ${req.url}`);
    console.log(`Headers:`, req.headers);
    if (body) console.log(`Body:`, body);

    res.setHeader('Content-Type', 'application/json');

    if (req.url.includes('/store/regions')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        regions: [{ id: "reg_123", currency_code: "brl", countries: [{ iso_2: "br" }] }]
      }));
    } 
    else if (req.url.includes('/store/products')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        products: [{
          id: "prod_123",
          handle: "test-product",
          title: "Produto de Teste",
          options: [{ id: "opt_1", title: "Size" }],
          variants: [{ id: "var_123", title: "M", options: { "opt_1": "M" }, calculated_price: { calculated_amount: 100, currency_code: "BRL" }, inventory_quantity: 10 }]
        }]
      }));
    }
    else if (req.url.includes('/store/customers/me')) {
      res.writeHead(401);
      res.end(JSON.stringify({ message: "unauthorized" }));
    }
    else if (req.method === 'POST' && req.url.match(/\/store\/carts\/cart_.*?\/line-items/)) {
      // Create line item
      // O frontend tem bug quando não retorna status 200, então vou dar 400 pra simular um possível erro real do medusa,
      // pois o frontend pode não estar lidando bem, ou 200 para ver o react-query.
      res.writeHead(400); 
      res.end(JSON.stringify({
        type: 'invalid_data', message: 'Variant is out of stock' 
      }));
    }
    else if (req.method === 'POST' && req.url.match(/\/store\/carts$/)) {
      res.writeHead(200);
      res.end(JSON.stringify({
        cart: { id: "cart_123", region_id: "reg_123" }
      }));
    }
    else {
      res.writeHead(404);
      res.end(JSON.stringify({ message: "Not found" }));
    }
  });
});

server.listen(9000, () => {
  console.log("Mock backend is running on port 9000");
});
