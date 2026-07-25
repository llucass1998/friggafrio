export interface StoreBrand {
  id: string
  name: string
  logoSrc: string
  logoAlt: string
  active: boolean
  order: number
  websiteUrl?: string
}

export const storeBrands: StoreBrand[] = [
  { id: "bitzer", name: "Bitzer", logoSrc: "/images/brands/bitzer.webp", logoAlt: "Logo da Bitzer", active: true, order: 1, websiteUrl: "https://www.bitzer.de/br/pt/" },
  { id: "siccom", name: "Siccom", logoSrc: "/images/brands/siccom.jpg", logoAlt: "Logo da Siccom", active: true, order: 2 },
  { id: "coel", name: "Coel", logoSrc: "/images/brands/coel.jpg", logoAlt: "Logo da Coel", active: true, order: 3 },
  { id: "mastercool", name: "Mastercool", logoSrc: "/images/brands/mastercool.jpg", logoAlt: "Logo da Mastercool", active: true, order: 4 },
  { id: "testo", name: "Testo", logoSrc: "/images/brands/testo.jpg", logoAlt: "Logo da Testo", active: true, order: 5 },
  { id: "eolo", name: "Eolo", logoSrc: "/images/brands/eolo.jpg", logoAlt: "Logo da Eolo", active: true, order: 6 },
  { id: "springer-midea", name: "Springer Midea", logoSrc: "/images/brands/springer-midea.jpg", logoAlt: "Logo da Springer Midea", active: true, order: 7 },
  { id: "samsung", name: "Samsung", logoSrc: "/images/brands/samsung.jpg", logoAlt: "Logo da Samsung", active: true, order: 8 },
  { id: "fujitsu", name: "Fujitsu", logoSrc: "/images/brands/fujitsu.jpg", logoAlt: "Logo da Fujitsu", active: true, order: 9 },
  { id: "invicta", name: "Invicta / Vix", logoSrc: "/images/brands/invicta.jpg", logoAlt: "Logo da Invicta/Vix", active: true, order: 10 },
  { id: "dugold", name: "Dugold", logoSrc: "/images/brands/dugold.jpg", logoAlt: "Logo da Dugold", active: true, order: 11 },
  { id: "metalfrio", name: "Metalfrio", logoSrc: "/images/brands/metalfrio.jpg", logoAlt: "Logo da Metalfrio", active: true, order: 12 },
  { id: "fricon", name: "Fricon", logoSrc: "/images/brands/fricon.jpg", logoAlt: "Logo da Fricon", active: true, order: 13 },
  { id: "gelopar", name: "Gelopar", logoSrc: "/images/brands/gelopar.jpg", logoAlt: "Logo da Gelopar", active: true, order: 14 },
  { id: "elgin", name: "Elgin", logoSrc: "/images/brands/elgin.jpg", logoAlt: "Logo da Elgin", active: true, order: 15 },
  { id: "komeco", name: "Komeco", logoSrc: "/images/brands/komeco.jpg", logoAlt: "Logo da Komeco", active: true, order: 16 },
  { id: "carrier", name: "Carrier", logoSrc: "/images/brands/carrier.jpg", logoAlt: "Logo da Carrier", active: true, order: 17 },
  { id: "philco", name: "Philco", logoSrc: "/images/brands/philco.jpg", logoAlt: "Logo da Philco", active: true, order: 18 },
  { id: "lg", name: "LG", logoSrc: "/images/brands/lg.jpg", logoAlt: "Logo da LG", active: true, order: 19 },
  { id: "brastemp", name: "Brastemp", logoSrc: "/images/brands/brastemp.jpg", logoAlt: "Logo da Brastemp", active: true, order: 20 },
  { id: "consul", name: "Consul", logoSrc: "/images/brands/consul.jpg", logoAlt: "Logo da Consul", active: true, order: 21 },
  { id: "electrolux", name: "Electrolux", logoSrc: "/images/brands/electrolux.jpg", logoAlt: "Logo da Electrolux", active: true, order: 22 },
  { id: "mueller", name: "Mueller", logoSrc: "/images/brands/mueller.jpg", logoAlt: "Logo da Mueller", active: true, order: 23 },
  { id: "tramontina", name: "Tramontina", logoSrc: "/images/brands/tramontina.jpg", logoAlt: "Logo da Tramontina", active: true, order: 24 }
];
