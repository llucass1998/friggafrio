const fs = require('fs');
let code = fs.readFileSync('use-cart.ts', 'utf8');
if (!code.includes('removeStoredCart,')) {
  code = code.replace('getStoredCart,', 'getStoredCart,\n  removeStoredCart,');
  fs.writeFileSync('use-cart.ts', code);
}
