import { useEffect, useRef, useState } from "react"
import { MapPin, X } from "lucide-react"
import { Link, useParams } from "@tanstack/react-router"
import { getStoredCart } from "@/lib/utils/cart"

const POSTAL_CODE_KEY = "friggafrio:postal-code"

const normalizePostalCode = (value: string) => value.replace(/\D/g, "").slice(0, 8)
const formatPostalCode = (value: string) => {
  const digits = normalizePostalCode(value)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export function HeaderPostalCode({ mobile = false }: { mobile?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [postalCode, setPostalCode] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  useEffect(() => {
    setPostalCode(formatPostalCode(localStorage.getItem(POSTAL_CODE_KEY) || ""))
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutside)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutside)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [isOpen])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const digits = normalizePostalCode(postalCode)
    if (digits.length !== 8) {
      setMessage("Digite um CEP válido com 8 números.")
      return
    }
    const formatted = formatPostalCode(digits)
    localStorage.setItem(POSTAL_CODE_KEY, formatted)
    setPostalCode(formatted)
    setMessage("CEP salvo. O frete será calculado com seu endereço completo no checkout.")
  }

  return (
    <div ref={rootRef} className={mobile ? "relative block" : "relative hidden md:block"}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open)
          setMessage(null)
        }}
        className={`inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-left text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${mobile ? "w-full justify-start" : ""}`}
        aria-expanded={isOpen}
        aria-controls="header-postal-code-popover"
      >
        <MapPin className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
        <span>
          <span className="block font-semibold text-[var(--color-navy)]">{postalCode || "Informe seu CEP"}</span>
          <span className="block">Calcule a entrega</span>
        </span>
      </button>

      {isOpen && (
        <div id="header-postal-code-popover" role="dialog" aria-label="Calcular entrega por CEP" className={`absolute top-full z-[70] mt-2 w-[min(90vw,20rem)] rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-xl ${mobile ? "left-0" : "right-0"}`}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-navy)]">Calcule a entrega</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Informe seu CEP para agilizar o preenchimento do endereço.</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Fechar cálculo de entrega" className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <label htmlFor="header-postal-code" className="sr-only">CEP</label>
            <input
              id="header-postal-code"
              inputMode="numeric"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(event) => setPostalCode(formatPostalCode(event.target.value))}
              placeholder="00000-000"
              className="min-h-11 min-w-0 flex-1 rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
            <button type="submit" className="min-h-11 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">Salvar</button>
          </form>
          {message && <p className="mt-3 text-xs text-[var(--color-text-muted)]" role="status">{message}</p>}
          {getStoredCart() && (
            <Link to="/$countryCode/checkout" params={{ countryCode }} search={{ step: "address" as any }} onClick={() => setIsOpen(false)} className="mt-3 inline-flex text-xs font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
              Continuar no checkout para calcular o frete
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
