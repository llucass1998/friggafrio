import { Link } from "@tanstack/react-router"
import { MessageCircle, ShoppingBag, Store } from "lucide-react"
import { storeConfig } from "@/config/store"

export function HomeInstitutionalContact() {
  const whatsappUrl = `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(
    "Olá! Estou no site da FriggaFrio e gostaria de falar com a equipe especializada."
  )}`

  return (
    <section
      aria-labelledby="institutional-contact-title"
      className="bg-[var(--color-navy)] text-white py-14 sm:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2
          id="institutional-contact-title"
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight"
        >
          Precisa de soluções para refrigeração?
        </h2>

        <p className="mt-4 text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
          Entre em contato com nossa equipe especializada ou conheça nosso catálogo de produtos.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-98 shadow-sm"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Fale pelo WhatsApp
          </a>

          <Link
            to="/store"
            className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-98 backdrop-blur-sm"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            Conheça nosso catálogo
          </Link>

          <Link
            to="/nossa-loja"
            className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/30 bg-transparent px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-98"
          >
            <Store className="h-5 w-5" aria-hidden="true" />
            Nossas lojas
          </Link>
        </div>
      </div>
    </section>
  )
}
