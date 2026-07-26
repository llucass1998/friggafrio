import { useState } from "react"
import { MapPin, Phone, MessageSquare, Navigation, Eye, Clock } from "lucide-react"
import { StoreLocation } from "@/config/store-locations"
import { COMPANY_INFORMATION } from "@/config/company"
import { GoogleStoreMap } from "./GoogleStoreMap"
import { StoreStreetView } from "./StoreStreetView"

interface StoreLocationSectionProps {
  location: StoreLocation
}

export function StoreLocationSection({ location }: StoreLocationSectionProps) {
  const [activeTab, setActiveTab] = useState<"map" | "streetview">("map")

  const handleWhatsapp = () => {
    const text = encodeURIComponent(
      `Olá! Gostaria de confirmar a disponibilidade de um produto na unidade da ${location.addressLine}.`
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
    <section
      aria-label="Informações da Loja"
      className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-7 md:mt-10 mb-10 md:mb-14"
    >
      <div 
        className="w-full bg-white rounded-[20px] shadow-sm border border-[#E5EDF4] overflow-hidden flex flex-col md:grid transition-transform duration-280 hover:-translate-y-[5px] hover:shadow-md hover:border-[var(--color-primary)]/40 focus-within:-translate-y-[5px] focus-within:shadow-md focus-within:border-[var(--color-primary)]/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0"
        style={{ gridTemplateColumns: 'minmax(320px, 38%) minmax(0, 62%)' }}
      >
        {/* Informações da Loja */}
        <div className="flex flex-col p-7 md:p-9 justify-center">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2 block">
              Nossa Loja
            </span>
            <h2 className="text-[28px] md:text-[34px] font-extrabold text-[var(--color-navy)] leading-tight mb-4">
              {location.name}
            </h2>

            <ul className="space-y-4 text-[15px] md:text-[16px] text-[#55677A] leading-relaxed">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-medium text-[var(--color-navy)]">{location.addressLine}</span>
                  <span className="block">{location.district} — {location.city}/{location.stateCode}</span>
                  <span className="block">CEP {location.postalCode}</span>
                  <span className="block mt-1 text-xs text-gray-500">
                    CNPJ: {COMPANY_INFORMATION.cnpj}
                  </span>
                </div>
              </li>
              
              {location.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                  <span>{location.phone}</span>
                </li>
              )}
              
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-medium text-[var(--color-navy)]">Segunda a Sexta</span>
                  <span className="block">08:00 às 18:00</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <button
              onClick={handleDirections}
              className="flex items-center justify-center gap-2 w-full h-11 md:h-12 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-hover)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              aria-label="Traçar rota no Google Maps"
            >
              <Navigation className="w-5 h-5" />
              Como chegar
            </button>
            <button
              onClick={handleWhatsapp}
              className="flex items-center justify-center gap-2 w-full h-11 md:h-12 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20bd5a] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
              aria-label="Falar pelo WhatsApp"
            >
              <MessageSquare className="w-5 h-5" />
              Falar pelo WhatsApp
            </button>
          </div>
        </div>

        {/* Mapa e Vista da Rua */}
        <div className="relative w-full h-[300px] sm:h-[360px] md:h-full md:min-h-[400px] md:max-h-[460px] bg-[#F5F8FA] flex flex-col">
          {/* Toolbar */}
          <div className="absolute top-4 right-4 z-10 flex bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-[#E5EDF4]">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                activeTab === "map"
                  ? "bg-white text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)]"
              }`}
            >
              <Navigation className="w-4 h-4" />
              Mapa
            </button>
            <button
              onClick={() => setActiveTab("streetview")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                activeTab === "streetview"
                  ? "bg-white text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)]"
              }`}
            >
              <Eye className="w-4 h-4" />
              Rua
            </button>
          </div>
          
          <div className="flex-1 w-full h-full relative">
            {activeTab === "map" && <GoogleStoreMap location={location} className="absolute inset-0 h-full" />}
            {activeTab === "streetview" && <StoreStreetView location={location} className="absolute inset-0 h-full" />}
          </div>
        </div>
      </div>
    </section>
  )
}
