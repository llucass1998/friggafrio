const fs = require('fs');

const settingsPath = 'src/pages/settings.tsx';
let settingsContent = fs.readFileSync(settingsPath, 'utf8');
settingsContent = settingsContent.replace(/preventPadrão/g, 'preventDefault');
fs.writeFileSync(settingsPath, settingsContent);

const productActionsPath = 'src/components/product-actions.tsx';
let productActionsContent = fs.readFileSync(productActionsPath, 'utf8');

if (productActionsContent.includes('const variant = selectedVariant')) {
  // Replace references
  productActionsContent = productActionsContent.replace(/inStock/g, '(variant?.inventory_quantity ? variant.inventory_quantity > 0 : true)');
}

fs.writeFileSync(productActionsPath, productActionsContent);
