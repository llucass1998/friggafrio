const fs = require('fs');
let content = fs.readFileSync('apps/storefront/tests/home.spec.ts', 'utf-8');
content = content.replace(/page.getByRole\('link', { name: 'Categorias' }\).first\(\)/, "page.getByRole('link', { name: 'Produtos Especializados FriggaFrio' }).first()");
fs.writeFileSync('apps/storefront/tests/home.spec.ts', content);
