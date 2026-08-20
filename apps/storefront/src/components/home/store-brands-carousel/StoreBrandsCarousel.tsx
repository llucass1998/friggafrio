import Autoplay from "embla-carousel-autoplay"
import { useRef } from "react"
import { storeBrands } from "@/config/brands"
import { BrandLogoCard } from "@/components/home/store-brands-carousel/BrandLogoCard"
import { CarouselSectionHeader, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"

export function StoreBrandsCarousel() {
  const activeBrands = storeBrands.filter((brand) => brand.active).sort((a, b) => a.order - b.order)
  const autoplayRef = useRef(Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }))
  const { viewportRef, emblaApi, hasOverflow, scrollPrev, scrollNext } = useInfiniteCarousel([autoplayRef.current])

  const handlePrevious = () => {
    scrollPrev()
    emblaApi?.plugins().autoplay?.reset()
  }

  const handleNext = () => {
    scrollNext()
    emblaApi?.plugins().autoplay?.reset()
  }

  if (activeBrands.length === 0) return null

  return (
    <section className="border-y border-[var(--color-border)] bg-[#f0f9ff]/30 py-8 md:py-10" aria-label="Marcas parceiras da FriggaFrio">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CarouselSectionHeader
          title="Marcas que você encontra na FriggaFrio"
          description="Trabalhamos com produtos de marcas reconhecidas no setor de refrigeração, climatização e controle, conforme a disponibilidade do nosso catálogo."
          hasOverflow={hasOverflow}
          onPrevious={handlePrevious}
          onNext={handleNext}
          previousLabel="Marca anterior"
          nextLabel="Próxima marca"
        />

        <div ref={viewportRef} className="ff-carousel-viewport" data-carousel-viewport="true" role="region" aria-label="Marcas parceiras">
          <div className="ff-carousel-track" data-carousel-track="true">
            {activeBrands.map((brand) => (
              <div key={brand.id} className="ff-carousel-slide ff-brand-slide flex min-w-0" data-carousel-slide="true">
                <BrandLogoCard
                  name={brand.name}
                  logoSrc={brand.logoSrc}
                  logoAlt={brand.logoAlt}
                  websiteUrl={(brand as { websiteUrl?: string }).websiteUrl}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
