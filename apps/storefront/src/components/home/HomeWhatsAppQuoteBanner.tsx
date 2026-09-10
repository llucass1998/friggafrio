import { storeConfig } from "@/config/store"

const DEFAULT_ASSET = "/images/home/banner-orcamento-whatsapp-friggafrio-compacto.png"
const DEFAULT_ALT = "Não encontrou o produto? Peça um orçamento pelo WhatsApp"
const DEFAULT_MESSAGE =
  "Olá! Não encontrou o produto que procuro em estoque e gostaria de solicitar disponibilidade, prazo e orçamento."

export interface HomeWhatsAppQuoteBannerProps {
  imageDesktop?: string
  imageMobile?: string
  alt?: string
  message?: string
}

export function HomeWhatsAppQuoteBanner({
  imageDesktop = DEFAULT_ASSET,
  imageMobile,
  alt = DEFAULT_ALT,
  message = DEFAULT_MESSAGE,
}: HomeWhatsAppQuoteBannerProps = {}) {
  const number = storeConfig.whatsappNumber.replace(/\D/g, "")
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`

  return (
    <section
      className="w-full bg-transparent px-4 py-8 sm:px-6 lg:px-8"
      aria-label="Solicite um orçamento"
    >
      <div className="mx-auto max-w-7xl w-full">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={alt}
          className="block w-full overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <picture className="block w-full overflow-hidden rounded-xl">
            {imageMobile ? (
              <source media="(max-width: 767px)" srcSet={imageMobile} />
            ) : null}
            <img
              src={imageDesktop}
              alt={alt}
              loading="lazy"
              className="block w-full h-auto rounded-xl object-contain"
              width="1881"
              height="300"
            />
          </picture>
        </a>
      </div>
    </section>
  )
}
