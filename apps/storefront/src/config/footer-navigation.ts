export type FooterNavigationItem = {
  id: string
  label: string
  href: string
  external?: boolean
  requiresAuth?: boolean
  active: boolean
  order: number
}

export const footerNavigation = {
  institutional: [
    {
      id: "quem-somos",
      label: "Quem somos",
      href: "/quem-somos",
      active: true,
      order: 1
    },
    {
      id: "nossa-loja",
      label: "Nossa Loja",
      href: "/nossa-loja",
      active: true,
      order: 2
    },
    {
      id: "fale-conosco",
      label: "Fale Conosco",
      href: "/fale-conosco",
      active: true,
      order: 3
    }
  ],
  account: [
    {
      id: "login",
      label: "Fazer login",
      href: "/account/login",
      active: true,
      order: 1
    },
    {
      id: "register",
      label: "Criar conta",
      href: "/account/register",
      active: true,
      order: 2
    },
    {
      id: "my-account",
      label: "Minha conta",
      href: "/account",
      requiresAuth: true,
      active: true,
      order: 3
    },
    {
      id: "orders",
      label: "Meus pedidos",
      href: "/account/orders",
      requiresAuth: true,
      active: true,
      order: 4
    }
  ],
  products: [
    {
      id: "catalog",
      label: "Catálogo",
      href: "/store",
      active: true,
      order: 1
    },
    {
      id: "cart",
      label: "Carrinho",
      href: "/cart",
      active: true,
      order: 2
    }
  ],
  support: [
    {
      id: "help",
      label: "Central de Ajuda",
      href: "/ajuda",
      active: true,
      order: 1
    },
    {
      id: "terms",
      label: "Termos de Uso",
      href: "/termos",
      active: true, // Inativo temporariamente
      order: 2
    },
    {
      id: "privacy",
      label: "Política de Privacidade",
      href: "/privacidade",
      active: true, // Inativo temporariamente
      order: 3
    },
    {
      id: "returns",
      label: "Política de Trocas",
      href: "/trocas",
      active: true, // Inativo temporariamente
      order: 4
    }
  ]
}
