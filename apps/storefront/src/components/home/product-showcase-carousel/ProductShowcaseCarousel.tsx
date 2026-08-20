import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { showcaseSlides } from "@/components/home/product-showcase-carousel/carousel-data"
import { ProductShowcaseSlide } from "@/components/home/product-showcase-carousel/ProductShowcaseSlide"
import "@/components/home/product-showcase-carousel/carousel.css"

export function ProductShowcaseCarousel() {
  const autoplayRef = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }),
  )
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", skipSnaps: false },
    [autoplayRef.current],
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const [isPlaying, setIsPlaying] = useState(true)

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return
    setDirection("prev")
    emblaApi.scrollPrev()
    emblaApi.plugins().autoplay?.reset()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (!emblaApi) return
    setDirection("next")
    emblaApi.scrollNext()
    emblaApi.plugins().autoplay?.reset()
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return
      setDirection(index > selectedIndex ? "next" : "prev")
      emblaApi.scrollTo(index)
      emblaApi.plugins().autoplay?.reset()
    },
    [emblaApi, selectedIndex],
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)

    const autoplay = emblaApi.plugins()?.autoplay
    const handleAutoplayPlay = () => setIsPlaying(true)
    const handleAutoplayStop = () => setIsPlaying(false)
    const handleAutoplaySelect = () => {
      if (autoplay?.isPlaying()) setDirection("next")
    }

    if (autoplay) {
      emblaApi.on("autoplay:play", handleAutoplayPlay)
      emblaApi.on("autoplay:stop", handleAutoplayStop)
      emblaApi.on("select", handleAutoplaySelect)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!document.activeElement?.closest('[aria-roledescription="carousel"]')) return
      if (event.key === "ArrowLeft") scrollPrev()
      if (event.key === "ArrowRight") scrollNext()
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
      if (autoplay) {
        emblaApi.off("autoplay:play", handleAutoplayPlay)
        emblaApi.off("autoplay:stop", handleAutoplayStop)
        emblaApi.off("select", handleAutoplaySelect)
      }
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [emblaApi, isPlaying, onSelect, scrollNext, scrollPrev])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (!mediaQuery.matches) return
    emblaApi?.plugins()?.autoplay?.stop()
    setIsPlaying(false)
  }, [emblaApi])

  return (
    <div
      data-testid="home-hero-carousel"
      className="group relative w-full"
      aria-roledescription="carousel"
      aria-label="Destaques de Equipamentos FriggaFrio"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y" style={{ backfaceVisibility: "hidden" }}>
          {showcaseSlides.map((slide, index) => (
            <ProductShowcaseSlide
              key={slide.id}
              slide={slide}
              isActive={index === selectedIndex}
              direction={direction}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollPrev}
        className="absolute left-2 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-white/70 bg-white/75 text-[var(--color-navy)] shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:left-4 sm:h-11 sm:w-11 md:left-6"
        aria-label="Ver slide anterior"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={scrollNext}
        className="absolute right-2 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-white/70 bg-white/75 text-[var(--color-navy)] shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:right-4 sm:h-11 sm:w-11 md:right-6"
        aria-label="Ver próximo slide"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="flex items-center justify-center bg-white py-3">
        <div className="flex gap-2">
          {showcaseSlides.map((_, index) => {
            const active = index === selectedIndex
            return (
              <button
                key={index}
                type="button"
                onClick={() => scrollTo(index)}
                className={`carousel-indicator-bar relative h-2.5 overflow-hidden rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                  active ? "carousel-indicator-active w-12 bg-[var(--color-border)]" : "w-2.5 bg-[var(--color-border)] hover:bg-[var(--color-primary)]"
                }`}
                aria-label={`Ir para o destaque ${index + 1} de ${showcaseSlides.length}`}
                aria-current={active ? "true" : "false"}
                data-playing={isPlaying}
              >
                {active && <div className="carousel-indicator-progress absolute inset-y-0 left-0 bg-[var(--color-primary)]" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
