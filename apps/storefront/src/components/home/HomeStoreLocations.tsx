import { Link } from "@tanstack/react-router"
import { MapPin, Navigation, Phone } from "lucide-react"
import { storeLocations, storeAddress, storeMapsLinks } from "@/config/store-locations"

const activeLocations = storeLocations
  .filter((location) => location.active)
  .sort((a, b) => a.order - b.order)

export function HomeStoreLocations() {
  return (
    <section
      aria-labelledby="home-stores-title"
      className="bg-[var(--color-background)] py-14 sm:py-18 lg:py-22 border-b border-[var(--color-border)]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-soft)] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            Presença Física
          </span>
          <h2
            id="home-stores-title"
            className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-navy)] leading-tight"
          >
            Nossas Lojas
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed">
            Visite nossas unidades em São Paulo e Mogi Guaçu para atendimento técnico presencial e retirada de produtos.
          </p>
        </div>

        {/* Grid de Unidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {activeLocations.map((location) => {
            const formattedAddress = storeAddress(location)
            const mapsDirectionsUrl = storeMapsLinks(location).directions

            return (
              <article
                key={location.id}
                className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Fachada da Loja */}
                {location.ownImageSrc ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <img
                      src={location.ownImageSrc}
                      alt={location.ownImageAlt || `Fachada da ${location.name}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      style={{ objectPosition: location.imagePosition || "center" }}
                    />
                    <div className="absolute top-3 left-3 rounded-lg bg-[var(--color-navy)]/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      {location.shortName}
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[16/10] w-full bg-[var(--color-surface-soft)] flex items-center justify-center">
                    <MapPin className="h-10 w-10 text-[var(--color-primary)]/50" aria-hidden="true" />
                    <div className="absolute top-3 left-3 rounded-lg bg-[var(--color-navy)] px-3 py-1 text-xs font-bold text-white">
                      {location.shortName}
                    </div>
                  </div>
                )}

                {/* Dados da Unidade */}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-[var(--color-navy)] leading-tight">
                    {location.name}
                  </h3>

                  <div className="mt-3 flex items-start gap-2.5 text-sm text-[var(--color-text-muted)]">
                    <MapPin className="h-4 w-4 shrink-0 text-[var(--color-primary)] mt-0.5" aria-hidden="true" />
                    <span className="leading-relaxed">{formattedAddress}</span>
                  </div>

                  {location.phone && (
                    <div className="mt-2.5 flex items-center gap-2.5 text-sm text-[var(--color-text-muted)]">
                      <Phone className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                      <a
                        href={`tel:${location.phone.replace(/\D/g, "")}`}
                        className="hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                      >
                        {location.phone}
                      </a>
                    </div>
                  )}

                  <div className="mt-3 rounded-lg bg-[#EBF5FB] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)]">
                    Retirada gratuita de pedidos nesta unidade.
                  </div>

                  {/* Ações */}
                  <div className="mt-auto pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <Link
                      to="/nossa-loja"
                      className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-xs font-bold text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                    >
                      Conhecer unidade
                    </Link>

                    <a
                      href={mapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-primary)]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                    >
                      <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                      Como chegar
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
