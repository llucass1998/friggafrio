import { MapPin } from "lucide-react"
import { StoreLocation } from "@/config/store-locations"

interface GoogleStoreMapProps {
  location: StoreLocation
}

export function GoogleStoreMap({ location }: GoogleStoreMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY

  if (!apiKey) {
    return (
      <div className="w-full h-[420px] lg:h-[520px] bg-[#F5F8FA] rounded-2xl border-2 border-[#E5EDF4] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-[var(--color-primary)]">
          <MapPin className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[var(--color-navy)] mb-2">Localização no Mapa</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-8 max-w-md">
          O mapa interativo não pôde ser carregado no momento. Você ainda pode abrir a localização diretamente no Google Maps.
        </p>
        <p className="text-sm font-bold text-[var(--color-navy)] mb-6">
          {location.addressLine}, {location.district} - {location.city}/{location.stateCode}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${location.placeId ? `place_id:${location.placeId}` : encodeURIComponent(`${location.addressLine}, ${location.district}, ${location.city} - ${location.stateCode}, ${location.postalCode}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${location.name} no Google Maps`}
          className="inline-flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          <MapPin className="w-5 h-5" />
          Abrir no Google Maps
        </a>
      </div>
    )
  }

  // Use Place ID se disponível, caso contrário use a string do endereço completo
  const queryParam = location.placeId
    ? `q=place_id:${location.placeId}`
    : `q=${encodeURIComponent(`${location.addressLine}, ${location.district}, ${location.city} - ${location.stateCode}, ${location.postalCode}`)}`

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&${queryParam}`

  return (
    <div className="w-full h-[420px] lg:h-[520px] rounded-2xl overflow-hidden border-2 border-[#E5EDF4] shadow-sm bg-[#F5F8FA]">
      <iframe
        title={`Mapa da ${location.name}`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        src={embedUrl}
        className="w-full h-full"
      />
    </div>
  )
}
