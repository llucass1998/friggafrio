import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { showcaseSlides } from "./carousel-data"
import { ProductShowcaseSlide } from "./ProductShowcaseSlide"

export function ProductShowcaseCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)

    // Suporte ao teclado acessível
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.closest('[aria-roledescription="carousel"]')) {
        if (e.key === "ArrowLeft") scrollPrev();
        if (e.key === "ArrowRight") scrollNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [emblaApi, onSelect, scrollPrev, scrollNext])

  return (
    <div
      className="relative w-full mx-auto"
      aria-roledescription="carousel"
      aria-label="Destaques de Equipamentos Friggafrio"
    >
      {/* Viewport */}
      <div className="overflow-hidden rounded-[var(--radius-card-lg)]" ref={emblaRef}>
        <div className="flex touch-pan-y" style={{ backfaceVisibility: "hidden" }}>
          {showcaseSlides.map((slide, index) => (
            <ProductShowcaseSlide
              key={slide.id}
              slide={slide}
              isActive={index === selectedIndex}
            />
          ))}
        </div>
      </div>

      {/* Navegação Prev / Next Desktop */}
      <button
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[var(--color-primary)] hover:bg-white hover:text-[var(--color-navy)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 z-40 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
        aria-label="Ver slide anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={scrollNext}
        disabled={!canScrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[var(--color-primary)] hover:bg-white hover:text-[var(--color-navy)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 z-40 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
        aria-label="Ver próximo slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicadores Dot */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-40">
        {showcaseSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${
              index === selectedIndex
                ? "bg-white w-8 shadow-sm"
                : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Ir para o slide ${index + 1}`}
            aria-current={index === selectedIndex ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  )
}
