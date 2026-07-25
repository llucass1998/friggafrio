import { StoreLocation, storeLocations } from "./store-locations"

export type StoreConfig = {
  name: string;
  subtitle: string;
  description: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  instagramUrl: string;
  locations: readonly StoreLocation[];
};

export const storeConfig: StoreConfig = {
  name: "FriggaFrio",
  subtitle: "Refrigeração e Ar Condicionado",
  description: "Especialistas em Refrigeração. Encontre gases refrigerantes, compressores, componentes, ferramentas e soluções técnicas para instalações residenciais, comerciais e industriais.",
  email: "contato@friggafrio.com.br",
  phone: "(11) 4580-1227",
  whatsappNumber: "5511948777156",
  instagramUrl: "https://www.instagram.com/frigga.frio/",
  locations: storeLocations,
} as const;
