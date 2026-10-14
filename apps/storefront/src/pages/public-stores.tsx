import { useRef, useState } from "react"
import { storeAddress, storeLocations, storeMapsLinks } from "@/config/store-locations"
import { storeLocationsStructuredData } from "@/lib/seo"
import { StoreLocationCard } from "@/components/store-locations/StoreLocationCard"
import { GoogleStoreMap } from "@/components/store-locations/GoogleStoreMap"
import { Link } from "@tanstack/react-router"
import { Check, Navigation } from "lucide-react"

const activeLocations = storeLocations.filter((location) => location.active).sort((a, b) => a.order - b.order)

export function PublicStoresPage() {
  const [selectedLocationId, setSelectedLocationId] = useState("loja-1")
  const mapSection = useRef<HTMLElement>(null)
  const activeLocation = activeLocations.find((location) => location.id === selectedLocationId) ?? activeLocations[0]

  function viewOnMap(locationId: string) {
    setSelectedLocationId(locationId)
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    mapSection.current?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" })
  }

  return (
    <div className="w-full bg-[#FAFAFA] pb-16 font-sans text-[var(--color-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeLocationsStructuredData()) }} />
      <div className="mx-auto max-w-[1320px] px-4 sm:px-24 min-[1440px]:px-8">
        <header className="pb-6 pt-6 md:pt-8">
          <nav className="mb-4 text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><Link to="/" className="inline-flex min-h-11 items-center rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Nossas lojas</li>
            </ol>
          </nav>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--color-navy)] md:text-4xl">Nossas lojas</h1>
          <p className="mt-2 leading-relaxed text-[var(--color-text-muted)]">Encontre sua unidade FriggaFrio e veja como chegar.</p>
        </header>

        <section aria-label="Unidades FriggaFrio" className="grid gap-6 xl:grid-cols-3">
          {activeLocations.map((location) => <StoreLocationCard key={location.id} location={location} onViewMap={viewOnMap} />)}
        </section>

        {activeLocation && (
          <section ref={mapSection} id="store-map-section" aria-labelledby="store-map-heading"
            className="mt-10 scroll-mt-32 lg:scroll-mt-24">
            <h2 id="store-map-heading" className="text-2xl font-bold text-[var(--color-navy)]">Localização das unidades</h2>
            <div role="group" aria-label="Unidade exibida no mapa" className="my-4 flex flex-wrap gap-2">
              {activeLocations.map((location) => {
                const isSelected = activeLocation.id === location.id
                return (
                  <button key={location.id} type="button" aria-pressed={isSelected} aria-controls="store-map-content"
                    onClick={() => setSelectedLocationId(location.id)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)] ${isSelected ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[#E5EDF4] bg-white text-[var(--color-primary)] hover:border-[var(--color-primary)]"}`}>
                    {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}{location.shortName}
                    {isSelected && <span className="sr-only">Selecionada</span>}
                  </button>
                )
              })}
            </div>
            <div id="store-map-content">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div aria-live="polite" aria-atomic="true">
                  <h3 className="font-bold text-[var(--color-navy)]">{activeLocation.shortName} — FriggaFrio</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{storeAddress(activeLocation)}</p>
                </div>
                <a href={storeMapsLinks(activeLocation).directions} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-sm font-semibold text-[var(--color-primary)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]">
                  <Navigation className="h-4 w-4" aria-hidden="true" />Como chegar
                </a>
              </div>
              <GoogleStoreMap location={activeLocation} />
            </div>
          </section>
        )}

        <section aria-labelledby="visit-heading" className="mt-10 border-t border-[#E5EDF4] pt-8">
          <h2 id="visit-heading" className="text-2xl font-bold text-[var(--color-navy)]">Antes de visitar</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-[var(--color-text-muted)]">
            <li>Consulte o estoque antes de se deslocar.</li>
            <li>Envie uma foto, código ou modelo da peça à nossa equipe pelo WhatsApp para ajudar na identificação.</li>
            <li><strong className="text-[var(--color-text)]">Retirada gratuita somente na Loja 1.</strong> A retirada de pedidos é exclusiva da Loja 1: escolha essa opção no checkout e aguarde a confirmação de que o pedido está pronto antes de vir.</li>
          </ul>
          <p className="mt-4 leading-relaxed text-[var(--color-text-muted)]"><strong className="text-[var(--color-text)]">Atendimento especializado:</strong> gases refrigerantes, compressores, componentes, ferramentas e soluções para refrigeração e climatização, conforme a disponibilidade do catálogo.</p>
        </section>

        <section aria-labelledby="faq-heading" className="mt-8 border-t border-[#E5EDF4] pt-8">
          <h2 id="faq-heading" className="text-xl font-bold text-[var(--color-navy)]">Dúvidas frequentes</h2>
          <dl className="mt-4 grid gap-6 md:grid-cols-2">
            <div><dt className="font-semibold">Como confirmo a disponibilidade?</dt><dd className="mt-2 leading-relaxed text-[var(--color-text-muted)]">Consulte o estoque no produto ou fale com nossa equipe pelo WhatsApp antes de se deslocar.</dd></div>
            <div><dt className="font-semibold">A FriggaFrio realiza instalação?</dt><dd className="mt-2 leading-relaxed text-[var(--color-text-muted)]">A loja comercializa produtos e componentes; a instalação deve ser realizada por profissional habilitado.</dd></div>
          </dl>
        </section>
      </div>
    </div>
  )
}
