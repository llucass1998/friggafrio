const fs = require('fs');
let content = fs.readFileSync('tests/home.spec.ts', 'utf-8');
content = content.replace(/page.getByRole\('link', { name: 'Categorias' }\).first\(\)/, "page.getByText('Ver todos os produtos').first()");
fs.writeFileSync('tests/home.spec.ts', content);
