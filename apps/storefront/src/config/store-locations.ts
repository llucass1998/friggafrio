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
  district: string
  city: string
  stateCode: string
  stateName: string
  postalCode?: string
  countryCode: "BR"
  phone?: string
  whatsapp: string
  placeId?: string
  latitude?: number
  longitude?: number
  googleMapsUrl?: string
  ownImageSrc?: string
  ownImageAlt?: string
  openingHours?: StoreOpeningDay[]
  active: boolean
  order: number
}

// O PlaceID deve ser descoberto e inserido aqui permanentemente após configuração com o painel do Google.
export const storeLocations: StoreLocation[] = [
  {
    id: "loja-1",
    name: "FriggaFrio — Loja 1",
    shortName: "Loja 1",
    addressLine: "Alameda Glete, 663",
    district: "Campos Elíseos",
    city: "São Paulo",
    stateCode: "SP",
    stateName: "São Paulo",
    postalCode: "01215-001",
    countryCode: "BR",
    ownImageSrc: "/images/store/loja-1-fachada.webp",
    ownImageAlt: "Fachada FriggaFrio Loja 1",
    placeId: "ChIJIQ22k61ZzpQRIY809f-6mY0",
    phone: "(11) 4580-1227",
    whatsapp: "5511948777156",
    active: true,
    order: 1,
  },
  {
    id: "loja-2",
    name: "FriggaFrio — Loja 2",
    shortName: "Loja 2",
    addressLine: "Alameda Glete, 926",
    district: "Campos Elíseos",
    city: "São Paulo",
    stateCode: "SP",
    stateName: "São Paulo",
    postalCode: "01215-001", 
    countryCode: "BR",
    ownImageSrc: "/images/store/loja-2-fachada.webp",
    ownImageAlt: "Fachada FriggaFrio Loja 2",
    // placeId: "ChI...", //TODO: Obter do Google
    phone: "(11) 4580-1227",
    whatsapp: "5511948777156",
    active: true,
    order: 2,
  },
]
