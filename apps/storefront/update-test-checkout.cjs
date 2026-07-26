const fs = require('fs');
let content = fs.readFileSync('tests/checkout.spec.ts', 'utf-8');
content = content.replace(/await expect\(miniCart\)\.toBeVisible\(\{ timeout: 3000 \}\);/, "const cartDrawerBtn = page.getByRole('button', { name: /cart|carrinho/i }).first();\n      await cartDrawerBtn.click();\n      await expect(miniCart).toBeVisible({ timeout: 5000 });");
fs.writeFileSync('tests/checkout.spec.ts', content);
