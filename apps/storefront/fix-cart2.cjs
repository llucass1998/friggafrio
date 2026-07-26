const fs = require('fs');
let content = fs.readFileSync('src/components/cart.tsx', 'utf8');
content = content.replace(/,\s*,\s*DrawerFooter,/g, ',\n  DrawerFooter,');
fs.writeFileSync('src/components/cart.tsx', content);
