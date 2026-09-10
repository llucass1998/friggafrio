import { Link } from "@tanstack/react-router"
import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"

export interface PromotionalBannerItem {
  id: string
  imageDesktop: string
  imageMobile?: string
  alt: string
  href: string
  objectPosition?: string
  /** @deprecated legacy alias for backwards compatibility */
  src?: string
}

export const DEFAULT_PROMOTIONAL_BANNERS: PromotionalBannerItem[] = [
  {
    id: "ferramentas-manutencao",
    imageDesktop: "/images/home/ferramentas-manutencao-banner.webp",
    src: "/images/home/ferramentas-manutencao-banner.webp",
    alt: "Ferramentas para manutenção",
    href: "/br/categories/ferramentas-manuais",
    objectPosition: "center",
  },
  {
    id: "gases-refrigerantes",
    imageDesktop: "/images/home/gases-refrigerantes-banner.webp",
    src: "/images/home/gases-refrigerantes-banner.webp",
    alt: "Gases refrigerantes",
    href: "/br/categories/gases-refrigerantes",
    objectPosition: "center",
  },
  {
    id: "tubos-cobres",
    imageDesktop: "/images/home/tubos-cobres-banner.webp",
    src: "/images/home/tubos-cobres-banner.webp",
    alt: "Tubos de cobre",
    href: "/br/categories/tubos-de-cobre",
    objectPosition: "center",
  },
]

export interface HomePromotionalBannersProps {
  banners?: readonly PromotionalBannerItem[] | PromotionalBannerItem[]
}

export function HomePromotionalBanners({
  banners = DEFAULT_PROMOTIONAL_BANNERS,
}: HomePromotionalBannersProps = {}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    breakpoints: {
      "(min-width: 768px)": { active: false },
    },
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi]
  )

  return (
    <section
      aria-label="Linhas de produtos FriggaFrio"
      className="bg-[var(--color-background)] pt-3 pb-4 sm:py-6"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={emblaRef} className="overflow-hidden md:overflow-visible">
          <div
            className="ff-home-banners-grid flex touch-pan-y md:grid md:grid-cols-3 md:gap-4 lg:gap-5"
            role="region"
            aria-label="Linhas de produtos em destaque"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") emblaApi?.scrollPrev()
              if (e.key === "ArrowRight") emblaApi?.scrollNext()
            }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="min-w-0 flex-[0_0_100%] md:flex-auto"
                role="group"
                aria-roledescription="slide"
                aria-label={banner.alt}
              >
                <Link
                  to={banner.href as string}
                  aria-label={`Ver produtos de ${banner.alt.toLowerCase()}`}
                  className="ff-home-banner block overflow-hidden rounded-xl bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                >
                  <picture className="block w-full h-full overflow-hidden rounded-xl">
                    {banner.imageMobile ? (
                      <source
                        media="(max-width: 767px)"
                        srcSet={banner.imageMobile}
                      />
                    ) : null}
                    <img
                      src={banner.imageDesktop || banner.src}
                      alt={banner.alt}
                      loading="lazy"
                      style={{
                        objectPosition: banner.objectPosition || "center",
                      }}
                      className="block w-full h-auto aspect-[1200/504] rounded-xl object-cover"
                      width="1200"
                      height="504"
                    />
                  </picture>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Indicadores no mobile */}
        <div
          className="mt-2.5 flex items-center justify-center gap-2 md:hidden"
          aria-label="Navegação dos banners"
        >
          {banners.map((banner, index) => {
            const active = selectedIndex === index
            return (
              <button
                key={banner.id}
                type="button"
                onClick={() => scrollTo(index)}
                className={`h-2.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                  active
                    ? "w-8 bg-[var(--color-primary)]"
                    : "w-2.5 bg-[var(--color-border)] hover:bg-[var(--color-primary)]"
                }`}
                aria-label={`Ir para banner ${index + 1} de ${banners.length}: ${banner.alt}`}
                aria-current={active ? "true" : "false"}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
