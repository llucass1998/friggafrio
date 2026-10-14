import { MapPin, MessageSquare, Navigation, PackageCheck, Phone } from "lucide-react"
import { type StoreLocation, storeMapsLinks, storeWhatsappLink } from "@/config/store-locations"
import { GooglePlacePhoto } from "@/components/store-locations/GooglePlacePhoto"

interface StoreLocationCardProps {
  location: StoreLocation
  onViewMap: (locationId: string) => void
}

export function StoreLocationCard({ location, onViewMap }: StoreLocationCardProps) {
  const whatsappLink = storeWhatsappLink(location)
  const focusStyle = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]"

  return (
    <article
      id={location.id}
      aria-labelledby={`${location.id}-name`}
      data-testid="store-location-card"
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E5EDF4] bg-white shadow-sm"
    >
      <div className="aspect-[4/3] w-full self-start overflow-hidden bg-[#F5F8FA]">
        {location.ownImageSrc ? (
          <img
            src={location.ownImageSrc}
            alt={location.ownImageAlt || `Fachada da ${location.name}`}
            width={1200}
            height={900}
            loading={location.order === 1 ? "eager" : "lazy"}
            decoding="async"
            style={{ objectPosition: location.imagePosition }}
            className="h-full w-full object-cover"
          />
        ) : <GooglePlacePhoto location={location} />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-6">
        <p className="text-sm text-[var(--color-text-muted)]">{location.city}/{location.stateCode}</p>
        <h2 id={`${location.id}-name`} className="mt-2 text-2xl font-bold text-[var(--color-navy)]">
          {location.shortName} <span className="text-base font-medium">— FriggaFrio</span>
        </h2>
        <address className="mt-4 not-italic leading-relaxed text-[var(--color-text)]">
          <p className="font-semibold">{location.addressLine}</p>
          {location.district && <p>{location.district}</p>}
          {location.postalCode && <p className="text-sm text-[var(--color-text-muted)]">CEP {location.postalCode}</p>}
        </address>
        {location.id === "loja-1" && (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            <PackageCheck className="h-5 w-5 shrink-0" aria-hidden="true" />Retirada de pedidos
          </p>
        )}
        {(location.phone || whatsappLink) && (
          <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-[var(--color-primary)]">
            {location.phone && (
              <a href={`tel:+55${location.phone.replace(/\D/g, "")}`} className={`inline-flex min-h-11 items-center gap-2 rounded-sm underline underline-offset-4 ${focusStyle}`}>
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />{location.phone}
              </a>
            )}
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp da ${location.shortName}`}
                className={`inline-flex min-h-11 items-center gap-2 rounded-sm underline underline-offset-4 ${focusStyle}`}>
                <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />WhatsApp
              </a>
            )}
          </div>
        )}
        {location.cnpj && <p className="mt-2 text-xs text-[var(--color-text-muted)]">CNPJ: {location.cnpj}</p>}
        <div className="mt-auto flex flex-col gap-2 pt-6 max-sm:mx-8">
          <a href={storeMapsLinks(location).directions} target="_blank" rel="noopener noreferrer"
            aria-label={`Como chegar à ${location.shortName}`}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 font-bold text-white hover:bg-[var(--color-primary-hover)] ${focusStyle}`}>
            <Navigation className="h-5 w-5 shrink-0" aria-hidden="true" />Como chegar
          </a>
          <button type="button" onClick={() => onViewMap(location.id)} aria-controls="store-map-section"
            aria-label={`Ver ${location.shortName} no mapa`}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#E5EDF4] px-4 py-3 font-semibold text-[var(--color-primary)] hover:bg-[#F5F8FA] ${focusStyle}`}>
            <MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />Ver no mapa
          </button>
        </div>
      </div>
    </article>
  )
}
