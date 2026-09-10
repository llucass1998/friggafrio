import { Heart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useFavorites } from "@/lib/hooks/use-favorites"

type FavoriteButtonProps = {
  productId: string
  productTitle?: string
  className?: string
}

const BURST_HEARTS = [
  { id: 1, tx: "-10px", ty: "-28px", scale: 0.7, delay: "0ms", duration: "500ms" },
  { id: 2, tx: "10px", ty: "-36px", scale: 0.9, delay: "60ms", duration: "600ms" },
  { id: 3, tx: "-4px", ty: "-44px", scale: 0.6, delay: "120ms", duration: "650ms" },
  { id: 4, tx: "14px", ty: "-48px", scale: 0.8, delay: "180ms", duration: "700ms" },
  { id: 5, tx: "-12px", ty: "-54px", scale: 0.65, delay: "100ms", duration: "750ms" },
] as const

export function FavoriteButton({ productId, productTitle = "produto", className = "" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isAuthenticated } = useFavorites()
  const active = isFavorite(productId)
  const actionLabel = active ? "Remover dos favoritos" : "Adicionar aos favoritos"
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

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

        if (!isAuthenticated) {
          toast.info("Faça login para salvar produtos nos favoritos.")
          return
        }

        if (!active) {
          setIsAnimating(true)
          setTimeout(() => setIsAnimating(false), 800)
        }
        setIsSubmitting(true)
        try {
          await toggleFavorite(productId)
        } finally {
          setIsSubmitting(false)
        }
      }}
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-md bg-transparent border-0 shadow-none text-[var(--color-text-muted)] transition-colors hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-wait disabled:opacity-70 ${active ? "text-red-600 hover:text-red-700" : ""} ${className}`}
    >
      <Heart className="h-5 w-5" fill={active ? "currentColor" : "none"} aria-hidden="true" />
      {isAnimating && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible" aria-hidden="true">
          {BURST_HEARTS.map((h) => (
            <span
              key={h.id}
              className="ff-burst-heart absolute text-red-500 pointer-events-none"
              style={{
                "--tx": h.tx,
                "--ty": h.ty,
                "--scale": h.scale,
                animationDelay: h.delay,
                animationDuration: h.duration,
              } as React.CSSProperties}
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
            </span>
          ))}
        </span>
      )}
    </button>
  )
}

export default FavoriteButton
