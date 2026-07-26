const fs = require('fs');
let content = fs.readFileSync('apps/storefront/tests/checkout.spec.ts', 'utf-8');
content = content.replace(/getByRole\('button', { name: \/add to cart\|adicionar ao carrinho\|comprar\/i }\)/, "getByRole('button', { name: /add to cart|adicionar ao carrinho|comprar/i }).first()");
fs.writeFileSync('apps/storefront/tests/checkout.spec.ts', content);

let homeContent = fs.readFileSync('apps/storefront/tests/home.spec.ts', 'utf-8');
homeContent = homeContent.replace(/page.getByRole\('link', { name: 'Gases Refrigerantes' }\).first\(\)/, "page.getByRole('link', { name: 'Categorias' }).first()");
fs.writeFileSync('apps/storefront/tests/home.spec.ts', homeContent);
