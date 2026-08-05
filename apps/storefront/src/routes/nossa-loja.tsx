import { createFileRoute } from '@tanstack/react-router'
import { PublicStoresPage } from '../pages/public-stores'

export const Route = createFileRoute('/nossa-loja')({
  component: PublicStoresPage,
  head: () => ({
    meta: [
      { title: 'Nossa Loja | FriggaFrio' },
      {
        name: 'description',
        content:
          'Visite a FriggaFrio em Campos Elíseos, São Paulo. Consulte o endereço, veja a localização no mapa e trace a melhor rota até nossa loja.',
      },
      {
        property: 'og:title',
        content: 'Nossa Loja | FriggaFrio',
      },
      {
        property: 'og:description',
        content:
          'Visite a FriggaFrio em Campos Elíseos, São Paulo. Consulte o endereço, veja a localização no mapa e trace a melhor rota até nossa loja.',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: '/nossa-loja',
      },
    ],
  }),
})
