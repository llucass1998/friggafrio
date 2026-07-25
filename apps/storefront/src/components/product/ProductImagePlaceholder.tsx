import React from "react"
import { CameraOff } from "lucide-react"

export type ProductImagePlaceholderProps = {
  productName: string
  className?: string
  compact?: boolean
}

export function ProductImagePlaceholder({
  productName,
  className = "",
  compact = false,
}: ProductImagePlaceholderProps) {
  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center bg-[var(--color-surface-soft)] overflow-hidden ${className}`}
      role="img"
      aria-label={`Imagem ainda não disponível para o produto: ${productName}`}
    >
      <CameraOff
        className={`text-[var(--color-text-muted)] opacity-20 mb-2 ${
          compact ? "w-8 h-8" : "w-16 h-16"
        }`}
        strokeWidth={1.5}
      />
      {!compact && (
        <span className="text-sm font-medium text-[var(--color-text-muted)] opacity-60 text-center px-4">
          Imagem do produto em breve
        </span>
      )}
    </div>
  )
}
