import { MapPin, Phone, MessageSquare, Navigation, Map } from "lucide-react"
import { StoreLocation } from "../../config/store-locations"
import { GooglePlacePhoto } from "./GooglePlacePhoto"

interface StoreLocationCardProps {
  location: StoreLocation
  isSelected?: boolean
  onSelect?: () => void
}

export function StoreLocationCard({ location, isSelected, onSelect }: StoreLocationCardProps) {
  const handleWhatsapp = () => {
    const text = encodeURIComponent(
      `Olá! Gostaria de falar com a equipe da FriggaFrio sobre a unidade da ${location.addressLine}.`
    )
    window.open(`https://wa.me/${location.whatsapp}?text=${text}`, "_blank", "noopener,noreferrer")
  }

  const handleDirections = () => {
    let url = `https://www.google.com/maps/dir/?api=1`
    if (location.placeId) {
      url += `&destination=Place+ID:${location.placeId}`
    } else {
      const addressString = `${location.addressLine}, ${location.district}, ${location.city} - ${location.stateCode}, ${location.postalCode}`
      url += `&destination=${encodeURIComponent(addressString)}`
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    
    <div
      onClick={(e) => {
                e.stopPropagation()
                if (onSelect) onSelect()
              }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (onSelect) onSelect()
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={`w-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border-2 cursor-pointer
        motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]
        ${isSelected 
          ? "border-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/10 shadow-md" 
          : "border-[#E5EDF4] hover:border-[var(--color-primary)]/50 hover:shadow-xl hover:-translate-y-2"}
      `}
    >

      {/* Top Image Section */}
      <div className="w-full aspect-video relative bg-[#F5F8FA]">
        {location.ownImageSrc ? (
          <img
            src={location.ownImageSrc}
            alt={location.ownImageAlt || `Fachada da ${location.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <GooglePlacePhoto location={location} />
        )}
        
        {isSelected && (
          <div className="absolute top-4 right-4 bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm z-10 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Unidade selecionada
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 md:p-8 flex-1 flex flex-col">
        <h3 className="text-xl md:text-2xl font-bold text-[var(--color-navy)] mb-4">
          {location.name}
        </h3>

        <div className="space-y-4 mb-6 flex-1 text-[var(--color-text-muted)]">
          <div>
            <p className="font-medium text-[var(--color-text)]">{location.addressLine}</p>
            <p>{location.district} — {location.city}/{location.stateCode}</p>
            <p>CEP {location.postalCode}</p>
          </div>

          {location.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Telefone: <strong>{location.phone}</strong></span>
            </div>
          )}

          <div className="pt-2">
            <p className="font-medium text-[var(--color-text)] text-sm mb-1">Horário de hoje:</p>
            <p className="text-sm">Consulte o horário de atendimento</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-auto">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onSelect}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-colors ${
                isSelected
                  ? "bg-[var(--color-surface-soft)] text-[var(--color-navy)] cursor-default"
                  : "bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
              }`}
              aria-label={`Visualizar ${location.name} no mapa`}
            >
              <Map className="w-5 h-5" />
              {isSelected ? "No mapa" : "Ver no mapa"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDirections()
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors"
              aria-label={`Traçar rota até a ${location.name}`}
            >
              <Navigation className="w-5 h-5" />
              Como chegar
            </button>
          </div>
          <button
            onClick={(e) => {
                e.stopPropagation()
                handleWhatsapp()
              }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20bd5a] transition-colors w-full"
            aria-label={`Falar com a ${location.name} pelo WhatsApp`}
          >
            <MessageSquare className="w-5 h-5" />
            Falar pelo WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
