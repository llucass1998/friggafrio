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

export async function lookupCep(value: string): Promise<CepAddress | null> {
  const cep = normalizeCep(value)
  if (cep.length !== 8) return null

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  if (!response.ok) throw new Error("N\u00e3o foi poss\u00edvel consultar o CEP.")

  const data = await response.json() as ViaCepResponse
  if (data.erro) return null

  return {
    street: data.logradouro?.trim() ?? "",
    neighborhood: data.bairro?.trim() ?? "",
    city: data.localidade?.trim() ?? "",
    state: data.uf?.trim() ?? "",
  }
}
