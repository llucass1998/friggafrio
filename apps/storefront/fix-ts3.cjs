const fs = require('fs');
const productActionsPath = 'src/components/product-actions.tsx';
let productActionsContent = fs.readFileSync(productActionsPath, 'utf8');

productActionsContent = productActionsContent.replace(
  /\(SKU: \${variant\?\.sku \|\| 'N\/A'}\)/g,
  "(SKU: ${selectedVariant?.sku || 'N/A'})"
);

fs.writeFileSync(productActionsPath, productActionsContent);
