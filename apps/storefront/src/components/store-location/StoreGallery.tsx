import { Store } from "lucide-react"

interface StoreGalleryProps {
  locationId: string;
  locationName: string;
  address: string;
}

export function StoreGallery({ locationId, locationName, address }: StoreGalleryProps) {
  // Verificamos imagens reais na pasta public se fosse um backend dinâmico,
  // Para agora mapeamos os assets combinados.
  const imageUrl = `/images/store/${locationId}-fachada.webp`;

  // Fallback pattern como especificado (sem foto original = placeholder)
  return (
    <div className="w-full h-[400px] md:h-[500px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card-lg)] overflow-hidden shadow-sm relative group">

      {/* Imagem tentada primeiro */}
      <picture className="w-full h-full flex items-center justify-center relative">
        <img
          src={imageUrl}
          alt={`Fachada da ${locationName}`}
          className="w-full h-full object-cover z-10"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.classList.add('show-placeholder');
          }}
        />

        {/* Fallback Icon */}
        <div className="absolute inset-0 hidden flex-col items-center justify-center bg-[var(--color-surface-soft)] text-center p-6 z-0" data-fallback>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Store className="w-10 h-10 text-[var(--color-primary)] opacity-40" />
          </div>
          <p className="text-[var(--color-navy)] font-bold mb-2">Foto da unidade em breve</p>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-6">
            Ainda estamos preparando fotografias da nossa fachada e interior.
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locationName} ${address}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-[var(--color-primary)] hover:underline"
          >
            Ver fotos no Google Maps
          </a>
        </div>
      </picture>

      <style>{`
        .show-placeholder [data-fallback] {
          display: flex;
        }
      `}</style>
    </div>
  )
}
