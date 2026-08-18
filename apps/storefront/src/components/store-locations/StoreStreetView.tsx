import { Eye, MapPin } from "lucide-react"
import { StoreLocation } from "@/config/store-locations"

interface StoreStreetViewProps {
  location: StoreLocation
}

export function StoreStreetView({ location }: StoreStreetViewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY

  if (!apiKey) {
    return (
      <div data-testid="store-streetview-fallback" className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border-2 border-[#E5EDF4] bg-[#F5F8FA] p-5 text-center lg:min-h-[360px]">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm">
          <Eye className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-[var(--color-navy)]">Vista da rua</h3>
        <p className="mb-5 max-w-md text-sm text-[var(--color-text-muted)]">
          O Street View interativo não pôde ser carregado no momento.
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${location.placeId ? `place_id:${location.placeId}` : encodeURIComponent(`${location.addressLine}, ${location.district}, ${location.city} - ${location.stateCode}, ${location.postalCode}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${location.name} no Google Maps`}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <MapPin className="h-5 w-5" aria-hidden="true" />
          Abrir no Google Maps
        </a>
      </div>
    )
  }

  const queryParam = location.placeId
    ? `place_id=${location.placeId}`
    : `location=${encodeURIComponent(`${location.addressLine}, ${location.district}, ${location.city} - ${location.stateCode}, ${location.postalCode}`)}`

  const embedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&${queryParam}`

  return (
    <div className="h-[300px] w-full overflow-hidden rounded-2xl border-2 border-[#E5EDF4] bg-[#F5F8FA] shadow-sm lg:h-[360px]">
      <iframe data-testid="store-streetview-iframe"
        title={`Vista da rua da ${location.name}`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        src={embedUrl}
        className="h-full w-full"
      />
    </div>
  )
}
