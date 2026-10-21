import { COMPANY_INFORMATION } from "@/config/company"

export type StoreOpeningPeriod = {
  opensAt: string
  closesAt: string
}

export type StoreOpeningDay = {
  weekday: number
  periods: StoreOpeningPeriod[]
  closed: boolean
}

export type StoreLocation = {
  id: string
  name: string
  shortName: string
  addressLine: string
  district?: string
  city: string
  stateCode: string
  stateName: string
  postalCode?: string
  countryCode: "BR"
  phone?: string
  whatsapp?: string
  legalName?: string
  cnpj?: string
  email?: string
  placeId?: string
  latitude?: number
  longitude?: number
  googleMapsUrl?: string
  ownImageSrc?: string
  ownImageAlt?: string
  imagePosition?: string
  openingHours?: StoreOpeningDay[]
  active: boolean
  order: number
}

// O PlaceID deve ser descoberto e inserido aqui permanentemente após configuração com o painel do Google.
export const storeLocations: StoreLocation[] = [
  {
    id: "loja-1",
    name: "FriggaFrio",
    shortName: "Loja 1",
    addressLine: "Alameda Glete, 663",
    district: "Campos Elíseos",
    city: "São Paulo",
    stateCode: "SP",
    stateName: "São Paulo",
    postalCode: "01215-001",
    countryCode: "BR",
    ownImageSrc: "/images/store/loja-1-fachada.webp",
    ownImageAlt: "Fachada da FriggaFrio",
    imagePosition: "center",
    legalName: COMPANY_INFORMATION.legalName,
    cnpj: COMPANY_INFORMATION.cnpj,
    email: "contato@friggafrio.com.br",
    // Keep the address as the canonical Maps target until a verified Place ID
    // is available; stale IDs make directions/search links resolve nowhere.
    phone: "(11) 3224-1670",
    whatsapp: "5511921396007",
    active: true,
    order: 1,
  },
  {
    id: "loja-2",
    name: "Loja 2 — FriggaFrio",
    shortName: "Loja 2",
    addressLine: "Alameda Glete, 926",
    district: "Campos Elíseos",
    city: "São Paulo",
    stateCode: "SP",
    stateName: "São Paulo",
    postalCode: "01215-001",
    phone: "(11) 3224-1670",
    countryCode: "BR",
    ownImageSrc: "/images/store/loja-2-fachada.webp",
    ownImageAlt: "Fachada da Loja 2 FriggaFrio na Alameda Glete, 926",
    imagePosition: "center top",
    active: true,
    order: 2,
  },
  {
    id: "loja-3",
    name: "Loja 3 — FriggaFrio",
    shortName: "Loja 3",
    // Endereco confirmado pelo responsavel; nao inferir o numero da fotografia.
    addressLine: "Avenida São Carlos, 847",
    district: "Vila São Carlos",
    city: "Mogi Guaçu",
    stateCode: "SP",
    stateName: "São Paulo",
    postalCode: "13847-111",
    countryCode: "BR",
    ownImageSrc: "/images/store/loja-3-fachada.webp",
    ownImageAlt: "Fachada da Loja 3 em Mogi Guaçu, com as placas Braido e Frigga preservadas",
    imagePosition: "center",
    active: true,
    order: 3,
  },
]

export function storeAddress(location: StoreLocation): string {
  return [location.addressLine, location.district, `${location.city}/${location.stateCode}`, location.postalCode]
    .filter(Boolean).join(", ")
}

export function storeMapsLinks(location: StoreLocation) {
  const address = encodeURIComponent(storeAddress(location))
  return {
    search: `https://www.google.com/maps/search/?api=1&query=${address}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${address}`,
  }
}

export function storeWhatsappLink(location: StoreLocation): string | undefined {
  if (!location.whatsapp) return undefined
  const text = `Olá! Gostaria de falar com a equipe da FriggaFrio sobre a ${location.shortName}, ${storeAddress(location)}.`
  return `https://wa.me/${location.whatsapp}?text=${encodeURIComponent(text)}`
}
