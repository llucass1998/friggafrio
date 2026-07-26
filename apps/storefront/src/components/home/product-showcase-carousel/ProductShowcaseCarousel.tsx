import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { useCallback, useEffect, useState, useRef } from "react"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { showcaseSlides } from "@/components/home/product-showcase-carousel/carousel-data"
import { ProductShowcaseSlide } from "@/components/home/product-showcase-carousel/ProductShowcaseSlide"
import "./carousel.css"

export function ProductShowcaseCarousel() {
  const autoplayRef = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true })
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", skipSnaps: false },
    [autoplayRef.current]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  const toggleAutoplay = useCallback(() => {
    const autoplay = emblaApi?.plugins()?.autoplay
    if (!autoplay) return

    if (autoplay.isPlaying()) {
      autoplay.stop()
      setIsPlaying(false)
    } else {
      autoplay.play()
      setIsPlaying(true)
    }
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

    const autoplay = emblaApi?.plugins()?.autoplay
    if (autoplay) {
      emblaApi.on("autoplay:play", () => setIsPlaying(true))
      emblaApi.on("autoplay:stop", () => setIsPlaying(false))
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.closest('[aria-roledescription="carousel"]')) {
        if (e.key === "ArrowLeft") scrollPrev()
        if (e.key === "ArrowRight") scrollNext()
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        autoplay?.stop()
      } else if (isPlaying) {
        autoplay?.play()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [emblaApi, onSelect, scrollPrev, scrollNext, isPlaying])

  // Reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mediaQuery.matches) {
      const autoplay = emblaApi?.plugins()?.autoplay
      autoplay?.stop()
      setIsPlaying(false)
    }
  }, [emblaApi])

  return (
    <div
      className="relative w-full mx-auto group"
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
        className="absolute left-6 top-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-[var(--color-primary)] hover:bg-white hover:scale-105 hover:shadow-lg transition-all duration-180 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 z-40 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] active:scale-95"
        aria-label="Ver slide anterior"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>

      <button
        onClick={scrollNext}
        disabled={!canScrollNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-[var(--color-primary)] hover:bg-white hover:scale-105 hover:shadow-lg transition-all duration-180 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 z-40 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] active:scale-95"
        aria-label="Ver próximo slide"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Indicadores e Controles Inferiores */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-40">
        <button
          onClick={toggleAutoplay}
          className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors focus-visible:outline-2 focus-visible:outline-white"
          aria-label={isPlaying ? "Pausar apresentação" : "Retomar apresentação"}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        <div className="flex gap-2">
          {showcaseSlides.map((_, index) => {
            const active = index === selectedIndex
            return (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`carousel-indicator-bar relative h-2.5 rounded-full overflow-hidden focus-visible:outline-2 focus-visible:outline-white ${
                  active ? "carousel-indicator-active w-12 bg-white/30" : "w-2.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Ir para o slide ${index + 1}`}
                aria-current={active ? "true" : "false"}
                data-playing={isPlaying}
              >
                {active && (
                  <div className="carousel-indicator-progress absolute inset-y-0 left-0 bg-white" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
