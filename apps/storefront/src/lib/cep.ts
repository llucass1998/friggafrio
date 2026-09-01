export type CepAddress = {
  street: string
  neighborhood: string
  city: string
  state: string
}

type ViaCepResponse = {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

export type CepLookupOptions = {
  signal?: AbortSignal
  timeoutMs?: number
}

export const normalizeCep = (value: string): string => value.replace(/\D/g, "").slice(0, 8)

export const formatCep = (value: string): string => {
  const digits = normalizeCep(value)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

// Anonymous delivery hints live only for the current SPA session. They are
// deliberately not persisted in browser storage or URLs.
let guestCep = ""
const guestCepListeners = new Set<() => void>()

export const readGuestCep = (): string => guestCep

export const setGuestCep = (value: string): void => {
  guestCep = formatCep(value)
  guestCepListeners.forEach((listener) => listener())
}

export const clearGuestCep = (): void => {
  setGuestCep("")
}

export const subscribeGuestCep = (listener: () => void): (() => void) => {
  guestCepListeners.add(listener)
  return () => guestCepListeners.delete(listener)
}

const CEP_CACHE_TTL_MS = 5 * 60 * 1000
const cepCache = new Map<string, { expiresAt: number; value: CepAddress | null }>()

export async function lookupCep(value: string, options: CepLookupOptions = {}): Promise<CepAddress | null> {
  const cep = normalizeCep(value)
  if (cep.length !== 8) return null
  const cached = cepCache.get(cep)
  if (cached && cached.expiresAt > Date.now()) return cached.value
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 4000)
  const signal = options.signal
  const abort = () => controller.abort()
  signal?.addEventListener("abort", abort, { once: true })
  if (signal?.aborted) controller.abort()
  let valueResult: CepAddress | null = null
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal })
  if (!response.ok) throw new Error("N\u00e3o foi poss\u00edvel consultar o CEP.")
    const data = await response.json() as ViaCepResponse
    if (!data.erro) valueResult = { street: data.logradouro?.trim() ?? "", neighborhood: data.bairro?.trim() ?? "", city: data.localidade?.trim() ?? "", state: data.uf?.trim() ?? "" }
    cepCache.set(cep, { expiresAt: Date.now() + CEP_CACHE_TTL_MS, value: valueResult })
    return valueResult
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener("abort", abort)
  }
}
