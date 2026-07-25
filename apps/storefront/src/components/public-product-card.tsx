import { Link, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { ProductImagePlaceholder } from "./product/ProductImagePlaceholder"

import { useState } from "react"
import { useCartDrawer } from "@/lib/context/cart"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addToCart } from "@/lib/data/cart"
import { Loader2, ShoppingCart, Check } from "lucide-react"
import { toast } from "sonner"


interface PublicProductCardProps {
  product: HttpTypes.StoreProduct
  isNew?: boolean
}


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

export function PublicProductCard({ product, isNew = false }: PublicProductCardProps) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  const thumbnail = product.thumbnail || product.images?.[0]?.url
  const sku = product.variants?.[0]?.sku || "N/A"

  // Brand pode vir do metadado ou collection
  const metadata = product.metadata as Record<string, any> || {}
  const brand = (metadata.brand as string) || product.collection?.title || "Friggafrio"

  // Controle de Preço e Orçamento
  const isDemoPrice = metadata.is_demo_price === true
  const hasRealImages = metadata.has_real_images === true

  // Preço
  const brlPrice = product.variants?.[0]?.calculated_price?.calculated_amount
    ? product.variants[0].calculated_price.calculated_amount
    : null

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
      toast.success(`${product.title} adicionado ao carrinho`)
      
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

  return (
    <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      {/* Image */}
      <Link
        to={"/$countryCode/products/$handle" as string}
        params={{ countryCode, handle: product.handle }}
        className="block relative aspect-square bg-[var(--color-surface-soft)] overflow-hidden p-6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]"
      >
        {isNew && (
          <span className="absolute top-3 left-3 z-10 px-2 py-1 text-xs font-semibold text-[var(--color-navy)] bg-[var(--color-accent)] rounded-[4px] uppercase tracking-wide shadow-sm">
            Novo
          </span>
        )}

        {!hasRealImages && (
          <span className="absolute bottom-3 right-3 z-10 px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] bg-white/80 backdrop-blur-sm rounded-[4px] shadow-sm">
            Imagem em breve
          </span>
        )}

        {thumbnail && hasRealImages ? (
          <img
            src={thumbnail}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ProductImagePlaceholder productName={product.title} />
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
          {brand}
        </div>

        {/* Title */}
        <Link to={"/$countryCode/products/$handle" as string} params={{ countryCode, handle: product.handle }} className="mb-2 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">
          <h3 className="font-bold text-[var(--color-navy)] leading-tight hover:text-[var(--color-primary)] transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
        </Link>

        {/* SKU */}
        <p className="text-xs text-[var(--color-text-muted)] mb-4 font-mono bg-[var(--color-background)] px-2 py-1 rounded w-fit">
          Ref: {sku}
        </p>

        {/* Actions - Bottom aligned */}
        <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
          <div className="flex flex-col gap-1 mb-4">
             {brlPrice && isDemoPrice ? (
               <>
                 <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
                   Valor em configuração
                 </span>
                 <span className="text-lg font-bold text-[var(--color-text)]">
                   R$ {(brlPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </span>
               </>
             ) : brlPrice ? (
                 <span className="text-lg font-bold text-[var(--color-text)]">
                   R$ {(brlPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </span>
             ) : (
                <span className="text-xs text-[var(--color-text-muted)] italic">Consulte o valor</span>
             )}
          </div>

          <button
            onClick={handleBuy}
            disabled={!isAvailable || addToCartMutation.isPending || isSuccess}
            aria-label={`Comprar ${product.title}`}
            className={`flex items-center justify-center w-full min-h-[44px] px-3 py-2.5 text-sm font-semibold rounded-[var(--radius-button-sm)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
              !isAvailable 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                : isSuccess
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] motion-interactive"
            }`}
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
          </button>
        </div>
      </div>
    </div>
  )
}
