export type StoreAddress = {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type StoreLocation = {
  id: string;
  name: string;
  shortName: string;
  type: "store";
  isPrimary: boolean;
  address: StoreAddress;
};

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
  locations: [
    {
      id: "loja-1",
      name: "FriggaFrio — Loja 1",
      shortName: "Loja 1",
      type: "store",
      isPrimary: true,
      address: {
        street: "Alameda Glete",
        number: "663",
        district: "Campos Elíseos",
        city: "São Paulo",
        state: "SP",
        postalCode: "01215-001",
        country: "Brasil",
      },
    },
    {
      id: "loja-2",
      name: "FriggaFrio — Loja 2",
      shortName: "Loja 2",
      type: "store",
      isPrimary: false,
      address: {
        street: "Alameda Glete",
        number: "926",
        district: "Campos Elíseos",
        city: "São Paulo",
        state: "SP",
        postalCode: "01215-001",
        country: "Brasil",
      },
    },
  ],
} as const;
