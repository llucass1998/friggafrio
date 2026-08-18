import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"
import { ProductOptionSelect } from "@/components/product-option-select"
import { useCartDrawer } from "@/lib/context/cart"
import { useAddToCart } from "@/lib/hooks/use-cart"
import { getVariantOptionsKeymap, isVariantInStock } from "@/lib/utils/product"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { decodeProductText } from "@/lib/utils/product-text"
import { formatCurrencyAmount } from "@/lib/utils/currency"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { HttpTypes } from "@medusajs/types"
import { useLocation } from "@tanstack/react-router"
import { isEqual } from "lodash-es"
import { memo, useEffect, useMemo, useState } from "react"
import { Loader2, ShoppingCart, Check } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct;
  region: HttpTypes.StoreRegion;
  disabled?: boolean;
};

const ProductActions = memo(function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | undefined>>({})
  const [isSuccess, setIsSuccess] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "br"

  const addToCartMutation = useAddToCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const { openCart } = useCartDrawer()
  const queryClient = useQueryClient()

  useEffect(() => {
    setSelectedOptions({})
    setQuantity(1)
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
  const publicProductTitle = decodeProductText(product.title)

  // Validates if the selected variant matches purchasing rules
  const canBuySelected = useMemo(() => {
    if (!selectedVariant) return false
    if (purchaseState.status === "unavailable" || purchaseState.status === "quote_only" || purchaseState.status === "price_pending" || purchaseState.status === "out_of_stock") return false

    const isApprovedVariant = purchaseState.status === "purchasable"
      ? purchaseState.variant.id === selectedVariant.id
      : purchaseState.variants.some((variant) => variant.id === selectedVariant.id)
    if (!isApprovedVariant || !isVariantInStock(selectedVariant)) return false

    const available = selectedVariant.manage_inventory === true
      ? selectedVariant.inventory_quantity
      : undefined
    if (quantity < 1 || (typeof available === "number" && quantity > available)) return false

    const amount = selectedVariant.calculated_price?.calculated_amount
    if (typeof amount !== "number" || amount <= 0) return false

    return true
  }, [selectedVariant, purchaseState, quantity])

  const displayPrice = selectedVariant?.calculated_price?.calculated_amount
    ?? (purchaseState.status === "purchasable" ? purchaseState.price : undefined)


  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !canBuySelected) return null

    addToCartMutation.mutateAsync(
      {
        variant_id: selectedVariant.id,
        quantity,
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
          toast.success(`${publicProductTitle} adicionado ao carrinho`)
          setTimeout(() => setIsSuccess(false), 2000)
        },
        onError: () => {
          // Error telemetry could go here
          toast.error("Não foi possível adicionar o produto ao carrinho")
        }
      }
    )
  }

  // Generate Button Text
  let buttonText = "Adicionar ao carrinho"
  let buttonDisabled = true

  if (purchaseState.status === "unavailable") {
    buttonText = "Indisponível"
  } else if (purchaseState.status === "quote_only") {
    buttonText = "Solicitar cotação"
  } else if (purchaseState.status === "price_pending") {
    buttonText = "Preço indisponível"
  } else if (!selectedVariant) {
    buttonText = "Selecione uma opção"
  } else if (!isValidVariant || !canBuySelected) {
    buttonText = "Sem estoque"
  } else {
    buttonDisabled = false
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* Dynamic Price Display */}
      <div className="flex flex-col gap-1 mb-2">
         {purchaseState.status === "quote_only" ? (
           <>
             <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
               Sob cotação
             </span>
             <span className="text-xl font-medium text-[var(--color-text-muted)]">Consulte condições comerciais</span>
           </>
         ) : purchaseState.status === "price_pending" ? (
           <>
             <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
               Valor em configuração
             </span>
             <span className="text-xl font-medium text-[var(--color-text-muted)]">Consulte o valor</span>
           </>
         ) : displayPrice ? (
             <span className="text-3xl md:text-4xl font-bold text-[var(--color-navy)] tracking-tight">
               {formatCurrencyAmount({ amount: displayPrice, currencyCode: countryCode === "br" ? "BRL" : (selectedVariant as any)?.calculated_price?.currency_code || (product.variants?.[0] as any)?.calculated_price?.currency_code || "BRL" })}
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

      {(purchaseState.status === "purchasable" || selectedVariant) && (
        <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4">
          <label htmlFor="product-quantity" className="text-sm font-semibold text-[var(--color-navy)]">
            Quantidade
          </label>
          <div className="flex items-center rounded-[var(--radius-button-sm)] border border-[var(--color-border)] bg-white">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={buttonDisabled || quantity <= 1 || addToCartMutation.isPending}
              className="h-10 w-10 text-lg text-[var(--color-navy)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              -
            </button>
            <input
              id="product-quantity"
              type="number"
              min={1}
              max={selectedVariant?.manage_inventory === true && typeof selectedVariant.inventory_quantity === "number" ? selectedVariant.inventory_quantity : undefined}
              step={1}
              value={quantity}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (!Number.isInteger(next)) return
                const available = selectedVariant?.manage_inventory === true && typeof selectedVariant.inventory_quantity === "number"
                  ? selectedVariant.inventory_quantity
                  : Number.MAX_SAFE_INTEGER
                setQuantity(Math.min(available, Math.max(1, next)))
              }}
              disabled={buttonDisabled || addToCartMutation.isPending}
              className="h-10 w-14 border-x border-[var(--color-border)] text-center text-sm font-semibold text-[var(--color-navy)] focus:outline-none"
              aria-label="Quantidade do produto"
            />
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => setQuantity((value) => {
                const available = selectedVariant?.manage_inventory === true && typeof selectedVariant.inventory_quantity === "number"
                  ? selectedVariant.inventory_quantity
                  : value + 1
                return Math.min(available, value + 1)
              })}
              disabled={buttonDisabled || addToCartMutation.isPending || (selectedVariant?.manage_inventory === true && typeof selectedVariant.inventory_quantity === "number" && quantity >= selectedVariant.inventory_quantity)}
              className="h-10 w-10 text-lg text-[var(--color-navy)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={buttonDisabled || !!disabled || addToCartMutation.isPending || isSuccess}
        aria-label={`${buttonText} ${publicProductTitle}`}
        className={`mt-4 flex items-center justify-center w-full min-h-[56px] px-6 py-4 text-base font-bold rounded-[var(--radius-button)] transition-all duration-[160ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98] ${
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
