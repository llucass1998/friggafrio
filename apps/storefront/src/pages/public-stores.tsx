import { useState } from "react"
import { storeLocations } from "@/config/store-locations"
import { storeLocationsStructuredData } from "@/lib/seo"
import { StoreLocationCard } from "@/components/store-locations/StoreLocationCard"
import { Link } from "@tanstack/react-router"
import { Image as ImageIcon, Info, MapPin, PackageCheck, ShieldCheck } from "lucide-react"

const activeLocations = storeLocations.filter((location) => location.active).sort((a, b) => a.order - b.order)

export function PublicStoresPage() {
  const [selectedLocationId, setSelectedLocationId] = useState("loja-1")
  const activeLocation = activeLocations.find((location) => location.id === selectedLocationId) ?? activeLocations[0]

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
          __html: JSON.stringify(storeLocationsStructuredData()),
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
              <li><span className="font-semibold text-[var(--color-text)]" aria-current="page">Nossas lojas</span></li>
            </ol>
          </nav>

          <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-[var(--color-navy)] md:text-4xl lg:text-5xl">
            Nossas lojas
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
            Conheça nossas unidades e escolha a melhor localização para visitar.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 pt-12 sm:px-6 lg:px-8">
        <div role="group" aria-label="Escolha uma loja" className="mb-8 grid gap-4 md:grid-cols-3">
          {activeLocations.map((location) => {
            const isSelected = activeLocation.id === location.id
            return (
              <button
                key={location.id}
                type="button"
                aria-pressed={isSelected}
                aria-controls="store-location-details"
                onClick={() => setSelectedLocationId(location.id)}
                className={`flex min-w-0 items-center gap-4 rounded-2xl border-2 bg-white p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)] md:flex-col md:items-stretch md:p-4 ${isSelected ? "border-[var(--color-primary)]" : "border-[#E5EDF4] hover:border-[var(--color-primary)]"}`}
              >
                <img
                  src={location.ownImageSrc}
                  alt=""
                  width={160}
                  height={120}
                  style={{ objectPosition: location.imagePosition }}
                  className="aspect-[4/3] w-24 shrink-0 rounded-xl object-cover md:w-full"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold text-[var(--color-navy)]">{location.shortName}</span>
                  <span className="mt-1 block text-sm text-[var(--color-text-muted)]">
                    {location.addressLine}<br />{location.city}/{location.stateCode}
                  </span>
                  <span className="mt-2 block text-xs font-bold text-[var(--color-primary)]">
                    {isSelected ? "Selecionada" : "Ver unidade"}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <p role="status" className="sr-only">{activeLocation.shortName} selecionada. Detalhes atualizados.</p>
        <div className="mb-16">
          <StoreLocationCard location={activeLocation} />
        </div>

        <div className="mt-16 border-t border-[#E5EDF4] pt-16 md:mt-24">
          <h2 className="mb-8 text-center text-2xl font-extrabold text-[var(--color-navy)] md:text-3xl">
            Antes de visitar nossas lojas
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
                Consulte o endereço completo da unidade escolhida antes de sair.
              </p>
            </div>
          </div>

          <div className="mt-16 border-t border-[#E5EDF4] pt-12">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[var(--radius-card)] bg-[#F5F8FA] p-6 md:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <PackageCheck className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-[var(--color-navy)]">Retirada gratuita na Loja 1</h2>
                </div>
                <p className="leading-relaxed text-[var(--color-text-muted)]">
                  Escolha a retirada na Loja 1 no checkout e aguarde a confirmação de que o pedido está pronto antes de vir à unidade. A retirada de pedidos é exclusiva da Loja 1.
                </p>
              </div>
              <div className="rounded-[var(--radius-card)] bg-[#F5F8FA] p-6 md:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-[var(--color-navy)]">Atendimento especializado</h2>
                </div>
                <p className="leading-relaxed text-[var(--color-text-muted)]">
                  Encontre gases refrigerantes, compressores, componentes, ferramentas e soluções para refrigeração e climatização, conforme a disponibilidade do catálogo.
                </p>
              </div>
            </div>
            <div className="mt-8 rounded-[var(--radius-card)] border border-[#E5EDF4] bg-white p-6 md:p-8">
              <h2 className="text-xl font-bold text-[var(--color-navy)]">Dúvidas frequentes</h2>
              <dl className="mt-5 space-y-5 text-[var(--color-text-muted)]">
                <div>
                  <dt className="font-semibold text-[var(--color-text)]">Como confirmo a disponibilidade?</dt>
                  <dd className="mt-1 leading-relaxed">Consulte o estoque no produto ou fale com nossa equipe pelo WhatsApp antes de se deslocar.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text)]">A FriggaFrio realiza instalação?</dt>
                  <dd className="mt-1 leading-relaxed">A loja comercializa produtos e componentes; a instalação deve ser realizada por profissional habilitado.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
