export type FooterNavigationItem = {
  id: string
  label: string
  active: boolean
  order: number
}

// We remove 'href' to avoid dynamic string routes bypassing TanStack's static types.
// The routes are statically resolved inside the Footer component based on the 'id'.
export const footerNavigation = {
  institutional: [
    {
      id: "quem-somos",
      label: "Quem somos",
      active: true,
      order: 1
    },
    {
      id: "nossa-loja",
      label: "Nossa Loja",
      active: true,
      order: 2
    },
    {
      id: "fale-conosco",
      label: "Fale Conosco",
      active: true,
      order: 3
    }
  ],
  account: [
    {
      id: "login",
      label: "Fazer login",
      active: true,
      order: 1
    },
    {
      id: "register",
      label: "Criar conta",
      active: true,
      order: 2
    },
    {
      id: "my-account",
      label: "Minha conta",
      active: true,
      order: 3
    },
    {
      id: "orders",
      label: "Meus pedidos",
      active: true,
      order: 4
    }
  ],
  products: [
    {
      id: "catalog",
      label: "Catálogo",
      active: true,
      order: 1
    },
    {
      id: "cart",
      label: "Carrinho",
      active: true,
      order: 2
    }
  ],
  support: [
    {
      id: "help",
      label: "Central de Ajuda",
      active: true,
      order: 1
    },
    {
      id: "terms",
      label: "Termos de Uso",
      active: true,
      order: 2
    },
    {
      id: "privacy",
      label: "Política de Privacidade",
      active: true,
      order: 3
    },
    {
      id: "returns",
      label: "Política de Trocas",
      active: true,
      order: 4
    }
  ]
}
