import { MapPin, Phone, Mail, Navigation, Copy, Check } from "lucide-react"
import { createGoogleMapsDirectionsUrl } from "../../lib/maps"
import { useState } from "react"
import { storeConfig, StoreLocation } from "../../config/store"

interface StoreLocationCardProps {
  location: StoreLocation
}

export function StoreLocationCard({ location }: StoreLocationCardProps) {
  const [copied, setCopied] = useState(false)
  const fullAddress = `${location.address.street}, ${location.address.number}, ${location.address.district} - ${location.address.city}/${location.address.state} - CEP ${location.address.postalCode}`
  const mapSearchQuery = `${location.name} ${fullAddress}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-[var(--radius-card-lg)] border border-[var(--color-border)] shadow-sm p-6 flex flex-col h-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center rounded-full bg-[var(--color-surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-navy)]">
            Loja Física
          </span>
          {location.isPrimary && (
            <span className="inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
              Matriz
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-navy)]">{location.name}</h2>
      </div>

      <div className="space-y-4 flex-1">
        <div className="flex gap-3">
          <MapPin className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[var(--color-text)] font-medium">{location.address.street}, {location.address.number}</p>
            <p className="text-[var(--color-text-muted)] text-sm">
              {location.address.district} - {location.address.city}/{location.address.state}
            </p>
            <p className="text-[var(--color-text-muted)] text-sm">
              CEP {location.address.postalCode}
            </p>
          </div>
        </div>

        {location.type === 'store' && (
          <>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <a href={`tel:${storeConfig.phone.replace(/\D/g, '')}`} className="text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                {storeConfig.phone}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <a href={`mailto:${storeConfig.email}`} className="text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                {storeConfig.email}
              </a>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 space-y-3">
        <a
          href={createGoogleMapsDirectionsUrl(mapSearchQuery)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-4 rounded-[var(--radius-button)] transition-colors"
        >
          <Navigation className="w-5 h-5" />
          Como chegar
        </a>

        {location.type === 'store' && (
          <a
            href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(`Olá, estou vendo o endereço da ${location.name} no site e gostaria de falar com vocês.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-[var(--radius-button)] transition-colors"
          >
            Falar no WhatsApp
          </a>
        )}

        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface-soft)] text-[var(--color-navy)] font-medium py-3 px-4 rounded-[var(--radius-button)] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-green-500" />
              Endereço copiado
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copiar endereço completo
            </>
          )}
        </button>
      </div>
    </div>
  )
}
