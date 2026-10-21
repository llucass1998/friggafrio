import { StoreLocation, storeLocations } from "@/config/store-locations"

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
  phone: "(11) 3224-1670",
  whatsappNumber: "5511921396007",
  instagramUrl: "https://www.instagram.com/frigga.frio/",
  locations: storeLocations,
} as const
