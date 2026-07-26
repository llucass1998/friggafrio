const fs = require('fs');
const file = '../storefront/tests/register.spec.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/await page.locator\('form'\).first\(\).locator\('button\[type="submit"\]'\).click\(\);/g, "await page.locator('main form').first().locator('button[type=\"submit\"]').click();");
content = content.replace(/await expect\(page.locator\('#pj_cnpj'\)\).toBeVisible\(\);/g, "await expect(page.locator('main form').locator('#pj_cnpj')).toBeVisible();");

fs.writeFileSync(file, content);
console.log("Updated tests to look inside main form");
