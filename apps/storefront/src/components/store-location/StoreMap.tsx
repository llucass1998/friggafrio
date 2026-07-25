import { MapPin, Navigation } from "lucide-react"

interface StoreMapProps {
  locationQuery: string
  address: string
}

export function StoreMap({ locationQuery, address }: StoreMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY

  if (!apiKey) {
    return (
      <div className="w-full h-full min-h-[300px] md:min-h-[400px] bg-[var(--color-surface-soft)] rounded-[var(--radius-card-lg)] border border-[var(--color-border)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-[var(--color-primary)]">
          <MapPin className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-navy)] mb-2">Localização no Mapa</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-sm">
          O mapa interativo estará disponível em breve. Você ainda pode abrir a localização diretamente no Google Maps.
        </p>
        <p className="text-sm font-medium text-[var(--color-text)] mb-6">
          {address}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-6 rounded-[var(--radius-button)] shadow-md transition-colors"
        >
          <Navigation className="w-5 h-5" />
          Abrir no Google Maps
        </a>
      </div>
    )
  }

  const encodedQuery = encodeURIComponent(locationQuery)
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedQuery}`

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px] rounded-[var(--radius-card-lg)] overflow-hidden border border-[var(--color-border)] shadow-sm bg-[var(--color-surface-soft)]">
      <iframe
        title={`Mapa da FriggaFrio — ${address}`}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: '300px' }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        src={embedUrl}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
