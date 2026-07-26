import { storeLocations } from "@/config/store-locations"
import { storeConfig } from "@/config/store"
import { StoreLocationSection } from "@/components/store-locations/StoreLocationSection"
import { Link } from "@tanstack/react-router"
import { MapPin, PhoneCall, Info, ImageIcon } from "lucide-react"

export function PublicStoresPage() {
  const activeLocations = storeLocations.filter(loc => loc.active)

  const activeLocation = activeLocations[0]

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

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pb-16 font-sans">
      <div aria-live="polite" className="sr-only">
        {activeLocation ? `${activeLocation.name} selecionada.` : ""}
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
            department: [],
          }),
        }}
      />

      {/* Page Header */}
      <div className="bg-white pt-10 pb-6 px-4 sm:px-6 lg:px-8 border-b border-[#E5EDF4]">
        <div className="max-w-[1320px] mx-auto flex flex-col items-center text-center">
          {/* Breadcrumb */}
          <nav className="flex text-sm text-[var(--color-text-muted)] mb-6" aria-label="Breadcrumb">
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

          <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Encontre a unidade FriggaFrio mais próxima e conheça nossos canais de atendimento para produtos de refrigeração e climatização.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1320px] mx-auto pt-6">
        <StoreLocationSection location={activeLocation} />

        {/* Section: Antes de Visitar */}
        <div className="mt-10 md:mt-16 border-t border-[#E5EDF4] pt-16 px-4 sm:px-6 lg:px-8">
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
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-8 rounded-xl shadow-sm transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
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

