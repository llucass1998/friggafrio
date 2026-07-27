import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"
import { ProductOptionSelect } from "@/components/product-option-select"
import { useCartDrawer } from "@/lib/context/cart"
import { useAddToCart } from "@/lib/hooks/use-cart"
import { getVariantOptionsKeymap } from "@/lib/utils/product"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { formatCurrencyAmount } from "@/lib/utils/currency"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { HttpTypes } from "@medusajs/types"
import { useLocation } from "@tanstack/react-router"
import { isEqual } from "lodash-es"
import { memo, useEffect, useMemo, useState } from "react"
import { Loader2, ShoppingCart, Check } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

type StoreVariantWithCalculatedPrice = HttpTypes.StoreProductVariant & {
  calculated_price?: {
    calculated_amount?: number | null
    currency_code?: string | null
  } | null
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
}

type ProductActionsProps = {
  product: HttpTypes.StoreProduct;
  region: HttpTypes.StoreRegion;
  disabled?: boolean;
};

// Helper function to safely get variant prices without any cast
function getVariantCalculatedPrice(variant?: StoreVariantWithCalculatedPrice | null): number | null {
  if (!variant?.calculated_price?.calculated_amount) return null;
  return variant.calculated_price.calculated_amount;
}

function getVariantCurrencyCode(variant?: StoreVariantWithCalculatedPrice | null, defaultCode = "BRL"): string {
  if (variant?.calculated_price?.currency_code) {
    return variant.calculated_price.currency_code;
  }
  return defaultCode;
}

function getVariantInventoryAvailability(variant?: StoreVariantWithCalculatedPrice | null): boolean {
  if (!variant) return false;

  if (variant.manage_inventory) {
    if (variant.inventory_quantity === undefined || variant.inventory_quantity === null) {
      return false; // Fail closed for unknown inventory
    }
    return variant.inventory_quantity > 0;
  }

  return true;
}

const ProductActions = memo(function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | undefined>>({})
  const [isSuccess, setIsSuccess] = useState(false)
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "br"

  const addToCartMutation = useAddToCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const { openCart } = useCartDrawer()
  const queryClient = useQueryClient()

  useEffect(() => {
    setSelectedOptions({})
  }, [product?.handle])

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    const variants = product?.variants
    if (variants?.length === 1) {
      const firstVariant = variants[0]
      const optionsKeymap = getVariantOptionsKeymap(firstVariant?.options ?? [])
      setSelectedOptions(optionsKeymap ?? {})
    }
  }, [product?.variants])

  const selectedVariant = useMemo(() => {
    if (!product?.variants || product?.variants.length === 0) return

    if (product?.variants.length === 1 && (!product?.options || product?.options.length === 0)) {
      return product?.variants[0]
    }

    return product?.variants.find((v) => {
      const optionsKeymap = getVariantOptionsKeymap(v?.options ?? [])
      return isEqual(optionsKeymap, selectedOptions)
    })
  }, [product?.variants, product?.options, selectedOptions])

  // check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product?.variants?.some((v) => {
      const optionsKeymap = getVariantOptionsKeymap(v?.options ?? [])
      return isEqual(optionsKeymap, selectedOptions)
    })
  }, [product?.variants, selectedOptions])

  const setOptionValue = (optionId: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: value }))
  }

  // --- Purchase Logic Block ---
  const purchaseState = getProductPurchaseState(product)

  // Validates if the selected variant matches purchasing rules
  const canBuySelected = useMemo(() => {
    if (!selectedVariant) return false;
    if (purchaseState.status === "unavailable" || purchaseState.status === "price_pending") return false;

    const price = getVariantCalculatedPrice(selectedVariant as StoreVariantWithCalculatedPrice);
    if (price === null) return false;

    // Check real inventory status
    if (!getVariantInventoryAvailability(selectedVariant as StoreVariantWithCalculatedPrice)) return false;

    return true;
  }, [selectedVariant, purchaseState])

  const displayPrice = selectedVariant
    ? getVariantCalculatedPrice(selectedVariant as StoreVariantWithCalculatedPrice) ?? 0
    : purchaseState.status === "purchasable"
      ? purchaseState.price
      : getVariantCalculatedPrice(product.variants?.[0] as StoreVariantWithCalculatedPrice) ?? 0

  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !canBuySelected) return null

    addToCartMutation.mutateAsync(
      {
        variant_id: selectedVariant.id,
        quantity: 1,
        country_code: countryCode,
        product,
        variant: selectedVariant,
        region,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["cart"] })
          setIsSuccess(true)
          openCart()
          toast.success(`${product.title} adicionado ao carrinho`)
          setTimeout(() => setIsSuccess(false), 2000)
        },
        onError: (_err) => {
          toast.error("Não foi possível adicionar o produto ao carrinho")
        }
      }
    )
  }

  // Generate Button Text
  let buttonText = "Comprar"
  let buttonDisabled = true

  if (purchaseState.status === "unavailable") {
    buttonText = "Indisponível"
  } else if (purchaseState.status === "price_pending") {
    buttonText = "Preço em confirmação"
  } else if (!selectedVariant) {
    buttonText = "Selecione uma opção"
  } else if (!isValidVariant || !canBuySelected) {
    buttonText = "Sem estoque"
  } else {
    buttonDisabled = false
  }

  const displayCurrencyCode = countryCode === "br" ? "BRL" : (
     selectedVariant ? getVariantCurrencyCode(selectedVariant as StoreVariantWithCalculatedPrice) : getVariantCurrencyCode(product.variants?.[0] as StoreVariantWithCalculatedPrice)
  )

  return (
    <div className="flex flex-col gap-y-4">
      {/* Dynamic Price Display */}
      <div className="flex flex-col gap-1 mb-2">
         {displayPrice && purchaseState.status === "price_pending" ? (
           <>
             <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
               Valor em configuração
             </span>
             <span className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
               {formatCurrencyAmount({ amount: displayPrice, currencyCode: displayCurrencyCode })}
             </span>
           </>
         ) : displayPrice && purchaseState.status !== "price_pending" ? (
             <span className="text-3xl md:text-4xl font-bold text-[var(--color-navy)] tracking-tight">
               {formatCurrencyAmount({ amount: displayPrice, currencyCode: displayCurrencyCode })}
             </span>
         ) : (
            <span className="text-xl font-medium text-[var(--color-text-muted)] italic">Consulte o valor</span>
         )}
      </div>

      {(product.variants?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-y-4 border-t border-[var(--color-border)] pt-4 mt-2">
          {(product.options || []).map((option) => (
            <div key={option.id}>
              <ProductOptionSelect
                option={option}
                current={selectedOptions[option.id]}
                updateOption={setOptionValue}
                data-testid="product-options"
                disabled={!!disabled || addToCartMutation.isPending}
                product={product}
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={buttonDisabled || !!disabled || addToCartMutation.isPending || isSuccess}
        aria-label={`${buttonText} ${product.title}`}
        className={`mt-4 flex items-center justify-center w-full min-h-[56px] px-6 py-4 text-base font-bold rounded-[var(--radius-button)] transition-[background-color,color,border-color,transform,box-shadow] duration-[160ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98] ${
          buttonDisabled
            ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200 shadow-none"
            : isSuccess
              ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
              : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-lg shadow-blue-900/20 motion-interactive"
        }`}
      >
        {addToCartMutation.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processando...
          </span>
        ) : isSuccess ? (
          <span className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            Adicionado
          </span>
        ) : !buttonDisabled ? (
          <span className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {buttonText}
          </span>
        ) : (
          buttonText
        )}
      </button>
    </div>
  )
})

export default ProductActions