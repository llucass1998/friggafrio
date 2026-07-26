const fs = require('fs');
const path = 'C:/Users/lluca/Documents/Codex/projeto friggagafrio/apps/storefront/tests/test-auth-protection-e2e.spec.ts';
let content = fs.readFileSync(path, 'utf8');

// The test waits for the home page after login. Let's make sure it handles /br/account redirecting to login correctly
content = content.replace(
  "await page.goto('http://localhost:5173/br/account');\n  await page.waitForLoadState('networkidle');\n\n  // 2. Deve ser redirecionado para o login",
  "await page.goto('http://localhost:5173/br/account');\n  await page.waitForLoadState('networkidle');\n  await page.waitForURL(/.*login.*/, { timeout: 15000 });\n\n  // 2. Deve ser redirecionado para o login"
);

// We need to wait for navigation to complete explicitly after login
content = content.replace(
  "// Espera estar logado (redirecionado para a home após o registro)\n  await page.waitForURL('http://localhost:5173/br', { timeout: 15000 });",
  "// Espera estar logado (redirecionado para a home após o registro)\n  await page.waitForURL('http://localhost:5173/br', { timeout: 15000 });\n  await page.waitForLoadState('networkidle');"
);

fs.writeFileSync(path, content);
console.log("Updated E2E test to be more robust.");
