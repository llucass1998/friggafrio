import { MapPin } from "lucide-react"
import { StoreLocation, storeAddress, storeMapsLinks } from "@/config/store-locations"

interface GoogleStoreMapProps {
  location: StoreLocation
}

export function GoogleStoreMap({ location }: GoogleStoreMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY

  if (!apiKey) {
    return (
      <div data-testid="store-map-fallback" className="flex h-[360px] w-full flex-col items-center justify-center rounded-2xl border-2 border-[#E5EDF4] bg-[#F5F8FA] p-5 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm">
          <MapPin className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-[var(--color-navy)]">Localização no mapa</h3>
        <p className="mb-4 max-w-md text-sm text-[var(--color-text-muted)]">
          O mapa interativo não pôde ser carregado no momento. Você ainda pode abrir a localização diretamente no Google Maps.
        </p>
        <p className="mb-5 text-sm font-bold text-[var(--color-navy)]">
          {storeAddress(location)}
        </p>
        <a
          href={storeMapsLinks(location).search}
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

  const queryParam = `q=${encodeURIComponent(storeAddress(location))}`

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&${queryParam}`

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl border-2 border-[#E5EDF4] bg-[#F5F8FA] shadow-sm">
      <iframe key={location.id} data-testid="store-map-iframe"
        title={`Mapa da ${location.name}`}
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
