import { HttpTypes } from "@medusajs/types"

// ============ VARIANT OPTIONS KEYMAP ============

export default function getVariantOptionsKeymap(
  variantOptions: HttpTypes.StoreProductVariant["options"]
): Record<string, string> | undefined {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: HttpTypes.StoreProductOptionValue) => {
    acc[varopt.option_id!] = varopt.value
    return acc
  }, {})
}

// Also export as named export for flexibility
export { getVariantOptionsKeymap }

// ============ VARIANT IN STOCK ============

export function isVariantInStock(variant: HttpTypes.StoreProductVariant): boolean {
  if (variant.allow_backorder === true) return true
  if (variant.manage_inventory === false) return true
  if (variant.manage_inventory === true) {
    return typeof variant.inventory_quantity === "number" && variant.inventory_quantity > 0
  }

  // Missing inventory metadata is unknown, never implicitly available.
  return false
}

// ============ SORT PRODUCTS TYPE ============

export type ProductSortOptions =
  | "price_asc"
  | "price_desc"
  | "created_at";
