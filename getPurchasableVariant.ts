import { HttpTypes } from "@medusajs/types"

export function getPurchasableVariant(product: HttpTypes.StoreProduct) {
  if (!product || !product.variants || product.variants.length === 0) {
    return null;
  }

  // Achar uma variante válida, que tenha preço calculado e disponível no estoque
  // Para regras complexas, avaliar metadados
  const isDemoPrice = (product.metadata?.is_demo_price as boolean) === true;
  const priceApprovalStatus = product.metadata?.price_approval_status as string;
  const purchaseEnabled = product.metadata?.purchase_enabled !== false;

  if (isDemoPrice || priceApprovalStatus === "pending" || !purchaseEnabled) {
    return null; // Comercial block
  }

  return product.variants.find((variant) => {
    const hasPrice = variant.calculated_price && variant.calculated_price.calculated_amount > 0;
    const hasInventory = !variant.manage_inventory || variant.allow_backorder || (variant.inventory_quantity && variant.inventory_quantity > 0);
    
    return hasPrice && hasInventory;
  }) || null;
}
