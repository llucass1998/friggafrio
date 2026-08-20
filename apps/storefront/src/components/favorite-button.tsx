import { Heart } from "lucide-react"
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

  return (
    <button
      type="button"
      aria-label={actionLabel}
      aria-pressed={active}
      title={`${actionLabel}: ${productTitle}`}
      onClick={() => toggleFavorite(productId)}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/95 text-[var(--color-text-muted)] shadow-sm backdrop-blur-sm transition-[color,background-color,border-color,transform] duration-[var(--motion-duration-interaction)] hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] motion-reduce:transform-none ${active ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]" : ""} ${className}`}
    >
      <Heart className="h-5 w-5" fill={active ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  )
}

export default FavoriteButton
