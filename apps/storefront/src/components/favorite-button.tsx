import { Heart } from "lucide-react"
import { useState } from "react"
import { useFavorites } from "@/lib/hooks/use-favorites"

type FavoriteButtonProps = {
  productId: string
  productTitle?: string
  className?: string
}

export function FavoriteButton({ productId, productTitle = "produto", className = "" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(productId)
  const actionLabel = active ? "Remover dos favoritos" : "Adicionar aos favoritos"
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <button
      type="button"
      aria-label={actionLabel}
      aria-pressed={active}
      title={`${actionLabel}: ${productTitle}`}
      disabled={isSubmitting}
      onClick={async (event) => {
        // The control may live inside a product link; keep favorite actions
        // from navigating or triggering the card's primary action.
        event.preventDefault()
        event.stopPropagation()
        if (isSubmitting) return
        setIsSubmitting(true)
        try {
          await toggleFavorite(productId)
        } finally {
          setIsSubmitting(false)
        }
      }}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/95 text-[var(--color-text-muted)] shadow-sm backdrop-blur-sm transition-[color,background-color,border-color,transform] duration-[var(--motion-duration-interaction)] hover:-translate-y-0.5 hover:border-red-500 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-wait disabled:opacity-70 motion-reduce:transform-none ${active ? "border-red-500 bg-white text-red-600" : ""} ${className}`}
    >
      <Heart className="h-5 w-5" fill={active ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  )
}

export default FavoriteButton
