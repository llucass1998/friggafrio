import { Link } from "@tanstack/react-router"

const banners = [
  { id: "ferramentas-manutencao", src: "/images/home/ferramentas-manutencao-banner.webp", alt: "Ferramentas para manutenção", href: "/br/categories/ferramentas-manuais" },
  { id: "gases-refrigerantes", src: "/images/home/gases-refrigerantes-banner.webp", alt: "Gases refrigerantes", href: "/br/categories/gases-refrigerantes" },
  { id: "tubos-cobres", src: "/images/home/tubos-cobres-banner.webp", alt: "Tubos de cobre", href: "/br/categories/tubos-de-cobre" },
] as const

export function HomePromotionalBanners() {
  return (
    <section aria-label="Linhas de produtos FriggaFrio" className="bg-[var(--color-background)] py-4 sm:py-6">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="ff-home-banners-grid">
          {banners.map((banner) => (
            <Link key={banner.id} to={banner.href as string} aria-label={`Ver produtos de ${banner.alt.toLowerCase()}`} className="ff-home-banner focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
              <img src={banner.src} alt={banner.alt} loading="lazy" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
