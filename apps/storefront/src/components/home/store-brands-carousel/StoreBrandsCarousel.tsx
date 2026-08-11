import { useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { storeBrands } from "@/config/brands"
import { BrandLogoCard } from "@/components/home/store-brands-carousel/BrandLogoCard"

export function StoreBrandsCarousel() {
  const activeBrands = storeBrands.filter((brand) => brand.active).sort((a, b) => a.order - b.order)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      containScroll: "trimSnaps",
      dragFree: true,
      loop: true,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  )

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  if (activeBrands.length === 0) {
    return null
  }

  const isFewBrands = activeBrands.length <= 4

  return (
    <section className="py-16 bg-[#f0f9ff]/30 border-y border-[var(--color-border)]" aria-labelledby="brands-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 id="brands-heading" className="text-2xl md:text-3xl font-bold text-[var(--color-navy)] mb-4">
            Marcas que você encontra na FriggaFrio
          </h2>
          <p className="text-[var(--color-text-muted)] text-sm md:text-base">
            Trabalhamos com produtos de marcas reconhecidas no setor de refrigeração, climatização e controle, conforme a disponibilidade do nosso catálogo.
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className={`flex ${isFewBrands ? "md:justify-center" : ""} -ml-4`}>
              {activeBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="pl-4 flex-[0_0_50%] sm:flex-[0_0_33.333%] md:flex-[0_0_25%] lg:flex-[0_0_20%]"
                >
                  <BrandLogoCard
                    name={brand.name}
                    logoSrc={brand.logoSrc}
                    logoAlt={brand.logoAlt}
                    websiteUrl={(brand as any).websiteUrl}
                  />
                </div>
              ))}
            </div>
          </div>

          {!isFewBrands && (
            <>
              <button
                type="button"
                className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-[var(--color-border)] rounded-full items-center justify-center text-[var(--color-navy)] shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] z-10"
                onClick={scrollPrev}
                aria-label="Marca anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-[var(--color-border)] rounded-full items-center justify-center text-[var(--color-navy)] shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] z-10"
                onClick={scrollNext}
                aria-label="Próxima marca"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
