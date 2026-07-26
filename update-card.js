const fs = require('fs');

let content = fs.readFileSync('apps/storefront/src/components/public-product-card.tsx', 'utf8');

const importsToAdd = `
import { useState } from "react"
import { useCartDrawer } from "@/lib/context/cart"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addToCart } from "@/lib/data/cart"
import { Loader2, ShoppingCart, Check } from "lucide-react"
import { toast } from "sonner"
`;

content = content.replace('import { ProductImagePlaceholder } from "./product/ProductImagePlaceholder"', 'import { ProductImagePlaceholder } from "./product/ProductImagePlaceholder"\n' + importsToAdd);

// Helper function
const helperFn = `
function getPurchasableVariant(product: HttpTypes.StoreProduct) {
  if (!product || !product.variants || product.variants.length === 0) {
    return null;
  }

  const isDemoPrice = (product.metadata?.is_demo_price as boolean) === true;
  const priceApprovalStatus = product.metadata?.price_approval_status as string;
  const purchaseEnabled = product.metadata?.purchase_enabled !== false;

  if (isDemoPrice || priceApprovalStatus === "pending" || !purchaseEnabled) {
    return null;
  }

  return product.variants.find((variant: any) => {
    const hasPrice = variant.calculated_price && variant.calculated_price.calculated_amount > 0;
    const hasInventory = !variant.manage_inventory || variant.allow_backorder || (variant.inventory_quantity && variant.inventory_quantity > 0);
    
    return hasPrice && hasInventory;
  }) || null;
}
`;
content = content.replace('export function PublicProductCard', helperFn + '\nexport function PublicProductCard');

// Update logic inside the component
const logicToAdd = `
  const purchasableVariant = getPurchasableVariant(product)
  const isAvailable = !!purchasableVariant

  const { openCart } = useCartDrawer()
  const queryClient = useQueryClient()
  const [isSuccess, setIsSuccess] = useState(false)

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!purchasableVariant) throw new Error("Produto indisponível")
      return await addToCart({
        variant_id: purchasableVariant.id,
        quantity: 1,
        country_code: countryCode,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      setIsSuccess(true)
      openCart()
      toast.success(\`\${product.title} adicionado ao carrinho\`)
      
      setTimeout(() => {
        setIsSuccess(false)
      }, 2000)
    },
    onError: (err) => {
      console.error("Error adding to cart:", err)
      toast.error("Não foi possível adicionar o produto ao carrinho")
    }
  })

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAvailable || addToCartMutation.isPending || isSuccess) return
    addToCartMutation.mutate()
  }
`;
content = content.replace('const brlPrice = product.variants?.[0]?.calculated_price?.calculated_amount\n    ? product.variants[0].calculated_price.calculated_amount\n    : null\n\n  return (', 'const brlPrice = product.variants?.[0]?.calculated_price?.calculated_amount\n    ? product.variants[0].calculated_price.calculated_amount\n    : null\n' + logicToAdd + '\n  return (');

// Replace the bottom actions
const oldActions = `<div className="grid grid-cols-2 gap-2">
            <Link
              to={"/$countryCode/products/$handle" as string} params={{ countryCode, handle: product.handle }}
              className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-semibold text-[var(--color-primary)] bg-white border border-[var(--color-primary)] rounded-[var(--radius-button-sm)] hover:bg-[var(--color-surface-soft)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] col-span-1"
            >
              Detalhes
            </Link>
            <button
              className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-semibold text-[var(--color-navy)] bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-button-sm)] hover:bg-gray-200 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] col-span-1"
            >
              Orçamento
            </button>
          </div>`;

const newActions = `<button
            onClick={handleBuy}
            disabled={!isAvailable || addToCartMutation.isPending || isSuccess}
            aria-label={\`Comprar \${product.title}\`}
            className={\`flex items-center justify-center w-full min-h-[44px] px-3 py-2.5 text-sm font-semibold rounded-[var(--radius-button-sm)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] \${
              !isAvailable 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                : isSuccess
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] motion-interactive"
            }\`}
          >
            {addToCartMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Adicionando...
              </span>
            ) : isSuccess ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Adicionado
              </span>
            ) : !isAvailable ? (
              "Indisponível"
            ) : (
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Comprar
              </span>
            )}
          </button>`;

content = content.replace(oldActions, newActions);

fs.writeFileSync('apps/storefront/src/components/public-product-card.tsx', content);
