import { HttpTypes } from "@medusajs/types"

export type ProductPurchaseState =
  | { status: "purchasable"; variant: HttpTypes.StoreProductVariant; price: number }
  | { status: "select_variant"; variants: HttpTypes.StoreProductVariant[] }
  | { status: "price_pending"; reason: string }
  | { status: "out_of_stock"; reason: string }
  | { status: "unavailable"; reason: string }

export function getProductPurchaseState(product: HttpTypes.StoreProduct): ProductPurchaseState {
  if (!product || !product.variants || product.variants.length === 0) {
    return { status: "unavailable", reason: "Produto sem variantes" };
  }

  const isDemoPrice = (product.metadata?.is_demo_price as boolean) === true;
  const priceApprovalStatus = product.metadata?.price_approval_status as string;
  const purchaseEnabled = product.metadata?.purchase_enabled !== false;

  if (!purchaseEnabled) {
    return { status: "unavailable", reason: "Compra desabilitada comercialmente" };
  }

  if (priceApprovalStatus === "pending" || isDemoPrice) {
    return { status: "price_pending", reason: "Preço em configuração" };
  }

  // Verifica as variantes válidas (validando price e estoque)
  const validVariants = product.variants.filter((variant: any) => {
    const hasPrice = variant.calculated_price && variant.calculated_price.calculated_amount !== null && variant.calculated_price.calculated_amount !== undefined;

    // Ignorar limite de inventário temporariamente no Storefront local se manage_inventory=true e inventory=0.
    // A API Store.cart fará a rejeição real se realmente não puder vender.
    const hasInventory = true;
    return hasPrice && hasInventory;
  });

  if (validVariants.length === 0) {
    // Se não for possível comprar, investigar porquê
    const hasAnyPrice = product.variants.some((v: any) => v.calculated_price && v.calculated_price.calculated_amount !== null && v.calculated_price.calculated_amount !== undefined);
    if (!hasAnyPrice) {
      return { status: "price_pending", reason: "Consulte o valor" };
    }
    return { status: "out_of_stock", reason: "Sem estoque" };
  }

  if (validVariants.length > 1) {
    return { status: "select_variant", variants: validVariants };
  }

  const price = validVariants[0].calculated_price?.calculated_amount ?? 0;
  return { status: "purchasable", variant: validVariants[0], price };
}
