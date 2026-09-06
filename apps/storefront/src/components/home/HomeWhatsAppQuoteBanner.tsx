import { storeConfig } from "@/config/store"

const ASSET = "/images/home/banner-orcamento-whatsapp-friggafrio-compacto.png"
const MESSAGE = "Olá! Não encontrei o produto que procuro em estoque e gostaria de solicitar disponibilidade, prazo e orçamento."

export function HomeWhatsAppQuoteBanner() {
  const number = storeConfig.whatsappNumber.replace(/\D/g, "")
  const href = `https://wa.me/${number}?text=${encodeURIComponent(MESSAGE)}`
  return (
    <section className="w-full bg-transparent px-4 py-8 sm:px-6 lg:px-8" aria-label="Solicite um orçamento">
      <div className="mx-auto max-w-7xl">
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Solicitar orçamento pelo WhatsApp" className="block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
          <img src={ASSET} alt="Não encontrou em estoque? A gente encomenda para você. Fale no WhatsApp." className="block aspect-[1881/300] h-auto w-full rounded-xl object-contain" width="1881" height="300" />
        </a>
      </div>
    </section>
  )
}
