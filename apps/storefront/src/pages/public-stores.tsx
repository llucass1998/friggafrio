import { storeConfig } from "../config/store"
import { StoreMap } from "../components/store-location/StoreMap"
import { StoreLocationCard } from "../components/store-location/StoreLocationCard"
import { StoreGallery } from "../components/store-location/StoreGallery"
import { Link, useNavigate, useSearch } from "@tanstack/react-router"
import { MapPin, PhoneCall, Info } from "lucide-react"

export function PublicStoresPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { unidade?: string }
  const activeLocationId = search.unidade || storeConfig.locations[0].id

  const activeLocation = storeConfig.locations.find(l => l.id === activeLocationId) || storeConfig.locations[0]
  const fullAddress = `${activeLocation.address.street}, ${activeLocation.address.number}, ${activeLocation.address.district} - ${activeLocation.address.city}/${activeLocation.address.state}`
  const mapSearchQuery = `${activeLocation.name} ${fullAddress}`

  return (
    <div className="w-full bg-[var(--color-surface)] min-h-screen pb-16">
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
              streetAddress: `${activeLocation.address.street}, ${activeLocation.address.number}`,
              addressLocality: activeLocation.address.district,
              addressRegion: activeLocation.address.state,
              postalCode: activeLocation.address.postalCode,
              addressCountry: "BR",
            },
            sameAs: [storeConfig.instagramUrl],
            hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery)}`,
            department: [
              ...storeConfig.locations
                .filter((l) => l.id !== activeLocation.id)
                .map((loc) => ({
                  "@type": "LocalBusiness",
                  name: loc.name,
                  telephone: storeConfig.phone,
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: `${loc.address.street}, ${loc.address.number}`,
                    addressLocality: loc.address.district,
                    addressRegion: loc.address.state,
                    postalCode: loc.address.postalCode,
                    addressCountry: "BR",
                  },
                })),
            ],
          }),
        }}
      />

      {/* Page Header (Hero Interno) */}
      <div className="bg-[var(--color-surface-soft)] pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
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
                <span className="text-[var(--color-text)] font-semibold" aria-current="page">Nossa Loja</span>
              </li>
            </ol>
          </nav>

          <div className="inline-flex items-center rounded-full border border-[var(--color-accent)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-primary)] mb-6 shadow-sm">
            Visite a FriggaFrio
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-navy)] mb-6">
            Nossa Loja
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Visite a FriggaFrio e encontre gases refrigerantes, compressores, componentes, ferramentas e atendimento especializado para refrigeração e ar-condicionado.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

        {/* Tabs / Location Selector */}
        <div className="flex justify-center mb-10">
          <div className="bg-[var(--color-surface-soft)] p-1.5 rounded-full border border-[var(--color-border)] flex gap-1">
            {storeConfig.locations.map((location) => (
              <button
                key={location.id}
                onClick={() => navigate({ to: '/nossa-loja', search: { unidade: location.id }, replace: true })}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                  activeLocation.id === location.id
                    ? "bg-white text-[var(--color-primary)] shadow-sm border border-[var(--color-border)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)]"
                }`}
                aria-selected={activeLocation.id === location.id}
                role="tab"
              >
                {location.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Location Display Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">

          {/* Gallery / Visual Left Side (58%) */}
          <div className="lg:col-span-7">
            <StoreGallery locationId={activeLocation.id} locationName={activeLocation.name} address={fullAddress} />
          </div>

          {/* Card Info Right Side (42%) */}
          <div className="lg:col-span-5">
            <StoreLocationCard location={activeLocation} />
          </div>
        </div>

        {/* Map Section */}
        <div className="mb-20">
          <StoreMap locationQuery={mapSearchQuery} address={fullAddress} />
        </div>

        {/* Section: Sobre a loja */}
        <div className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-[var(--color-navy)] mb-6">Sobre a FriggaFrio</h2>
            <p className="text-[var(--color-text-muted)] leading-relaxed mb-6">
              A FriggaFrio oferece produtos e soluções para refrigeração comercial, industrial e doméstica. Em nossas lojas, clientes, técnicos e empresas encontram gases refrigerantes, compressores, componentes, ferramentas, tubos, isolamentos e atendimento especializado para diferentes aplicações.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-sm">
              <h3 className="font-bold text-[var(--color-navy)] mb-2">Atendimento especializado</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Nossa equipe auxilia na identificação de produtos conforme o equipamento e as especificações técnicas.</p>
            </div>
            <div className="bg-white p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-sm">
              <h3 className="font-bold text-[var(--color-navy)] mb-2">Variedade para refrigeração</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Encontre gases refrigerantes, compressores, ferramentas e componentes para diferentes sistemas.</p>
            </div>
            <div className="bg-white p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-sm">
              <h3 className="font-bold text-[var(--color-navy)] mb-2">Atendimento para profissionais e empresas</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Estrutura preparada para atender técnicos, instaladores, empresas e projetos de refrigeração.</p>
            </div>
          </div>
        </div>

        {/* Section: Antes de Visitar */}
        <div className="mt-16 md:mt-24 border-t border-[var(--color-border)] pt-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-navy)] mb-8 text-center">Antes de visitar a loja</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-soft)] mx-auto flex items-center justify-center mb-4 border border-[var(--color-border)]">
                <Info className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-bold text-[var(--color-navy)] mb-2">Consulte a disponibilidade</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Confirme o estoque e a unidade antes de se deslocar.
              </p>
            </div>

            <div className="bg-white p-6 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-soft)] mx-auto flex items-center justify-center mb-4 border border-[var(--color-border)]">
                <MapPin className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-bold text-[var(--color-navy)] mb-2">Envie o código ou uma foto</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Se possuir o código, modelo ou fotografia da peça, envie para nossa equipe pelo WhatsApp.
              </p>
            </div>

            <div className="bg-white p-6 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-soft)] mx-auto flex items-center justify-center mb-4 border border-[var(--color-border)]">
                <PhoneCall className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-bold text-[var(--color-navy)] mb-2">Confirme a unidade</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Alguns produtos podem estar disponíveis em apenas uma das lojas.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de confirmar a disponibilidade de um produto e saber em qual unidade da FriggaFrio posso retirá-lo.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-8 rounded-[var(--radius-button)] shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            >
              Confirmar pelo WhatsApp
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

