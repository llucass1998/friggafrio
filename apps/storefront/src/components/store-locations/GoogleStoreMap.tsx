import { MapPin } from "lucide-react"
import { StoreLocation, storeAddress, storeMapsLinks } from "@/config/store-locations"

interface GoogleStoreMapProps {
  location: StoreLocation
}

export function GoogleStoreMap({ location }: GoogleStoreMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY?.trim()

  if (!apiKey) {
    return (
      <div data-testid="store-map-fallback" className="flex h-[280px] w-full flex-col items-center justify-center rounded-2xl border border-[#E5EDF4] bg-[#F5F8FA] p-4 text-center md:h-[360px]">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm">
          <MapPin className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-[var(--color-navy)]">Localização no mapa</h3>
        <p className="mb-4 max-w-md text-sm text-[var(--color-text-muted)]">
          Mapa indisponível no momento. Abra a localização no Google Maps ou use o link de rota.
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
  // A chave Embed existente autoriza este host; o domínio principal recebe 403 do Google.
  const embedUrl = `https://friggafrio.istigestao.com.br/maps-embed.html?key=${encodeURIComponent(apiKey)}&${queryParam}`

  return (
    <div className="h-[280px] w-full overflow-hidden rounded-2xl border border-[#E5EDF4] bg-[#F5F8FA] md:h-[360px]">
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
