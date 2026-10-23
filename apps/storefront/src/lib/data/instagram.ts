import { sdk } from "@/lib/medusa"
import type { InstagramFeedResponse, InstagramPost } from "@/components/instagram/instagram.types"

const FALLBACK_PROFILE = {
  handle: "@frigga.frio",
  profile_url: "https://www.instagram.com/frigga.frio/",
}

export const AUTHENTIC_SNAPWIDGET_POSTS: InstagramPost[] = [
  {
    id: "ig_18109432793349067",
    instagram_id: "18109432793349067",
    caption:
      "Tem ferramenta que ajuda. E tem ferramenta que evita retrabalho. 🔧❄️ No dia a dia da refrigeração, alguns itens simplesmente não podem ficar de fora da maleta do técnico. Eles ajudam no diagnóstico, dão mais precisão ao serviço e fazem diferença quando o atendimento precisa ser resolvido com agilidade.",
    media_type: "CAROUSEL_ALBUM",
    media_url: "/images/instagram/post-1.jpg",
    thumbnail_url: "/images/instagram/post-1.jpg",
    permalink: "https://www.instagram.com/p/Deh1svIPskQ/",
    timestamp: "2026-10-22T14:00:00.000Z",
  },
  {
    id: "ig_18127526758851585",
    instagram_id: "18127526758851585",
    caption:
      "O R-22 está saindo de cena, e para quem ainda trabalha com sistemas que dependem desse fluido, planejamento deixou de ser opcional. ❄️🔧 Uma das alternativas que vem sendo utilizada em determinadas aplicações é o R-453A. Na Frigga, você encontra o novo fluido refrigerante e também o suporte necessário.",
    media_type: "VIDEO",
    media_url: "/images/instagram/post-2.jpg",
    thumbnail_url: "/images/instagram/post-2.jpg",
    permalink: "https://www.instagram.com/reel/DekR4MvPiVG/",
    timestamp: "2026-10-20T17:30:00.000Z",
  },
  {
    id: "ig_17987154537109327",
    instagram_id: "17987154537109327",
    caption:
      "Era R$ 699,99… mas o Edu resolveu baixar ainda mais. 👀❄️ O compressor entrou em promoção por R$ 699,99 só que ele não deixou barato e mandou o preço para R$ 639. Sim, R$ 639. Uma oportunidade para quem está precisando comprar compressor e quer aproveitar um preço forte aqui.",
    media_type: "VIDEO",
    media_url: "/images/instagram/post-3.jpg",
    thumbnail_url: "/images/instagram/post-3.jpg",
    permalink: "https://www.instagram.com/reel/DesaJY3Pixp/",
    timestamp: "2026-10-17T11:00:00.000Z",
  },
  {
    id: "ig_18412348834092908",
    instagram_id: "18412348834092908",
    caption:
      "Ensinar vai muito além de transmitir conhecimento. É preparar pessoas para resolver problemas, tomar decisões e manter um setor inteiro em movimento. 💙❄️ Hoje, a Frigga homenageia todos os professores que compartilham experiência, técnica e dedicação, formando profissionais cada vez mais preparados.",
    media_type: "IMAGE",
    media_url: "/images/instagram/post-4.jpg",
    thumbnail_url: "/images/instagram/post-4.jpg",
    permalink: "https://www.instagram.com/reel/DexgGcvPCSd/",
    timestamp: "2026-10-15T09:00:00.000Z",
  },
  {
    id: "ig_17946936102069574",
    instagram_id: "17946936102069574",
    caption:
      "Manutenção preventiva em sistemas de refrigeração comercial e residencial: segurança, durabilidade e alta performance para o seu equipamento. Conte com a FriggaFrio para peças originais e pronta entrega.",
    media_type: "VIDEO",
    media_url: "/images/instagram/post-5.jpg",
    thumbnail_url: "/images/instagram/post-5.jpg",
    permalink: "https://www.instagram.com/frigga.frio/",
    timestamp: "2026-10-10T15:00:00.000Z",
  },
]

export async function getInstagramFeed(): Promise<InstagramFeedResponse> {
  try {
    const data = await sdk.client.fetch<InstagramFeedResponse>("/store/instagram-feed", {
      method: "GET",
    })

    if (data && Array.isArray(data.posts) && data.posts.length > 0) {
      return data
    }

    return {
      posts: AUTHENTIC_SNAPWIDGET_POSTS || [],
      count: AUTHENTIC_SNAPWIDGET_POSTS.length,
      last_sync_at: new Date().toISOString(),
      profile: FALLBACK_PROFILE,
    }
  } catch {
    return {
      posts: [],
      count: 0,
      last_sync_at: null,
      profile: FALLBACK_PROFILE,
    }
  }
}
