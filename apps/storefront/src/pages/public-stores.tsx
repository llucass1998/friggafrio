import { useState } from "react"
import { storeLocations } from "../config/store-locations"
import { storeConfig } from "../config/store"
import { GoogleStoreMap } from "../components/store-locations/GoogleStoreMap"
import { StoreStreetView } from "../components/store-locations/StoreStreetView"
import { StoreLocationCard } from "../components/store-locations/StoreLocationCard"
import { Link } from "@tanstack/react-router"
import { MapPin, PhoneCall, Info, Navigation, Eye, Image as ImageIcon } from "lucide-react"

export function PublicStoresPage() {
  const activeLocations = storeLocations.filter(loc => loc.active)

  // By default, select the first active location for the map pane
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    activeLocations.length > 0 ? activeLocations[0].id : ""
  )
  const [activeTab, setActiveTab] = useState<"map" | "streetview" | "photos">("map")

  const activeLocation = activeLocations.find(l => l.id === selectedLocationId) || activeLocations[0]

  // Se não houver nenhuma loja ativa (teoricamente impossível pelo dataset atual, mas tipado seguro)
  if (!activeLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8FA]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-[#E5EDF4]">
          <h1 className="text-2xl font-bold text-[var(--color-navy)] mb-2">Lojas em atualização</h1>
          <p className="text-[var(--color-text-muted)]">Nossas informações de lojas estão sendo atualizadas.</p>
        </div>
      </div>
    )
  }

  const handleSelectLocation = (id: string) => {
    setSelectedLocationId(id)
    // Scroll down to map section when selecting a store on mobile
    const mapSection = document.getElementById("map-panel")
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pb-16 font-sans">
      <div aria-live="polite" className="sr-only">
        {activeLocation ? `${activeLocation.name} selecionada.` : ''}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: activeLocation.name,
            url: `https://www.friggafrio.com.br/nossa-loja?unidade=${activeLocation.id}`,
            telephone: storeConfig.phone,
            email: storeConfig.email,
            address: {
              "@type": "PostalAddress",
              streetAddress: activeLocation.addressLine,
              addressLocality: activeLocation.district,
              addressRegion: activeLocation.stateCode,
              postalCode: activeLocation.postalCode,
              addressCountry: "BR",
            },
            sameAs: [storeConfig.instagramUrl],
            hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activeLocation.name} ${activeLocation.addressLine} ${activeLocation.district} ${activeLocation.city} ${activeLocation.stateCode} ${activeLocation.postalCode}`)}`,
            department: [
              ...activeLocations
                .filter((l) => l.id !== activeLocation.id)
                .map((loc) => ({
                  "@type": "LocalBusiness",
                  name: loc.name,
                  telephone: storeConfig.phone,
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: loc.addressLine,
                    addressLocality: loc.district,
                    addressRegion: loc.stateCode,
                    postalCode: loc.postalCode,
                    addressCountry: "BR",
                  },
                })),
            ],
          }),
        }}
      />

      {/* Page Header */}
      <div className="bg-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#E5EDF4]">
        <div className="max-w-[1320px] mx-auto flex flex-col items-center text-center">
          {/* Breadcrumb */}
          <nav className="flex text-sm text-[var(--color-text-muted)] mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] rounded-sm">Home</Link>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li>
                <span className="text-[var(--color-text)] font-semibold" aria-current="page">Nossas lojas</span>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-navy)] mb-6">
            Nossas lojas
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Encontre a unidade FriggaFrio mais próxima e conheça nossos canais de atendimento para produtos de refrigeração e climatização.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">

        {/* Store Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8 mb-16">
          {activeLocations.map((location, index) => {
            // Se tivermos um número ímpar de lojas e esta for a última, ela centraliza.
            const isLastOddItem = activeLocations.length % 2 !== 0 && index === activeLocations.length - 1

            return (
              <div
                key={location.id}
                className={isLastOddItem ? "md:col-span-2 md:w-[calc(50%-0.75rem)] lg:w-[calc(50%-1rem)] md:justify-self-center w-full" : "w-full"}
              >
                <StoreLocationCard
                  location={location}
                  isSelected={selectedLocationId === location.id}
                  onSelect={() => handleSelectLocation(location.id)}
                />
              </div>
            )
          })}
        </div>

        {/* Selected Map Panel */}
        <div id="map-panel" className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-[#E5EDF4] mb-20 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-[#E5EDF4] pb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-navy)]">{activeLocation.name}</h2>
              <p className="text-[var(--color-text-muted)] mt-1">{activeLocation.addressLine} - {activeLocation.district}</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-[#F5F8FA] p-1.5 rounded-xl border border-[#E5EDF4] self-start md:self-auto w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab("map")}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === "map"
                    ? "bg-white text-[var(--color-primary)] shadow-sm"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)] hover:bg-black/5"
                }`}
              >
                <Navigation className="w-4 h-4" />
                Mapa
              </button>
              <button
                onClick={() => setActiveTab("streetview")}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === "streetview"
                    ? "bg-white text-[var(--color-primary)] shadow-sm"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)] hover:bg-black/5"
                }`}
              >
                <Eye className="w-4 h-4" />
                Vista da rua
              </button>
            </div>
          </div>

          <div className="w-full">
            {activeTab === "map" && <GoogleStoreMap location={activeLocation} />}
            {activeTab === "streetview" && <StoreStreetView location={activeLocation} />}
          </div>
        </div>

        {/* Section: Antes de Visitar */}
        <div className="mt-16 md:mt-24 border-t border-[#E5EDF4] pt-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-navy)] mb-8 text-center">Antes de visitar a loja</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white p-6 md:p-8 rounded-[var(--radius-card)] border border-[#E5EDF4] shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F8FA] mx-auto flex items-center justify-center mb-6 border border-[#E5EDF4]">
                <Info className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-navy)] mb-3">Consulte a disponibilidade</h3>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                Confirme o estoque e a unidade antes de se deslocar.
              </p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[var(--radius-card)] border border-[#E5EDF4] shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F8FA] mx-auto flex items-center justify-center mb-6 border border-[#E5EDF4]">
                <ImageIcon className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-navy)] mb-3">Envie uma foto da peça</h3>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                Se possuir o código, modelo ou fotografia da peça, envie para nossa equipe pelo WhatsApp.
              </p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[var(--radius-card)] border border-[#E5EDF4] shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F8FA] mx-auto flex items-center justify-center mb-6 border border-[#E5EDF4]">
                <MapPin className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-navy)] mb-3">Confirme a unidade</h3>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                Alguns produtos podem estar disponíveis em apenas uma das lojas.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de confirmar a disponibilidade de um produto e saber em qual unidade da FriggaFrio posso retirá-lo.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-8 rounded-xl shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            >
              <PhoneCall className="w-5 h-5" />
              Confirmar pelo WhatsApp
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

