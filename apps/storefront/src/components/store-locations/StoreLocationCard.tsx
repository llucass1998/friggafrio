import { useState } from "react"
import { Eye, MapPin, MessageSquare, Navigation, Phone } from "lucide-react"
import { StoreLocation } from "@/config/store-locations"
import { COMPANY_INFORMATION } from "@/config/company"
import { GooglePlacePhoto } from "@/components/store-locations/GooglePlacePhoto"
import { GoogleStoreMap } from "@/components/store-locations/GoogleStoreMap"
import { StoreStreetView } from "@/components/store-locations/StoreStreetView"

interface StoreLocationCardProps {
  location: StoreLocation
}

type LocationView = "map" | "streetview"

export function StoreLocationCard({ location }: StoreLocationCardProps) {
  const [activeView, setActiveView] = useState<LocationView>("map")

  const handleWhatsapp = () => {
    const text = encodeURIComponent(
      `Olá! Gostaria de falar com a equipe da FriggaFrio sobre a unidade da ${location.addressLine}.`
    )
    window.open(`https://wa.me/${location.whatsapp}?text=${text}`, "_blank", "noopener,noreferrer")
  }

  const handleDirections = () => {
    const destination = location.placeId
      ? `place_id:${location.placeId}`
      : `${location.addressLine}, ${location.district}, ${location.city} - ${location.stateCode}, ${location.postalCode}`
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`

    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <article
      data-testid="store-location-card"
      className="w-full overflow-hidden rounded-3xl border border-[#E5EDF4] bg-white shadow-sm"
    >
      <header className="border-b border-[#E5EDF4] px-6 py-6 md:px-8 lg:px-10">
        <h2 className="text-2xl font-bold text-[var(--color-navy)] md:text-3xl">{location.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-[var(--color-text-muted)]">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
          <span>{location.addressLine} - {location.district}</span>
        </p>
      </header>

      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:p-10">
        <div className="flex min-w-0 flex-col">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F5F8FA]">
            {location.ownImageSrc ? (
              <img
                src={location.ownImageSrc}
                alt={location.ownImageAlt || `Fachada da ${location.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <GooglePlacePhoto location={location} />
            )}
          </div>

          <div className="flex flex-1 flex-col pt-6">
            <h3 className="text-lg font-bold text-[var(--color-navy)]">Informações da loja</h3>
            <div className="mt-4 space-y-3 text-[var(--color-text-muted)]">
              <div>
                <p className="font-medium text-[var(--color-text)]">{location.addressLine}</p>
                <p>{location.district} — {location.city}/{location.stateCode}</p>
                <p>CEP {location.postalCode}</p>
                <p className="text-xs text-gray-500">CNPJ: {COMPANY_INFORMATION.cnpj}</p>
              </div>

              {location.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                  <span>Telefone: <strong>{location.phone}</strong></span>
                </div>
              )}
              {location.openingHours && location.openingHours.length > 0 && (
                <div>
                  <p className="font-medium text-[var(--color-text)] text-sm">Horário de atendimento</p>
                  <p className="text-sm">Consulte os horários da unidade</p>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleDirections}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                aria-label={`Traçar rota até a ${location.name}`}
              >
                <Navigation className="h-5 w-5" aria-hidden="true" />
                Como chegar
              </button>
              <button
                type="button"
                onClick={handleWhatsapp}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-bold text-white transition-colors hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
                aria-label={`Falar com a ${location.name} pelo WhatsApp`}
              >
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
                Falar pelo WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="mb-4 flex w-full rounded-xl border border-[#E5EDF4] bg-[#F5F8FA] p-1.5" role="tablist" aria-label="Visualização da localização">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "map"}
              onClick={() => setActiveView("map")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-[background-color,color,box-shadow] duration-[var(--motion-duration-interaction)] ${
                activeView === "map"
                  ? "bg-white text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:bg-black/5 hover:text-[var(--color-navy)]"
              }`}
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Mapa
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "streetview"}
              onClick={() => setActiveView("streetview")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-[background-color,color,box-shadow] duration-[var(--motion-duration-interaction)] ${
                activeView === "streetview"
                  ? "bg-white text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:bg-black/5 hover:text-[var(--color-navy)]"
              }`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Vista da rua
            </button>
          </div>

          <div className="min-h-[280px] flex-1 lg:min-h-[360px]">
            <div key={activeView} className="motion-tab-content h-full">
              {activeView === "map" ? <GoogleStoreMap location={location} /> : <StoreStreetView location={location} />}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
