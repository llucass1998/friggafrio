import { MapPin, MessageSquare, Navigation, Phone } from "lucide-react"
import { StoreLocation, storeMapsLinks, storeWhatsappLink } from "@/config/store-locations"
import { GooglePlacePhoto } from "@/components/store-locations/GooglePlacePhoto"
import { GoogleStoreMap } from "@/components/store-locations/GoogleStoreMap"

interface StoreLocationCardProps {
  location: StoreLocation
}

export function StoreLocationCard({ location }: StoreLocationCardProps) {
  const whatsappLink = storeWhatsappLink(location)

  return (
    <article
      id="store-location-details"
      aria-labelledby="store-location-name"
      data-testid="store-location-card"
      className="w-full overflow-hidden rounded-3xl border border-[#E5EDF4] bg-white shadow-sm"
    >
      <header className="min-h-[152px] border-b border-[#E5EDF4] px-6 py-6 md:min-h-[128px] md:px-8 lg:px-10">
        <h2 id="store-location-name" className="text-2xl font-bold text-[var(--color-navy)] md:text-3xl">{location.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-[var(--color-text-muted)]">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
          <span>{location.addressLine}{location.district ? ` — ${location.district}` : ""}</span>
        </p>
      </header>

      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:p-10">
        <div className="flex min-w-0 flex-col">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F5F8FA]">
            {location.ownImageSrc ? (
              <img
                src={location.ownImageSrc}
                alt={location.ownImageAlt || `Fachada da ${location.name}`}
                width={1200}
                height={900}
                style={{ objectPosition: location.imagePosition }}
                className="h-full w-full object-cover"
              />
            ) : (
              <GooglePlacePhoto location={location} />
            )}
          </div>

          <div className="flex flex-1 flex-col pt-6">
            {/* Reserve the confirmed Loja 1 content height when other units have fewer details. */}
            <div className="min-h-[224px]">
              <h3 className="text-lg font-bold text-[var(--color-navy)]">Informações da loja</h3>
              <div className="mt-4 space-y-3 text-[var(--color-text-muted)]">
                <div>
                  <p className="font-medium text-[var(--color-text)]">{location.addressLine}</p>
                  <p>{location.district ? `${location.district} — ` : ""}{location.city}/{location.stateCode}</p>
                  {location.postalCode && <p>CEP {location.postalCode}</p>}
                  {location.cnpj && <p className="text-xs text-gray-500">CNPJ: {location.cnpj}</p>}
                </div>
                {location.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                    <span>Telefone: <strong>{location.phone}</strong></span>
                  </div>
                )}
                {location.openingHours && location.openingHours.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">Horário de atendimento</p>
                    <p className="text-sm">Consulte os horários da unidade</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid min-h-[112px] content-start gap-3 sm:min-h-[48px] sm:grid-cols-2">
              <a
                href={storeMapsLinks(location).directions}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                aria-label={`Traçar rota até a ${location.shortName}`}
              >
                <Navigation className="h-5 w-5 shrink-0" aria-hidden="true" />
                Como chegar
              </a>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-bold text-white transition-colors hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
                  aria-label={`Falar com a ${location.shortName} pelo WhatsApp`}
                >
                  <MessageSquare className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Falar pelo WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--color-navy)]">
            <MapPin className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            Mapa da {location.shortName}
          </h3>
          <GoogleStoreMap location={location} />
        </div>
      </div>
    </article>
  )
}
