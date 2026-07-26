const fs = require('fs');
const productActionsPath = 'src/components/product-actions.tsx';
let productActionsContent = fs.readFileSync(productActionsPath, 'utf8');

productActionsContent = productActionsContent.replace(
  'const isQuoteOnly = product?.metadata?.quote_only === true || product?.tags?.some((t: any) => t.value === "b2b") || !inStock;',
  'const isQuoteOnly = product?.metadata?.quote_only === true || product?.tags?.some((t: any) => t.value === "b2b") || !(selectedVariant?.inventory_quantity ? selectedVariant.inventory_quantity > 0 : true);'
);
productActionsContent = productActionsContent.replace(
  'isAdding || (isQuoteOnly ? !selectedVariant : (!selectedVariant || !variant || !inStock))',
  'isAdding || (isQuoteOnly ? !selectedVariant : (!selectedVariant || !(selectedVariant?.inventory_quantity ? selectedVariant.inventory_quantity > 0 : true)))'
);

fs.writeFileSync(productActionsPath, productActionsContent);
