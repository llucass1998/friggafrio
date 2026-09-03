import { storeLocations } from "@/config/store-locations"
import { storeConfig } from "@/config/store"
import { COMPANY_INFORMATION } from "@/config/company"
import { StoreLocationCard } from "@/components/store-locations/StoreLocationCard"
import { Link } from "@tanstack/react-router"
import { Image as ImageIcon, Info, MapPin, MessageCircle } from "lucide-react"

export function PublicStoresPage() {
  const activeLocations = storeLocations.filter((location) => location.active)
  const activeLocation = activeLocations[0]

  if (!activeLocation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FA]">
        <div className="rounded-2xl border border-[#E5EDF4] bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-[var(--color-navy)]">Lojas em atualização</h1>
          <p className="text-[var(--color-text-muted)]">Nossas informações de lojas estão sendo atualizadas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-16 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: activeLocation.name,
            legalName: COMPANY_INFORMATION.legalName,
            taxID: COMPANY_INFORMATION.cnpj,
            url: "https://www.friggafrio.com.br/nossa-loja",
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
          }),
        }}
      />

      <div className="border-b border-[#E5EDF4] bg-white px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center text-center">
          <nav className="mb-8 flex text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link
                  to="/"
                  className="rounded-sm transition-colors hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                >
                  Home
                </Link>
              </li>
              <li><span className="mx-2">/</span></li>
              <li><span className="font-semibold text-[var(--color-text)]" aria-current="page">Nossa Loja</span></li>
            </ol>
          </nav>

          <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-[var(--color-navy)] md:text-4xl lg:text-5xl">
            Nossa Loja
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
            Encontre a unidade FriggaFrio e conheça nossos canais de atendimento para produtos de refrigeração e climatização.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mb-16">
          <StoreLocationCard location={activeLocation} />
        </div>

        <div className="mt-16 border-t border-[#E5EDF4] pt-16 md:mt-24">
          <h2 className="mb-8 text-center text-2xl font-extrabold text-[var(--color-navy)] md:text-3xl">
            Antes de visitar a loja
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            <div className="rounded-[var(--radius-card)] border border-[#E5EDF4] bg-white p-6 text-center shadow-sm md:p-8">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E5EDF4] bg-[#F5F8FA]">
                <Info className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-[var(--color-navy)]">Consulte a disponibilidade</h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Confirme o estoque antes de se deslocar.
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[#E5EDF4] bg-white p-6 text-center shadow-sm md:p-8">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E5EDF4] bg-[#F5F8FA]">
                <ImageIcon className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-[var(--color-navy)]">Envie uma foto da peça</h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Se possuir o código, modelo ou fotografia da peça, envie para nossa equipe pelo WhatsApp.
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[#E5EDF4] bg-white p-6 text-center shadow-sm md:p-8">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E5EDF4] bg-[#F5F8FA]">
                <MapPin className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-[var(--color-navy)]">Confira o endereço</h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Consulte o endereço completo da nossa loja antes de sair.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de confirmar a disponibilidade de um produto na FriggaFrio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-8 py-4 font-bold text-white shadow-sm transition-colors hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Confirmar pelo WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
